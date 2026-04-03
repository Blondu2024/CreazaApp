import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/verify-auth";
import { checkCredits, deductCredits, ensureProfile } from "@/lib/credits";
import { rateLimit, rateLimitResponse, getClientIP } from "@/lib/rate-limit";
import { getCapability, providerCostToCredits } from "@/lib/eden-ai/config";
import { selectProvider, callEdenAI, getProviderCreditCost } from "@/lib/eden-ai/utils";

// Max request body: 10MB (for images/audio/documents)
const MAX_BODY_SIZE = 10 * 1024 * 1024;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ capability: string }> }
) {
  const { capability: capabilityId } = await params;

  // ─── 1. Validate capability ─────────────────
  const capability = getCapability(capabilityId);
  if (!capability) {
    return NextResponse.json(
      { error: "invalid_capability", message: `Capabilitate necunoscuta: ${capabilityId}` },
      { status: 400 }
    );
  }

  // ─── 2. Auth — required for all Eden AI calls ─
  const userId = await verifyAuth(req);
  if (!userId) {
    return NextResponse.json(
      { error: "unauthorized", message: "Autentificare necesara." },
      { status: 401 }
    );
  }

  // ─── 3. Rate limit ─────────────────────────────
  const rlKey = `eden:${capabilityId}:${userId}`;
  const rl = rateLimit(rlKey, capability.rateLimit, 60_000);
  if (!rl.allowed) {
    return rateLimitResponse(rl.resetIn);
  }

  // ─── 4. Parse body ─────────────────────────────
  let body: Record<string, unknown>;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: "payload_too_large", message: "Fisierul e prea mare. Maxim 10MB." },
        { status: 413 }
      );
    }
    body = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "Body JSON invalid." },
      { status: 400 }
    );
  }

  // ─── 5. Get user plan → select provider ────────
  const profile = await ensureProfile(userId);
  const requestedProvider = typeof body.provider === "string" ? body.provider : undefined;
  const provider = selectProvider(capability, profile.plan, requestedProvider);
  const creditCost = getProviderCreditCost(provider);

  // Remove our internal "provider" field before forwarding to Eden AI
  const { provider: _removed, ...edenBody } = body;

  // ─── 6. Credit pre-check ───────────────────────
  const { allowed, balance } = await checkCredits(userId, creditCost);
  if (!allowed) {
    return NextResponse.json(
      {
        error: "insufficient_credits",
        message: "Credite insuficiente.",
        balance,
        estimatedCost: creditCost,
        capability: capabilityId,
      },
      { status: 402 }
    );
  }

  // ─── 7. Call Eden AI ───────────────────────────
  console.log(`[eden-ai] ${capabilityId} user=${userId} provider=${provider.id} cost=${creditCost}cr`);

  const result = await callEdenAI(capability, provider, edenBody as Record<string, unknown>);

  if (!result.success) {
    console.error(`[eden-ai] ${capabilityId} FAILED:`, result.error);
    return NextResponse.json(
      { error: "eden_api_error", message: result.error || "Eroare la procesare." },
      { status: 502 }
    );
  }

  // ─── 8. Deduct credits (only on success) ───────
  const deduction = await deductCredits(userId, creditCost, {
    model: `eden/${capabilityId}/${provider.id}`,
    inputTokens: 0,
    outputTokens: 0,
    description: `${capability.name} — ${provider.label}`,
  });

  console.log(
    `[eden-ai] ${capabilityId} OK cost=${creditCost}cr ${deduction.success ? "DEDUCTED" : "DEDUCT_FAIL"} remaining=${deduction.monthly}+${deduction.topup}`
  );

  // ─── 9. Return result ─────────────────────────
  return NextResponse.json({
    success: true,
    data: result.data,
    provider: provider.label,
    creditCost,
    remainingCredits: deduction.monthly + deduction.topup,
  });
}

// ─── GET — capability info (no auth needed) ──────
export async function GET(
  req: Request,
  { params }: { params: Promise<{ capability: string }> }
) {
  const { capability: capabilityId } = await params;
  const capability = getCapability(capabilityId);

  if (!capability) {
    return NextResponse.json(
      { error: "invalid_capability", message: `Capabilitate necunoscuta: ${capabilityId}` },
      { status: 400 }
    );
  }

  return NextResponse.json({
    id: capability.id,
    name: capability.name,
    description: capability.description,
    unit: capability.unit,
    providers: capability.providers.map((p) => ({
      id: p.id,
      label: p.label,
      credits: providerCostToCredits(p.costUsd),
      tier: p.tier,
    })),
  });
}
