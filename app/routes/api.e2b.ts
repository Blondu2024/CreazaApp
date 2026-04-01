/**
 * Server-side E2B API — handles all E2B SDK calls
 *
 * E2B SDK needs Node.js, so all calls go through this Remix action.
 * The browser-side adapter (app/lib/e2b/sandbox.ts) calls this endpoint.
 */
import { type ActionFunctionArgs, json } from '@remix-run/node';
import { Sandbox } from '@e2b/sdk';

/*
 * E2B API key — baked at Docker build time via VITE_E2B_API_KEY env var.
 *
 * Railway injects service variables as Docker build args.
 * Vite bakes VITE_*-prefixed vars into import.meta.env at build time.
 * This bypasses the vite-plugin-node-polyfills issue with process.env.
 */
function getE2BApiKey(): string | undefined {
  return import.meta.env.VITE_E2B_API_KEY;
}

// Keep track of active sandboxes
const activeSandboxes = new Map<string, Sandbox>();

async function getSandbox(sandboxId: string): Promise<Sandbox> {
  let sandbox = activeSandboxes.get(sandboxId);

  if (!sandbox) {
    // Reconnect to existing sandbox
    sandbox = await Sandbox.connect(sandboxId, { apiKey: getE2BApiKey() });
    activeSandboxes.set(sandboxId, sandbox);
  }

  return sandbox;
}

export async function action({ request }: ActionFunctionArgs) {
  if (!getE2BApiKey()) {
    return json({ error: 'E2B_API_KEY not configured' }, { status: 500 });
  }

  const body = (await request.json()) as Record<string, any>;
  const { action: act } = body;

  try {
    switch (act) {
      case 'create-sandbox': {
        const sandbox = await Sandbox.create({
          apiKey: getE2BApiKey(),
          timeoutMs: 10 * 60 * 1000,
        });

        activeSandboxes.set(sandbox.sandboxId, sandbox);

        // Setup working directory
        const workdir = body.workdirName ? `/home/user/${body.workdirName}` : '/home/user/project';

        try {
          await sandbox.files.makeDir(workdir);
        } catch {
          // may exist
        }

        // Ensure Node.js is available
        try {
          const check = await sandbox.commands.run('node --version');

          if (check.exitCode !== 0) {
            await sandbox.commands.run(
              'curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs',
            );
          }
        } catch {
          // best effort
        }

        return json({ sandboxId: sandbox.sandboxId, workdir });
      }

      case 'write-file': {
        const sandbox = await getSandbox(body.sandboxId);

        // Ensure parent dir
        const dir = body.path.substring(0, body.path.lastIndexOf('/'));

        if (dir) {
          try {
            await sandbox.files.makeDir(dir);
          } catch {
            // may exist
          }
        }

        await sandbox.files.write(body.path, body.content);

        return json({ ok: true });
      }

      case 'read-file': {
        const sandbox = await getSandbox(body.sandboxId);
        const content = await sandbox.files.read(body.path);

        return json({ content });
      }

      case 'list-dir': {
        const sandbox = await getSandbox(body.sandboxId);
        const entries = await sandbox.files.list(body.path);

        return json({ entries });
      }

      case 'mkdir': {
        const sandbox = await getSandbox(body.sandboxId);
        await sandbox.files.makeDir(body.path);

        return json({ ok: true });
      }

      case 'remove': {
        const sandbox = await getSandbox(body.sandboxId);
        await sandbox.files.remove(body.path);

        return json({ ok: true });
      }

      case 'spawn': {
        const sandbox = await getSandbox(body.sandboxId);
        let output = '';

        const proc = await sandbox.commands.run(body.command, {
          cwd: body.cwd,
          onStdout: (data) => {
            output += data;
          },
          onStderr: (data) => {
            output += data;
          },
        });

        return json({
          processId: `proc-${Date.now()}`,
          output,
          exitCode: proc.exitCode,
          done: true,
        });
      }

      case 'get-ports': {
        const sandbox = await getSandbox(body.sandboxId);
        const ports = [3000, 3001, 4173, 5173, 8080, 8000]
          .map((port) => {
            try {
              const host = sandbox.getHost(port);
              return { port, url: `https://${host}` };
            } catch {
              return null;
            }
          })
          .filter(Boolean);

        return json({ ports });
      }

      case 'kill-sandbox': {
        const sandbox = activeSandboxes.get(body.sandboxId);

        if (sandbox) {
          await sandbox.kill();
          activeSandboxes.delete(body.sandboxId);
        }

        return json({ ok: true });
      }

      default:
        return json({ error: `Unknown action: ${act}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error(`[E2B API] Error in ${act}:`, error);
    return json({ error: error.message }, { status: 500 });
  }
}
