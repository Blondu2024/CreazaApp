import { Sandbox } from "e2b";

const SANDBOX_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const SERVER_STARTUP_MS = 3000;

// Read env var dynamically to prevent Next.js bundler from inlining it at build time
function getE2BKey(): string {
  return process.env["E2B_API_KEY"] ?? "";
}

// Keep track of active sandboxes
const sandboxes = new Map<string, Sandbox>();

export async function createSandbox(): Promise<Sandbox> {
  const sandbox = await Sandbox.create("base", {
    apiKey: getE2BKey(),
    timeoutMs: SANDBOX_TIMEOUT,
  });
  sandboxes.set(sandbox.sandboxId, sandbox);
  return sandbox;
}

export async function getSandbox(sandboxId: string): Promise<Sandbox | null> {
  const existing = sandboxes.get(sandboxId);
  if (existing) return existing;

  try {
    const sandbox = await Sandbox.connect(sandboxId, {
      apiKey: getE2BKey(),
    });
    sandboxes.set(sandboxId, sandbox);
    return sandbox;
  } catch {
    return null;
  }
}

export interface FileToWrite {
  path: string;
  content: string;
}

export interface SandboxResult {
  previewUrl: string;
  logs: string[];
  error?: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function writeFilesAndStart(
  sandbox: Sandbox,
  files: FileToWrite[]
): Promise<SandboxResult> {
  const logs: string[] = [];

  // Write all files
  for (const file of files) {
    await sandbox.files.write(file.path, file.content);
    logs.push(`[write] ${file.path}`);
  }

  const hasPackageJson = files.some((f) => f.path.includes("package.json"));

  if (hasPackageJson) {
    // React/Node project — npm install + dev server
    const install = await sandbox.commands.run("cd /home/user/app && npm install", {
      timeoutMs: 120000,
    });
    if (install.exitCode !== 0) {
      const err = install.stderr || install.stdout;
      logs.push(`[npm install] EROARE: ${err}`);
      return { previewUrl: "", logs, error: `npm install a esuat: ${err}` };
    }
    logs.push(`[npm install] OK`);

    // Start dev server in background (it never exits)
    sandbox.commands.run(
      "cd /home/user/app && npm run dev -- --port 3000",
      { timeoutMs: SANDBOX_TIMEOUT, onStdout: () => {}, onStderr: () => {} }
    );
    logs.push(`[server] npm run dev pornit pe port 3000`);
  } else {
    // Static HTML — start serve in background
    sandbox.commands.run(
      "cd /home/user/app && npx -y serve -l 3000 .",
      { timeoutMs: SANDBOX_TIMEOUT, onStdout: () => {}, onStderr: () => {} }
    );
    logs.push(`[server] serve pornit pe port 3000`);
  }

  // Wait for server to start
  await sleep(SERVER_STARTUP_MS);

  const previewUrl = `https://${sandbox.getHost(3000)}`;
  logs.push(`[preview] ${previewUrl}`);

  return { previewUrl, logs };
}

const LANG_TO_FILE: Record<string, string> = {
  html: "index.html",
  css: "styles.css",
  javascript: "script.js",
  js: "script.js",
  jsx: "App.jsx",
  tsx: "App.tsx",
  typescript: "App.ts",
  ts: "App.ts",
  json: "package.json",
};

export function parseCodeBlocks(
  content: string
): FileToWrite[] {
  const files: FileToWrite[] = [];
  const regex = /```(\S+)\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const tag = match[1];
    const code = match[2].trim();
    const filename = tag.includes(".") || tag.includes("/") ? tag : LANG_TO_FILE[tag.toLowerCase()];

    if (filename) {
      files.push({
        path: `/home/user/app/${filename}`,
        content: code,
      });
    }
  }

  return files;
}
