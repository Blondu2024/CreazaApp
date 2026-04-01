import { streamText, convertToModelMessages } from "ai";
import { openrouter, DEFAULT_MODEL, SYSTEM_PROMPT } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("[chat] Request keys:", Object.keys(body));
    console.log("[chat] Model:", body.model);
    console.log("[chat] Messages count:", body.messages?.length);

    // SDK v6 sends UIMessages with `parts` array
    const messages = body.messages || [];
    const model = body.model || DEFAULT_MODEL;

    // Convert UIMessage[] to ModelMessage[] for streamText
    const modelMessages = await convertToModelMessages(messages);

    console.log("[chat] Using model:", model);
    console.log("[chat] Converted messages:", modelMessages.length);

    const result = streamText({
      model: openrouter(model),
      system: SYSTEM_PROMPT,
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
