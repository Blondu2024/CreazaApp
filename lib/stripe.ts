import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// ============================================
// Stripe Price IDs — mapped to internal plans/topups
// ============================================

export const SUBSCRIPTION_PRICES: Record<string, { priceId: string; plan: string; credits: number }> = {
  starter: { priceId: "price_1TIGH3HYGAlAOMyT0t1GgNAR", plan: "starter", credits: 300 },
  pro:     { priceId: "price_1TIGH4HYGAlAOMyT1xn8FQRF", plan: "pro",     credits: 400 },
  ultra:   { priceId: "price_1TIGH5HYGAlAOMyTdEZhW04N", plan: "ultra",   credits: 500 },
};

export const TOPUP_PRICES: Record<string, { priceId: string; credits: number }> = {
  mini:  { priceId: "price_1TIGH5HYGAlAOMyTYEnU3HPK", credits: 30 },
  mediu: { priceId: "price_1TIGH6HYGAlAOMyTSNEMHFXp", credits: 70 },
  mare:  { priceId: "price_1TIGH6HYGAlAOMyTo02YIqye", credits: 200 },
  xl:    { priceId: "price_1TIGH7HYGAlAOMyTjdBIAkFV", credits: 450 },
};

// Reverse lookup: price ID → plan/topup info
export function lookupPrice(priceId: string) {
  for (const [key, val] of Object.entries(SUBSCRIPTION_PRICES)) {
    if (val.priceId === priceId) return { type: "subscription" as const, key, ...val };
  }
  for (const [key, val] of Object.entries(TOPUP_PRICES)) {
    if (val.priceId === priceId) return { type: "topup" as const, key, ...val };
  }
  return null;
}
