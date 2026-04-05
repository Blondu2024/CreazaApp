import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// GET /api/share/[token] — public, no auth required
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token || !supabaseAdmin) {
      return NextResponse.json({ error: "Token invalid" }, { status: 400 });
    }

    // Find active share
    const { data: share } = await supabaseAdmin
      .from("project_shares")
      .select("project_id")
      .eq("share_token", token)
      .eq("active", true)
      .single();

    if (!share) {
      return NextResponse.json({ error: "Link invalid sau expirat" }, { status: 404 });
    }

    // Load project info
    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("id, name")
      .eq("id", share.project_id)
      .is("deleted_at", null)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Proiectul nu mai există" }, { status: 404 });
    }

    // Load project files
    const { data: files } = await supabaseAdmin
      .from("project_files")
      .select("path, content")
      .eq("project_id", share.project_id);

    return NextResponse.json({
      name: project.name,
      projectId: project.id,
      files: files || [],
    });
  } catch (err) {
    console.error("[share/token] GET error:", err);
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
  }
}
