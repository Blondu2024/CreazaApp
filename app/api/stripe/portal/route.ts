import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { verifyAuth } from "@/lib/verify-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const userId = await verifyAuth(req);
  if (!userId) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  // Rate limit: 5 portal sessions per minute per user
  const rl = rateLimit(`stripe:portal:${userId}`, 5, 60_000);
  if (!rl.allowed) return rateLimitResponse(rl.resetIn);

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  // Get Stripe customer ID from user profile
  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: "Nu ai un abonament activ" }, { status: 400 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${req.nextUrl.origin}/cont`,
  });

  return NextResponse.json({ url: session.url });
}
