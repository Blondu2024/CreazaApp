import { supabaseAdmin } from "@/lib/supabase-admin";

// Runs every 6 hours — permanently deletes projects soft-deleted >48h ago
export const maxDuration = 30;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!supabaseAdmin) {
    return Response.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    // Find projects deleted more than 48h ago
    const { data: expired, error: findError } = await supabaseAdmin
      .from("projects")
      .select("id")
      .not("deleted_at", "is", null)
      .lt("deleted_at", cutoff);

    if (findError) throw findError;
    if (!expired || expired.length === 0) {
      return Response.json({ message: "No projects to clean up", count: 0 });
    }

    const ids = expired.map(p => p.id);

    // Delete related data first (files, chat messages, deployments), then projects
    await supabaseAdmin.from("project_files").delete().in("project_id", ids);
    await supabaseAdmin.from("chat_messages").delete().in("project_id", ids);
    await supabaseAdmin.from("deployments").delete().in("project_id", ids);
    const { error: deleteError } = await supabaseAdmin.from("projects").delete().in("id", ids);

    if (deleteError) throw deleteError;

    console.log(`[cron] Cleaned up ${ids.length} expired projects`);
    return Response.json({ message: "Projects cleaned up", count: ids.length });
  } catch (error) {
    console.error("[cron] Cleanup error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Cleanup failed" },
      { status: 500 }
    );
  }
}
