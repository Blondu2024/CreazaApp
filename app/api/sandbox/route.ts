import { NextRequest } from "next/server";
import { createSandbox, getSandbox, writeFilesAndStart, type FileToWrite } from "@/lib/e2b";

// GET — diagnostic (temporary)
export async function GET() {
  const allKeys = Object.keys(process.env).sort();
  const e2bRelated = allKeys.filter(k => k.toLowerCase().includes("e2b"));
  const customKeys = allKeys.filter(k =>
    !k.startsWith("npm_") && !k.startsWith("NODE") && !k.startsWith("PATH") &&
    !k.startsWith("HOME") && !k.startsWith("HOSTNAME") && !k.startsWith("__")
  );
  return Response.json({
    e2bKeys: e2bRelated,
    hasE2B: !!process.env["E2B_API_KEY"],
    hasOpenRouter: !!process.env["OPENROUTER_API_KEY"],
    customKeys: customKeys.slice(0, 30),
    totalEnvVars: allKeys.length,
  });
}

// POST — create sandbox or write files
export async function POST(req: NextRequest) {
  try {
    if (!process.env["E2B_API_KEY"]) {
      console.error("[sandbox] E2B_API_KEY is not set!");
      return Response.json({ error: "E2B_API_KEY nu este configurată pe server" }, { status: 500 });
    }
    const body = await req.json();
    const { action, sandboxId, files } = body as {
      action: "create" | "write";
      sandboxId?: string;
      files?: FileToWrite[];
    };

    if (action === "create") {
      const sandbox = await createSandbox();
      return Response.json({ sandboxId: sandbox.sandboxId });
    }

    if (action === "write" && sandboxId && files) {
      const sandbox = await getSandbox(sandboxId);
      if (!sandbox) {
        return Response.json({ error: "Sandbox not found" }, { status: 404 });
      }
      const previewUrl = await writeFilesAndStart(sandbox, files);
      return Response.json({ previewUrl });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Sandbox error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Sandbox error" },
      { status: 500 }
    );
  }
}
