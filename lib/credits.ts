import { supabaseAdmin } from "./supabase-admin";

// ============================================
// Plan Definitions
// ============================================

export interface PlanDefinition {
  id: string;
  name: string;
  priceRON: number;
  creditsPerMonth: number;
  defaultModel: string;
}

export const PLANS: Record<string, PlanDefinition> = {
  free:    { id: "free",    name: "Gratuit", priceRON: 0,   creditsPerMonth: 50,  defaultModel: "anthropic/claude-sonnet-4" },
  starter: { id: "starter", name: "Starter", priceRON: 69,  creditsPerMonth: 300, defaultModel: "anthropic/claude-haiku-4.5" },
  pro:     { id: "pro",     name: "Pro",     priceRON: 149, creditsPerMonth: 400, defaultModel: "anthropic/claude-sonnet-4" },
  ultra:   { id: "ultra",   name: "Ultra",   priceRON: 299, creditsPerMonth: 500, defaultModel: "anthropic/claude-opus-4-6" },
};

export interface TopupPackage {
  id: string;
  name: string;
  priceRON: number;
  credits: number;
}

export const TOPUP_PACKAGES: TopupPackage[] = [
  { id: "mini",  name: "Mini",  priceRON: 9,  credits: 30 },
  { id: "mediu", name: "Mediu", priceRON: 19, credits: 70 },
  { id: "mare",  name: "Mare",  priceRON: 49, credits: 200 },
  { id: "xl",    name: "XL",    priceRON: 99, credits: 450 },
];

// ============================================
// Model Cost Map — USD per 1M tokens
// ============================================

interface ModelPricing {
  inputPer1M: number;
  outputPer1M: number;
}

export const MODEL_COSTS: Record<string, ModelPricing> = {
  // Anthropic
  "anthropic/claude-opus-4-6":    { inputPer1M: 5,    outputPer1M: 25 },
  "anthropic/claude-sonnet-4":    { inputPer1M: 3,    outputPer1M: 15 },
  "anthropic/claude-haiku-4.5":   { inputPer1M: 0.80, outputPer1M: 4 },
  "anthropic/claude-3.5-sonnet":  { inputPer1M: 3,    outputPer1M: 15 },
  // OpenAI
  "openai/gpt-4.1":              { inputPer1M: 2.50, outputPer1M: 10 },
  "openai/gpt-4.1-mini":         { inputPer1M: 0.40, outputPer1M: 1.60 },
  "openai/gpt-4o":               { inputPer1M: 2.50, outputPer1M: 10 },
  "openai/gpt-4o-mini":          { inputPer1M: 0.15, outputPer1M: 0.60 },
  // Google
  "google/gemini-2.5-pro-preview": { inputPer1M: 1.25, outputPer1M: 10 },
  "google/gemini-2.5-flash":      { inputPer1M: 0.075, outputPer1M: 0.30 },
  "google/gemini-2.0-flash":      { inputPer1M: 0.10, outputPer1M: 0.40 },
  // DeepSeek
  "deepseek/deepseek-r1":        { inputPer1M: 0.55, outputPer1M: 2.19 },
  "deepseek/deepseek-chat":      { inputPer1M: 0.14, outputPer1M: 0.28 },
  // Qwen
  "qwen/qwen3-coder":            { inputPer1M: 0.20, outputPer1M: 0.60 },
  "qwen/qwq-32b":                { inputPer1M: 0.12, outputPer1M: 0.18 },
  // Meta
  "meta-llama/llama-3.3-70b-instruct": { inputPer1M: 0.12, outputPer1M: 0.30 },
  "meta-llama/llama-4-maverick":       { inputPer1M: 0.20, outputPer1M: 0.60 },
  // Mistral
  "mistralai/codestral-2501":       { inputPer1M: 0.30, outputPer1M: 0.90 },
  "mistralai/devstral-small-2505":  { inputPer1M: 0.10, outputPer1M: 0.30 },
};

// 1 credit = $0.043
export const CREDIT_VALUE_USD = 0.043;

// ============================================
// Calculations
// ============================================

export function isModelFree(model: string): boolean {
  return model.endsWith(":free") || !(model in MODEL_COSTS);
}

export function calculateCreditCost(model: string, inputTokens: number, outputTokens: number): number {
  if (isModelFree(model)) return 0;
  const costs = MODEL_COSTS[model];
  if (!costs) return 0;
  const dollarCost = (inputTokens / 1_000_000) * costs.inputPer1M + (outputTokens / 1_000_000) * costs.outputPer1M;
  return dollarCost / CREDIT_VALUE_USD;
}

export function estimateCreditCost(model: string, estimatedOutput = 8000): number {
  if (isModelFree(model)) return 0;
  const cost = calculateCreditCost(model, 4000, estimatedOutput);
  return Math.round(cost * 10) / 10; // 1 decimal
}

// ============================================
// Supabase Operations (server-side only)
// ============================================

export interface UserCredits {
  plan: string;
  creditsMonthly: number;
  creditsTopup: number;
  totalCredits: number;
  creditsResetAt: string;
}

export async function getUserCredits(userId: string): Promise<UserCredits | null> {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from("user_profiles")
    .select("plan, credits_monthly, credits_topup, credits_reset_at")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return {
    plan: data.plan,
    creditsMonthly: data.credits_monthly,
    creditsTopup: data.credits_topup,
    totalCredits: data.credits_monthly + data.credits_topup,
    creditsResetAt: data.credits_reset_at,
  };
}

export async function ensureProfile(userId: string): Promise<UserCredits> {
  const existing = await getUserCredits(userId);
  if (existing) return existing;
  if (!supabaseAdmin) return { plan: "free", creditsMonthly: 50, creditsTopup: 0, totalCredits: 50, creditsResetAt: "" };
  await supabaseAdmin.from("user_profiles").insert({
    id: userId, plan: "free", credits_monthly: 50, credits_topup: 0,
  });
  return { plan: "free", creditsMonthly: 10, creditsTopup: 0, totalCredits: 10, creditsResetAt: "" };
}

export async function checkCredits(userId: string, estimatedCost: number): Promise<{ allowed: boolean; balance: number }> {
  if (estimatedCost <= 0) return { allowed: true, balance: 0 };
  const credits = await ensureProfile(userId);
  return { allowed: credits.totalCredits >= Math.ceil(estimatedCost), balance: credits.totalCredits };
}

export async function deductCredits(
  userId: string,
  cost: number,
  metadata: { model: string; inputTokens: number; outputTokens: number; description?: string }
): Promise<{ success: boolean; monthly: number; topup: number }> {
  if (cost <= 0) return { success: true, monthly: 0, topup: 0 };
  if (!supabaseAdmin) return { success: false, monthly: 0, topup: 0 };

  const { data, error } = await supabaseAdmin.rpc("deduct_credits", {
    p_user_id: userId,
    p_cost_raw: cost,
    p_model: metadata.model,
    p_input_tokens: metadata.inputTokens,
    p_output_tokens: metadata.outputTokens,
    p_description: metadata.description || null,
  });

  if (error) {
    console.error("[credits] deduct error:", error);
    return { success: false, monthly: 0, topup: 0 };
  }
  return { success: data.success, monthly: data.monthly, topup: data.topup };
}

export async function getRecentTransactions(userId: string, limit = 20) {
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from("credit_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) { console.error("[credits] transactions error:", error); return []; }
  return data || [];
}
