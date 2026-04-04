import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { verifyAuth } from "@/lib/verify-auth";
import { checkCredits, deductCredits } from "@/lib/credits";

export const maxDuration = 30;

// Cost: ~0.5 credits per image generation via OpenRouter
const IMAGE_CREDIT_COST = 0.5;

export async function GET(req: Request) {
  // Require auth
  const userId = await verifyAuth(req);
  if (!userId) return new Response("Unauthorized", { status: 401 });

  // Rate limit: 10 requests/min per user
  const rl = rateLimit(`image:${userId}`, 10, 60_000);
  if (!rl.allowed) return rateLimitResponse(rl.resetIn);

  const url = new URL(req.url);
  const prompt = url.searchParams.get("prompt");

  if (!prompt) {
    return new Response("Missing prompt parameter", { status: 400 });
  }

  // Credit pre-check
  const { allowed, balance } = await checkCredits(userId, IMAGE_CREDIT_COST);
  if (!allowed) {
    return new Response(
      JSON.stringify({ error: "insufficient_credits", message: "Credite insuficiente.", balance }),
      { status: 402, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "black-forest-labs/flux.2-klein-4b",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image"],
      }),
    });

    const data = await response.json();

    const imageData = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageData) {
      console.error("[generate-image] No image in response:", JSON.stringify(data).slice(0, 500));
      return new Response("Image generation failed", { status: 502 });
    }

    // Deduct credits only on success
    await deductCredits(userId, IMAGE_CREDIT_COST, {
      model: "black-forest-labs/flux.2-klein-4b",
      inputTokens: 0,
      outputTokens: 0,
      description: "Generare imagine",
    });

    // Extract base64 from data URL (data:image/png;base64,...)
    const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (base64Match) {
      const mimeType = base64Match[1];
      const buffer = Buffer.from(base64Match[2], "base64");
      return new Response(buffer, {
        headers: {
          "Content-Type": `image/${mimeType}`,
          "Cache-Control": "public, max-age=86400, immutable",
        },
      });
    }

    // If it's a URL, redirect to it
    if (imageData.startsWith("http")) {
      return Response.redirect(imageData, 302);
    }

    return new Response("Unexpected image format", { status: 502 });
  } catch (error) {
    console.error("[generate-image] Error:", error);
    return new Response("Image generation error", { status: 500 });
  }
}
