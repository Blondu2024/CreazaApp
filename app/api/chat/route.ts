import { streamText, convertToModelMessages, tool, stepCountIs, type TextPart, type ImagePart } from "ai";
import { z } from "zod";
import { openrouter, DEFAULT_MODEL, SYSTEM_PROMPT, buildSystemPromptWithContext, estimateTokens } from "@/lib/ai";
import { PLANS, PRO_MODELS, ULTRA_MODELS, getModelCostOrMinimum, estimateCreditCost, checkCredits, deductCredits, getUserCredits, ensureProfile } from "@/lib/credits";
import { rateLimit, rateLimitResponse, getClientIP } from "@/lib/rate-limit";
import { verifyAuth } from "@/lib/verify-auth";

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || "";

// Vercel Pro: max 300s for streaming
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    // Verify auth token — userId comes from server verification, not client
    const userId = await verifyAuth(req);

    const body = await req.json();

    // Rate limit: 20 requests/min per user, 10/min per IP for anonymous
    const rlKey = userId ? `chat:${userId}` : `chat:${getClientIP(req)}`;
    const rl = rateLimit(rlKey, userId ? 20 : 10, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetIn);

    // Payload validation
    const messages = body.messages || [];
    const images: string[] = body.images || [];
    const documents: { name: string; content: string }[] = body.documents || [];
    if (messages.length > 100) return new Response("Too many messages", { status: 400 });
    if (images.length > 5) return new Response("Too many images", { status: 400 });
    if (documents.length > 5) return new Response("Too many documents", { status: 400 });
    if (documents.some(d => d.content.length > 500_000)) return new Response("Document too large", { status: 400 });

    const requestedModel = body.model || DEFAULT_MODEL;
    const currentFiles = body.currentFiles || [];
    const chatHistory = body.chatHistory || [];
    const summary = body.summary || undefined;
    const errors = body.errors || undefined;

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
      stopWhen: stepCountIs(3),
      tools: {
        searchImages: tool({
          description: "Search for professional stock photos. Returns direct image URLs to embed in code. Use for any real content: people, places, objects, scenes, backgrounds.",
          inputSchema: z.object({
            query: z.string().describe("Search query in English (e.g. 'sports car', 'coffee shop interior')"),
            count: z.number().min(1).max(15).default(6).describe("Number of photos"),
            size: z.enum(["small", "medium", "large", "landscape"]).default("large").describe("Photo size: small (130px), medium (350px), large (940px), landscape (1200x627)"),
          }),
          execute: async ({ query, count, size }) => {
            if (!PEXELS_API_KEY) return { photos: [] };
            try {
              const res = await fetch(
                `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&locale=ro-RO`,
                { headers: { Authorization: PEXELS_API_KEY } }
              );
              if (!res.ok) return { photos: [] };
              const data = await res.json();
              return {
                photos: (data.photos || []).map((p: { id: number; alt: string; photographer: string; src: Record<string, string> }) => ({
                  id: p.id,
                  url: p.src[size] || p.src.large,
                  urlSmall: p.src.small,
                  urlMedium: p.src.medium,
                  urlLarge: p.src.large2x,
                  alt: p.alt || query,
                  photographer: p.photographer,
                })),
              };
            } catch {
              return { photos: [] };
            }
          },
        }),
      },
      onFinish: async ({ usage }) => {
        if (!userId) return;

        const inputTokens = usage.inputTokens || estimateTokens(systemPrompt);
        const outputTokens = usage.outputTokens || 5000;

        const cost = getModelCostOrMinimum(model, inputTokens, outputTokens);
        if (cost > 0) {
          const modelLabel = model.split("/").pop() || model;
          let deductResult = await deductCredits(userId, cost, {
            model,
            inputTokens,
            outputTokens,
            description: `${modelLabel}: ${inputTokens} in / ${outputTokens} out`,
          });

          // If full deduction failed, deduct whatever the user has left
          // (response was already streamed — don't let it be free)
          if (!deductResult.success) {
            const remaining = deductResult.monthly + deductResult.topup;
            if (remaining > 0) {
              deductResult = await deductCredits(userId, remaining, {
                model,
                inputTokens,
                outputTokens,
                description: `${modelLabel}: ${inputTokens} in / ${outputTokens} out (partial)`,
              });
            }
            console.warn("[credits]", modelLabel, `cost=${cost.toFixed(2)} cr OVER BUDGET, deducted=${remaining.toFixed(2)} cr`);
          } else {
            console.log("[credits]", modelLabel, `cost=${cost.toFixed(2)} cr OK`,
              `remaining=${deductResult.monthly}+${deductResult.topup}`);
          }
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
