import { NextRequest, NextResponse } from "next/server";
import { stripe, lookupPrice, SUBSCRIPTION_PRICES, TOPUP_PRICES } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { PLANS } from "@/lib/credits";
import { sendSubscriptionEmail, sendTopupEmail, sendCancelEmail, sendPaymentFailedEmail } from "@/lib/resend";
import type Stripe from "stripe";

async function getUserEmail(userId: string): Promise<string | null> {
  if (!supabaseAdmin) return null;
  const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
  return data?.user?.email ?? null;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[stripe webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  try {
    switch (event.type) {
      // ─── Checkout completed (both subscription & one-time) ───
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId || session.client_reference_id;
        if (!userId) break;

        // Save Stripe customer ID
        if (session.customer) {
          await supabaseAdmin
            .from("user_profiles")
            .update({ stripe_customer_id: session.customer as string })
            .eq("id", userId);
        }

        // Handle one-time top-up payment
        if (session.mode === "payment") {
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
          const priceId = lineItems.data[0]?.price?.id;
          if (priceId) {
            const info = lookupPrice(priceId);
            if (info?.type === "topup") {
              // Fetch current top-up balance
              const { data: profile } = await supabaseAdmin
                .from("user_profiles")
                .select("credits_topup")
                .eq("id", userId)
                .single();

              const currentTopup = Number(profile?.credits_topup ?? 0);
              const newTopup = currentTopup + info.credits;

              // Add top-up credits (accumulate, don't replace)
              await supabaseAdmin
                .from("user_profiles")
                .update({ credits_topup: newTopup })
                .eq("id", userId);

              await supabaseAdmin.from("credit_transactions").insert({
                user_id: userId,
                amount: info.credits,
                type: "topup",
                description: `Top-up ${info.key.toUpperCase()} (+${info.credits} credite)`,
              });

              // Send top-up confirmation email
              const topupEmail = await getUserEmail(userId);
              const topupPrices: Record<string, string> = { mini: "9 RON", mediu: "19 RON", mare: "49 RON", xl: "99 RON" };
              if (topupEmail) sendTopupEmail(topupEmail, info.credits, topupPrices[info.key] || "");
            }
          }
        }
        break;
      }

      // ─── Subscription created or updated ───
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        if (!userId) break;

        const priceId = subscription.items.data[0]?.price?.id;
        if (!priceId) break;

        const info = lookupPrice(priceId);
        if (info?.type !== "subscription") break;

        const plan = PLANS[info.plan];
        if (!plan) break;

        const isActive = subscription.status === "active" || subscription.status === "trialing";

        // Fetch current monthly balance to accumulate credits
        const { data: currentProfile } = await supabaseAdmin
          .from("user_profiles")
          .select("credits_monthly")
          .eq("id", userId)
          .single();

        const currentMonthly = Number(currentProfile?.credits_monthly ?? 0);
        const newMonthly = isActive
          ? currentMonthly + plan.creditsPerMonth
          : PLANS.free.creditsPerMonth;

        await supabaseAdmin
          .from("user_profiles")
          .update({
            plan: isActive ? info.plan : "free",
            credits_monthly: newMonthly,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer as string,
          })
          .eq("id", userId);

        // Log the plan change + send email
        if (isActive) {
          await supabaseAdmin.from("credit_transactions").insert({
            user_id: userId,
            amount: plan.creditsPerMonth,
            type: "subscription",
            description: `Abonament ${plan.name} activat (+${plan.creditsPerMonth} credite)`,
          });

          const subEmail = await getUserEmail(userId);
          if (subEmail) sendSubscriptionEmail(subEmail, plan.name, plan.creditsPerMonth);
        }
        break;
      }

      // ─── Subscription canceled or expired ───
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        if (!userId) break;

        // Downgrade to free
        await supabaseAdmin
          .from("user_profiles")
          .update({
            plan: "free",
            credits_monthly: PLANS.free.creditsPerMonth,
            stripe_subscription_id: null,
          })
          .eq("id", userId);

        await supabaseAdmin.from("credit_transactions").insert({
          user_id: userId,
          amount: 0,
          type: "subscription",
          description: "Abonament anulat — plan Gratuit",
        });

        const cancelEmail = await getUserEmail(userId);
        if (cancelEmail) sendCancelEmail(cancelEmail);
        break;
      }

      // ─── Payment failed ───
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as unknown as { subscription: string | null }).subscription;
        if (!subscriptionId) break;

        // Find user by subscription ID
        const { data: profile } = await supabaseAdmin
          .from("user_profiles")
          .select("id")
          .eq("stripe_subscription_id", subscriptionId)
          .single();

        if (profile) {
          await supabaseAdmin.from("credit_transactions").insert({
            user_id: profile.id,
            amount: 0,
            type: "payment_failed",
            description: "Plata a eșuat — verifică metoda de plată",
          });

          const failEmail = await getUserEmail(profile.id);
          if (failEmail) sendPaymentFailedEmail(failEmail);
        }
        break;
      }
    }
  } catch (err) {
    console.error("[stripe webhook] processing error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
