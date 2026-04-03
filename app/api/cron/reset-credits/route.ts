import { supabaseAdmin } from "@/lib/supabase-admin";
import { PLANS } from "@/lib/credits";

// Vercel Cron calls this on the 1st of every month
export const maxDuration = 60;

export async function GET(req: Request) {
  // Verify cron secret (Vercel sends this automatically for cron jobs)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!supabaseAdmin) {
    return Response.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    // Get all users whose credits need resetting
    const { data: users, error: fetchError } = await supabaseAdmin
      .from("user_profiles")
      .select("id, plan, credits_monthly, credits_reset_at")
      .lte("credits_reset_at", new Date().toISOString());

    if (fetchError) throw fetchError;
    if (!users || users.length === 0) {
      return Response.json({ message: "No users to reset", count: 0 });
    }

    let resetCount = 0;
    const nextReset = getNextMonthStart();

    for (const user of users) {
      const plan = PLANS[user.plan] || PLANS.free;
      const oldCredits = user.credits_monthly;

      // Reset monthly credits to plan allocation
      const { error: updateError } = await supabaseAdmin
        .from("user_profiles")
        .update({
          credits_monthly: plan.creditsPerMonth,
          credits_reset_at: nextReset,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        console.error(`[cron] Failed to reset user ${user.id}:`, updateError);
        continue;
      }

      // Log the reset transaction
      await supabaseAdmin.from("credit_transactions").insert({
        user_id: user.id,
        amount: plan.creditsPerMonth - oldCredits,
        balance_after_monthly: plan.creditsPerMonth,
        balance_after_topup: 0, // topup stays unchanged, we don't read it here
        type: "monthly_reset",
        description: `Reset lunar: ${plan.name} → ${plan.creditsPerMonth} credite`,
      });

      resetCount++;
    }

    console.log(`[cron] Monthly credit reset: ${resetCount}/${users.length} users`);
    return Response.json({ message: "Credits reset", count: resetCount, total: users.length });
  } catch (error) {
    console.error("[cron] Reset error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Reset failed" },
      { status: 500 }
    );
  }
}

function getNextMonthStart(): string {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return next.toISOString();
}
