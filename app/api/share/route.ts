import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/verify-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

// POST /api/share — create or get share link
export async function POST(req: NextRequest) {
  try {
    const userId = await verifyAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Autentificare necesară" }, { status: 401 });
    }

    const { projectId } = await req.json();
    if (!projectId) {
      return NextResponse.json({ error: "projectId lipsește" }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
    }

    // Verify project ownership
    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("id, user_id, name")
      .eq("id", projectId)
      .single();

    if (!project || project.user_id !== userId) {
      return NextResponse.json({ error: "Proiect negăsit" }, { status: 404 });
    }

    // Check if active share exists
    const { data: existing } = await supabaseAdmin
      .from("project_shares")
      .select("share_token")
      .eq("project_id", projectId)
      .eq("active", true)
      .single();

    if (existing) {
      return NextResponse.json({ token: existing.share_token });
    }

    // Create new share token
    const token = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    const { error } = await supabaseAdmin
      .from("project_shares")
      .insert({ project_id: projectId, share_token: token, created_by: userId });

    if (error) {
      console.error("[share] insert error:", error);
      return NextResponse.json({ error: "Eroare la crearea link-ului" }, { status: 500 });
    }

    return NextResponse.json({ token });
  } catch (err) {
    console.error("[share] POST error:", err);
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
  }
}

// DELETE /api/share — deactivate share link
export async function DELETE(req: NextRequest) {
  try {
    const userId = await verifyAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Autentificare necesară" }, { status: 401 });
    }

    const { projectId } = await req.json();
    if (!projectId || !supabaseAdmin) {
      return NextResponse.json({ error: "projectId lipsește" }, { status: 400 });
    }

    // Verify ownership
    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .single();

    if (!project || project.user_id !== userId) {
      return NextResponse.json({ error: "Proiect negăsit" }, { status: 404 });
    }

    await supabaseAdmin
      .from("project_shares")
      .update({ active: false })
      .eq("project_id", projectId)
      .eq("active", true);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[share] DELETE error:", err);
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
  }
}
