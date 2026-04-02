import { Sandbox } from "e2b";

const SANDBOX_TIMEOUT = 5 * 60 * 1000; // 5 minutes

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

export async function writeFilesAndStart(
  sandbox: Sandbox,
  files: FileToWrite[]
): Promise<string> {
  // Write all files
  for (const file of files) {
    await sandbox.files.write(file.path, file.content);
  }

  // Install dependencies if package.json exists
  const hasPackageJson = files.some((f) => f.path.includes("package.json"));
  if (hasPackageJson) {
    await sandbox.commands.run("cd /home/user/app && npm install", {
      timeoutMs: 60000,
    });
  }

  // Start dev server
  const process = await sandbox.commands.run(
    "cd /home/user/app && npm run dev -- --port 3000",
    {
      timeoutMs: 5000,
      onStdout: () => {},
      onStderr: () => {},
    }
  );

  // Return the preview URL
  return `https://${sandbox.getHost(3000)}`;
}

export function parseCodeBlocks(
  content: string
): FileToWrite[] {
  const files: FileToWrite[] = [];
  const regex = /```(\S+)\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const filename = match[1];
    const code = match[2].trim();

    // Skip non-file code blocks (like "bash", "json" without path)
    if (filename.includes(".") || filename.includes("/")) {
      files.push({
        path: `/home/user/app/${filename}`,
        content: code,
      });
    }
  }

  return files;
}
