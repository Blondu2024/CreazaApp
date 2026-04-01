import { NextRequest } from "next/server";
import { createSandbox, getSandbox, writeFilesAndStart, type FileToWrite } from "@/lib/e2b";

// POST — create sandbox or write files
export async function POST(req: NextRequest) {
  try {
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
