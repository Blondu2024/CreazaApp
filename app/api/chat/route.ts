import { streamText } from "ai";
import { openrouter, DEFAULT_MODEL, SYSTEM_PROMPT } from "@/lib/ai";

export async function POST(req: Request) {
  const { messages, model } = await req.json();

  const result = streamText({
    model: openrouter(model || DEFAULT_MODEL),
    system: SYSTEM_PROMPT,
    messages,
  });

  return result.toUIMessageStreamResponse();
}
