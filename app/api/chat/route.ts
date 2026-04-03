import { streamText, convertToModelMessages, type TextPart, type ImagePart } from "ai";
import { openrouter, DEFAULT_MODEL, SYSTEM_PROMPT, buildSystemPromptWithContext } from "@/lib/ai";

// Vercel Pro: max 300s for streaming
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const messages = body.messages || [];
    const model = body.model || DEFAULT_MODEL;
    const currentFiles = body.currentFiles || [];
    const chatHistory = body.chatHistory || [];
    const tier = body.tier || "free";
    const summary = body.summary || undefined;
    const errors = body.errors || undefined;
    const images: string[] = body.images || [];
    const documents: { name: string; content: string }[] = body.documents || [];

    let modelMessages = await convertToModelMessages(messages);

    // Sanitize: remove empty messages and fix consecutive same-role messages
    modelMessages = modelMessages.filter((m: { role: string; content: unknown }) => {
      if (typeof m.content === "string") return m.content.trim().length > 0;
      if (Array.isArray(m.content)) return m.content.length > 0;
      return true;
    });

    // Build context-aware system prompt with token budgeting
    const systemPrompt = (currentFiles.length > 0 || chatHistory.length > 0)
      ? buildSystemPromptWithContext({ currentFiles, chatHistory, tier, summary, errors })
      : SYSTEM_PROMPT;

    // Inject images/documents into the last user message as multimodal content
    if (images.length > 0 || documents.length > 0) {
      const lastUserIdx = modelMessages.findLastIndex((m: { role: string }) => m.role === "user");
      if (lastUserIdx >= 0) {
        const lastMsg = modelMessages[lastUserIdx];
        const textContent = typeof lastMsg.content === "string" ? lastMsg.content : "";
        const parts: (TextPart | ImagePart)[] = [];

        // Add document text as context
        if (documents.length > 0) {
          const docText = documents.map((d: { name: string; content: string }) => `\n[Document: ${d.name}]\n${d.content}`).join("\n");
          parts.push({ type: "text" as const, text: textContent + docText });
        } else {
          parts.push({ type: "text" as const, text: textContent });
        }

        // Add images as base64 data URLs
        for (const img of images) {
          parts.push({ type: "image" as const, image: new URL(img) });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (modelMessages[lastUserIdx] as any).content = parts;
      }
    }

    console.log("[chat] Model:", model);
    console.log("[chat] Tier:", tier);
    console.log("[chat] Messages:", modelMessages.length);
    console.log("[chat] Images:", images.length);
    console.log("[chat] Documents:", documents.length);
    console.log("[chat] System prompt length:", systemPrompt.length, "chars (~", Math.ceil(systemPrompt.length / 4), "tokens)");

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
