import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/verify-auth";
import { checkCredits, deductCredits, ensureProfile } from "@/lib/credits";
import { handleDeploy, getLastDeployment, computeContentHash, getDeployCost } from "@/lib/deploy";
import { supabaseAdmin } from "@/lib/supabase-admin";

// POST /api/deploy — deploy or redeploy a project
export async function POST(req: NextRequest) {
  try {
    const userId = await verifyAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Autentificare necesară" }, { status: 401 });
    }

    const { projectId, force } = await req.json();
    if (!projectId) {
      return NextResponse.json({ error: "projectId lipsește" }, { status: 400 });
    }

    // Load project files from Supabase
    if (!supabaseAdmin) {
      console.error("[deploy] supabaseAdmin is null");
      return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
    }

    const { data: project, error: projErr } = await supabaseAdmin
      .from("projects")
      .select("name, user_id")
      .eq("id", projectId)
      .single();

    if (projErr) {
      console.error("[deploy] project query error:", projErr);
    }

    if (!project || project.user_id !== userId) {
      return NextResponse.json({ error: "Proiect negăsit" }, { status: 404 });
    }

    const { data: files, error: filesErr } = await supabaseAdmin
      .from("project_files")
      .select("path, content")
      .eq("project_id", projectId);

    if (filesErr) {
      console.error("[deploy] files query error:", filesErr);
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Proiectul nu are fișiere" }, { status: 400 });
    }

    // Check if content changed — if not, return cached URL instantly (free) — unless forced
    const contentHash = computeContentHash(files);
    const lastDeploy = await getLastDeployment(projectId);
    if (!force && lastDeploy && lastDeploy.content_hash === contentHash && lastDeploy.status === "ready") {
      return NextResponse.json({
        success: true,
        url: lastDeploy.url,
        subdomain: lastDeploy.subdomain,
        cached: true,
        creditsCost: 0,
      });
    }

    // Calculate cost and check credits
    const isFirstDeploy = !lastDeploy || lastDeploy.status === "error";
    const cost = getDeployCost(isFirstDeploy);

    const creditCheck = await checkCredits(userId, cost);
    if (!creditCheck.allowed) {
      return NextResponse.json({
        error: `Credite insuficiente. Ai ${creditCheck.balance} credite, dar deploy-ul costă ${cost}.`,
        needCredits: true,
      }, { status: 402 });
    }

    // Get user plan for watermark logic
    const userProfile = await ensureProfile(userId);

    // Deploy (pass plan — free users get CreazaApp watermark)
    console.log("[deploy] Starting deploy for project:", projectId, "user:", userId, "plan:", userProfile.plan);
    const result = await handleDeploy(projectId, userId, project.name, files, userProfile.plan, !!force);

    if (!result.success) {
      console.error("[deploy] handleDeploy failed:", result.error);
      // Cooldown or user-facing errors → 429, actual server errors ��� 500
      const isCooldown = result.error?.includes("Așteaptă");
      return NextResponse.json({ error: result.error }, { status: isCooldown ? 429 : 500 });
    }

    // Deduct credits only if not cached
    if (!result.cached && result.creditsCost && result.creditsCost > 0) {
      await deductCredits(userId, result.creditsCost, {
        model: "deploy",
        inputTokens: 0,
        outputTokens: 0,
        description: isFirstDeploy ? "Deploy inițial" : "Redeploy",
      });
    }

    console.log("[deploy] Success:", result.url, "cost:", result.creditsCost, "cached:", result.cached);
    return NextResponse.json({
      success: true,
      url: result.url,
      subdomain: result.subdomain,
      cached: result.cached,
      creditsCost: result.creditsCost,
    });
  } catch (err) {
    console.error("[deploy] Unhandled error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Eroare la deploy" },
      { status: 500 }
    );
  }
}

// GET /api/deploy?projectId=xxx — get deployment status
export async function GET(req: NextRequest) {
  const userId = await verifyAuth(req);
  if (!userId) {
    return NextResponse.json({ error: "Autentificare necesară" }, { status: 401 });
  }

  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId lipsește" }, { status: 400 });
  }

  const last = await getLastDeployment(projectId);
  if (!last || last.user_id !== userId) {
    return NextResponse.json({ deployment: null });
  }

  return NextResponse.json({
    deployment: {
      status: last.status,
      url: last.url,
      subdomain: last.subdomain,
      createdAt: last.created_at,
      contentHash: last.content_hash,
    },
  });
}
