import { streamText, convertToModelMessages, type TextPart, type ImagePart } from "ai";
import { openrouter, DEFAULT_MODEL, SYSTEM_PROMPT, buildSystemPromptWithContext, estimateTokens } from "@/lib/ai";
import { PLANS, PRO_MODELS, ULTRA_MODELS, getModelCostOrMinimum, estimateCreditCost, checkCredits, deductCredits, getUserCredits, ensureProfile } from "@/lib/credits";

// Vercel Pro: max 300s for streaming
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const messages = body.messages || [];
    const requestedModel = body.model || DEFAULT_MODEL;
    const currentFiles = body.currentFiles || [];
    const chatHistory = body.chatHistory || [];
    const summary = body.summary || undefined;
    const errors = body.errors || undefined;
    const images: string[] = body.images || [];
    const documents: { name: string; content: string }[] = body.documents || [];
    const userId: string | undefined = body.userId;

    // Determine model based on user's plan
    let model = DEFAULT_MODEL;
    let tier: "free" | "pro" = "free";

    if (userId) {
      const credits = await ensureProfile(userId);
      const plan = PLANS[credits.plan] || PLANS.free;
      tier = (credits.plan === "pro" || credits.plan === "ultra") ? "pro" : "free";

      if (plan.canChooseModel) {
        // Pro/Ultra: validate requested model is in allowed list
        const allowedModels = credits.plan === "ultra" ? ULTRA_MODELS : PRO_MODELS;
        model = allowedModels.includes(requestedModel) ? requestedModel : plan.model;
      } else {
        // Free/Starter: forced model, ignore client request
        model = plan.model;
      }

      // Credit pre-check
      const estimated = estimateCreditCost(model);
      const { allowed, balance } = await checkCredits(userId, estimated);
      if (!allowed) {
        return new Response(
          JSON.stringify({
            error: "insufficient_credits",
            message: "Credite insuficiente. Cumpara credite sau asteapta resetarea lunara.",
            balance,
            estimatedCost: estimated,
          }),
          { status: 402, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    let modelMessages = await convertToModelMessages(messages);

    modelMessages = modelMessages.filter((m: { role: string; content: unknown }) => {
      if (typeof m.content === "string") return m.content.trim().length > 0;
      if (Array.isArray(m.content)) return m.content.length > 0;
      return true;
    });

    // Build context-aware system prompt with token budgeting
    const systemPrompt = (currentFiles.length > 0 || chatHistory.length > 0)
      ? buildSystemPromptWithContext({ currentFiles, chatHistory, tier, summary, errors })
      : SYSTEM_PROMPT;

    // Inject images/documents into the last user message
    if (images.length > 0 || documents.length > 0) {
      const lastUserIdx = modelMessages.findLastIndex((m: { role: string }) => m.role === "user");
      if (lastUserIdx >= 0) {
        const lastMsg = modelMessages[lastUserIdx];
        const textContent = typeof lastMsg.content === "string" ? lastMsg.content : "";
        const parts: (TextPart | ImagePart)[] = [];

        if (documents.length > 0) {
          const docText = documents.map((d: { name: string; content: string }) => `\n[Document: ${d.name}]\n${d.content}`).join("\n");
          parts.push({ type: "text" as const, text: textContent + docText });
        } else {
          parts.push({ type: "text" as const, text: textContent });
        }

        for (const img of images) {
          parts.push({ type: "image" as const, image: new URL(img) });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (modelMessages[lastUserIdx] as any).content = parts;
      }
    }

    console.log("[chat] Model:", model, `(plan: ${tier})`);
    console.log("[chat] User:", userId || "anonymous");
    console.log("[chat] Messages:", modelMessages.length);
    console.log("[chat] System prompt:", Math.ceil(systemPrompt.length / 4), "tokens");

    const result = streamText({
      model: openrouter(model),
      system: systemPrompt,
      messages: modelMessages,
      onFinish: async ({ usage }) => {
        if (!userId) return;

        const inputTokens = usage.inputTokens || estimateTokens(systemPrompt);
        const outputTokens = usage.outputTokens || 5000;

        const cost = getModelCostOrMinimum(model, inputTokens, outputTokens);
        if (cost > 0) {
          const modelLabel = model.split("/").pop() || model;
          const deductResult = await deductCredits(userId, cost, {
            model,
            inputTokens,
            outputTokens,
            description: `${modelLabel}: ${inputTokens} in / ${outputTokens} out`,
          });
          console.log("[credits]", modelLabel, `cost=${cost.toFixed(2)} cr`, deductResult.success ? "OK" : "FAIL",
            `remaining=${deductResult.monthly}+${deductResult.topup}`);
        }
      },
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
