import { streamText, convertToModelMessages } from "ai";
import { openrouter, DEFAULT_MODEL, SYSTEM_PROMPT, buildSystemPromptWithContext } from "@/lib/ai";

// Vercel free tier: max 60s for streaming
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const messages = body.messages || [];
    const model = body.model || DEFAULT_MODEL;
    const currentFiles = body.currentFiles || [];
    const chatHistory = body.chatHistory || [];

    const modelMessages = await convertToModelMessages(messages);

    // Build context-aware system prompt
    const systemPrompt = (currentFiles.length > 0 || chatHistory.length > 0)
      ? buildSystemPromptWithContext({ currentFiles, chatHistory })
      : SYSTEM_PROMPT;

    console.log("[chat] Model:", model);
    console.log("[chat] Messages:", modelMessages.length);
    console.log("[chat] Files:", currentFiles.length);
    console.log("[chat] History:", chatHistory.length);
    console.log("[chat] System prompt length:", systemPrompt.length, "chars");

    const result = streamText({
      model: openrouter(model),
      system: systemPrompt,
      messages: modelMessages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[chat] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Chat error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
