import { NextRequest } from "next/server";
import { createSandbox, getSandbox, writeFilesAndStart, type FileToWrite } from "@/lib/e2b";
import { rateLimit, rateLimitResponse, getClientIP } from "@/lib/rate-limit";

// POST — create sandbox or write files
export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 requests/min per IP
    const rl = rateLimit(`sandbox:${getClientIP(req)}`, 10, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetIn);
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
      const result = await writeFilesAndStart(sandbox, files);
      if (result.error) {
        return Response.json({ error: result.error, logs: result.logs }, { status: 500 });
      }
      return Response.json({ previewUrl: result.previewUrl, logs: result.logs });
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
