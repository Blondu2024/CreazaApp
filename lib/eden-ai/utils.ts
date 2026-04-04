// ============================================
// Eden AI — Utility functions
// ============================================

import {
  EDEN_API_BASE,
  EDEN_CAPABILITIES,
  type EdenCapability,
  type EdenProvider,
  type ProviderTier,
  providerCostToCredits,
} from "./config";

// ============================================
// Provider selection by user plan
// ============================================

const PLAN_TO_TIER: Record<string, ProviderTier> = {
  free: "basic",
  starter: "basic",
  pro: "premium",
  ultra: "premium",
};

/**
 * Select the appropriate provider for a capability based on user plan.
 * Pro/Ultra get premium tier by default. Free/Starter get basic.
 * If a specific provider is requested (by Pro/Ultra), use it if it exists.
 */
export function selectProvider(
  capability: EdenCapability,
  plan: string,
  requestedProvider?: string
): EdenProvider {
  const tier = PLAN_TO_TIER[plan] ?? "basic";

  // If Pro/Ultra requested a specific provider, try to find it
  if (requestedProvider && (plan === "pro" || plan === "ultra")) {
    const found = capability.providers.find((p) => p.id === requestedProvider);
    if (found) return found;
  }

  // Get default: first provider matching tier, or fallback to first basic
  const tierProviders = capability.providers.filter((p) => p.tier === tier);
  if (tierProviders.length > 0) return tierProviders[0];

  // Fallback: first basic provider
  const basic = capability.providers.filter((p) => p.tier === "basic");
  return basic[0] ?? capability.providers[0];
}

/**
 * Get the default (cheapest basic) provider for a capability.
 */
export function getDefaultProvider(capability: EdenCapability): EdenProvider {
  return selectProvider(capability, "free");
}

// ============================================
// Credit cost helpers
// ============================================

/**
 * Get credit cost for a specific provider within a capability.
 */
export function getProviderCreditCost(provider: EdenProvider): number {
  return providerCostToCredits(provider.costUsd);
}

/**
 * Get the credit cost range for a capability (min basic — max premium).
 */
export function getCreditRange(capability: EdenCapability): { min: number; max: number } {
  const costs = capability.providers.map((p) => providerCostToCredits(p.costUsd));
  return { min: Math.min(...costs), max: Math.max(...costs) };
}

// ============================================
// Eden AI API call
// ============================================

interface EdenAPIResult {
  success: boolean;
  data: Record<string, unknown> | null;
  error: string | null;
  providerUsed: string;
  costUsd: number;
}

/**
 * Call Eden AI API for a specific capability and provider.
 */
export async function callEdenAI(
  capability: EdenCapability,
  provider: EdenProvider,
  body: Record<string, unknown>
): Promise<EdenAPIResult> {
  const apiKey = process.env.EDEN_API_KEY;
  if (!apiKey) {
    return { success: false, data: null, error: "Eden AI API key not configured", providerUsed: provider.id, costUsd: 0 };
  }

  const url = `${EDEN_API_BASE}${capability.edenEndpoint}`;

  // Eden AI expects "providers" field with the provider name
  const edenBody = {
    ...body,
    providers: provider.id,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(edenBody),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "Unknown error");
      console.error(`[eden-ai] ${capability.id} error ${response.status}:`, errText);
      return {
        success: false,
        data: null,
        error: `Eden AI error: ${response.status}`,
        providerUsed: provider.id,
        costUsd: 0,
      };
    }

    const result = await response.json();

    // Eden AI returns results keyed by provider name
    const providerResult = result[provider.id];
    if (providerResult?.status === "fail") {
      return {
        success: false,
        data: null,
        error: providerResult.error?.message || "Provider error",
        providerUsed: provider.id,
        costUsd: 0,
      };
    }

    return {
      success: true,
      data: providerResult ?? result,
      error: null,
      providerUsed: provider.id,
      costUsd: provider.costUsd,
    };
  } catch (err) {
    console.error(`[eden-ai] ${capability.id} fetch error:`, err);
    return {
      success: false,
      data: null,
      error: "Failed to connect to Eden AI",
      providerUsed: provider.id,
      costUsd: 0,
    };
  }
}

// ============================================
// System prompt text — for AI agent
// ============================================

/**
 * Generate the API capabilities text for the agent system prompt.
 */
export function getAgentCapabilitiesPrompt(): string {
  const lines: string[] = [
    "CAPABILITATI API CreazaApp (disponibile pentru aplicatiile generate):",
    "",
  ];

  for (const cap of Object.values(EDEN_CAPABILITIES)) {
    const range = getCreditRange(cap);
    const providers = cap.providers.map((p) => `${p.label} (${providerCostToCredits(p.costUsd)} cr)`).join(" | ");
    const warning = range.max >= cap.warningThreshold ? " ⚠️" : "";

    lines.push(`• ${cap.name}: ${range.min} - ${range.max} cr/${cap.unit}${warning}`);
    lines.push(`  Provideri: ${providers}`);
    lines.push(`  Endpoint: POST /api/eden/${cap.id}`);
    lines.push(`  ${cap.description}`);
    lines.push("");
  }

  lines.push("REGULI API:");
  lines.push("- INTREABA userul despre preferinte (voce, limba, calitate) INAINTE de a integra.");
  lines.push("- ARATA costul in credite per operatie INAINTE de a genera codul.");
  lines.push("- AVERTIZEAZA la operatii > 5 credite per call.");
  lines.push("- Codul generat apeleaza: POST /api/eden/{capability} cu body JSON.");
  lines.push("- Userul NU stie de Eden AI — totul e \"serverele CreazaApp\".");
  lines.push("- Header obligatoriu in codul generat: Authorization: Bearer {token}");

  return lines.join("\n");
}
