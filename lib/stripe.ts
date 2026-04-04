import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// ============================================
// Stripe Price IDs — mapped to internal plans/topups
// ============================================

export const SUBSCRIPTION_PRICES: Record<string, { priceId: string; plan: string; credits: number }> = {
  starter: { priceId: "price_1TINs0HYGAlAOMyTQkN2EJSk", plan: "starter", credits: 300 },
  pro:     { priceId: "price_1TINs1HYGAlAOMyTHjUPt7Qd", plan: "pro",     credits: 400 },
  ultra:   { priceId: "price_1TINs1HYGAlAOMyTqhKGLKGw", plan: "ultra",   credits: 500 },
};

export const TOPUP_PRICES: Record<string, { priceId: string; credits: number }> = {
  mini:  { priceId: "price_1TINs2HYGAlAOMyTUbQjEHtP", credits: 30 },
  mediu: { priceId: "price_1TINs2HYGAlAOMyTKvMHmsVY", credits: 70 },
  mare:  { priceId: "price_1TINs3HYGAlAOMyTqbHh5xaC", credits: 200 },
  xl:    { priceId: "price_1TINs4HYGAlAOMyT6LNiTEZe", credits: 450 },
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
