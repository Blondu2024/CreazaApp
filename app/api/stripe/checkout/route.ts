import { NextRequest, NextResponse } from "next/server";
import { stripe, SUBSCRIPTION_PRICES, TOPUP_PRICES } from "@/lib/stripe";
import { verifyAuth } from "@/lib/verify-auth";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const userId = await verifyAuth(req);
  if (!userId) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  // Rate limit: 5 checkout sessions per minute per user
  const rl = rateLimit(`stripe:checkout:${userId}`, 5, 60_000);
  if (!rl.allowed) return rateLimitResponse(rl.resetIn);

  const { type, id } = await req.json();

  let priceId: string;
  let mode: "subscription" | "payment";

  if (type === "subscription") {
    const sub = SUBSCRIPTION_PRICES[id];
    if (!sub) return NextResponse.json({ error: "Plan invalid" }, { status: 400 });
    priceId = sub.priceId;
    mode = "subscription";
  } else if (type === "topup") {
    const topup = TOPUP_PRICES[id];
    if (!topup) return NextResponse.json({ error: "Pachet invalid" }, { status: 400 });
    priceId = topup.priceId;
    mode = "payment";
  } else {
    return NextResponse.json({ error: "Tip invalid" }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    mode,
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${req.nextUrl.origin}/cont?success=true`,
    cancel_url: `${req.nextUrl.origin}/cont?canceled=true`,
    client_reference_id: userId,
    metadata: { userId, type, id },
    ...(mode === "subscription" && {
      subscription_data: { metadata: { userId, plan: id } },
    }),
  });

  return NextResponse.json({ url: session.url });
}
