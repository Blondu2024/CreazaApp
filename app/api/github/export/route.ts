import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/verify-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

const GITHUB_API = "https://api.github.com";

// POST /api/github/export — create repo + push project files
export async function POST(req: NextRequest) {
  const userId = await verifyAuth(req);
  if (!userId) {
    return NextResponse.json({ error: "Autentificare necesară" }, { status: 401 });
  }

  const { projectId, repoName, isPrivate, githubToken } = await req.json();
  if (!projectId || !repoName || !githubToken) {
    return NextResponse.json({ error: "Lipsesc date (projectId, repoName, githubToken)" }, { status: 400 });
  }

  // Validate repo name
  const cleanRepo = repoName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-");
  if (!cleanRepo || cleanRepo.length < 2) {
    return NextResponse.json({ error: "Nume repository invalid" }, { status: 400 });
  }

  // Load project files
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
  }

  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("name, user_id")
    .eq("id", projectId)
    .single();

  if (!project || project.user_id !== userId) {
    return NextResponse.json({ error: "Proiect negăsit" }, { status: 404 });
  }

  const { data: files } = await supabaseAdmin
    .from("project_files")
    .select("path, content")
    .eq("project_id", projectId);

  if (!files || files.length === 0) {
    return NextResponse.json({ error: "Proiectul nu are fișiere" }, { status: 400 });
  }

  const headers = {
    Authorization: `Bearer ${githubToken}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  try {
    // 1. Create repository
    const createRes = await fetch(`${GITHUB_API}/user/repos`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: cleanRepo,
        description: `${project.name} — Creat cu CreazaApp.com`,
        private: isPrivate ?? false,
        auto_init: true, // Creates initial commit with README
      }),
    });

    const repoData = await createRes.json();

    if (!createRes.ok) {
      if (createRes.status === 422 && repoData.errors?.some((e: { message: string }) => e.message?.includes("already exists"))) {
        return NextResponse.json({ error: "Un repository cu acest nume există deja pe GitHub" }, { status: 409 });
      }
      if (createRes.status === 401) {
        return NextResponse.json({ error: "Token GitHub expirat. Relogează-te cu GitHub." }, { status: 401 });
      }
      return NextResponse.json({ error: repoData.message || "Eroare la crearea repository-ului" }, { status: createRes.status });
    }

    const owner = repoData.owner.login;
    const repo = repoData.name;

    // 2. Get the default branch SHA (from auto_init commit)
    // Small delay to let GitHub process the auto_init
    await new Promise(r => setTimeout(r, 1000));

    const refRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/ref/heads/main`, { headers });
    const refData = await refRes.json();

    if (!refRes.ok) {
      return NextResponse.json({ error: "Eroare la accesarea branch-ului", repoUrl: repoData.html_url }, { status: 500 });
    }

    const baseSha = refData.object.sha;

    // 3. Create blobs for each file
    const blobs = await Promise.all(
      files.map(async (f) => {
        const blobRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/blobs`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ content: f.content, encoding: "utf-8" }),
        });
        const blobData = await blobRes.json();
        return { path: f.path, sha: blobData.sha, mode: "100644" as const, type: "blob" as const };
      })
    );

    // 4. Create tree
    const treeRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/trees`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ base_tree: baseSha, tree: blobs }),
    });
    const treeData = await treeRes.json();

    if (!treeRes.ok) {
      return NextResponse.json({ error: "Eroare la crearea fișierelor", repoUrl: repoData.html_url }, { status: 500 });
    }

    // 5. Create commit
    const commitRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/commits`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `feat: ${project.name} — exportat din CreazaApp.com`,
        tree: treeData.sha,
        parents: [baseSha],
      }),
    });
    const commitData = await commitRes.json();

    if (!commitRes.ok) {
      return NextResponse.json({ error: "Eroare la crearea commit-ului", repoUrl: repoData.html_url }, { status: 500 });
    }

    // 6. Update ref to point to new commit
    await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/refs/heads/main`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ sha: commitData.sha }),
    });

    return NextResponse.json({
      success: true,
      repoUrl: repoData.html_url,
      repoName: `${owner}/${repo}`,
      filesCount: files.length,
    });

  } catch (err) {
    console.error("[github export] error:", err);
    return NextResponse.json({ error: "Eroare de conexiune la GitHub" }, { status: 500 });
  }
}
