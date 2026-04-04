import { supabaseAdmin } from "./supabase-admin";
import crypto from "crypto";

// ============================================
// Constants
// ============================================

const VERCEL_API = "https://api.vercel.com";
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || "";
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID || ""; // Optional, for team deployments
const DEPLOY_COST_INITIAL = 10;  // First deploy costs 10 credits
const DEPLOY_COST_REDEPLOY = 3;  // Redeploy costs 3 credits (much cheaper)
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes between deploys

// ============================================
// Types
// ============================================

export interface Deployment {
  id: string;
  project_id: string;
  user_id: string;
  vercel_project_id: string | null;
  vercel_deployment_id: string | null;
  subdomain: string;
  url: string | null;
  content_hash: string;
  status: string;
  error_message: string | null;
  credits_charged: number;
  created_at: string;
  updated_at: string;
}

interface VercelFile {
  file: string;
  sha: string;
  size: number;
}

// ============================================
// Content Hashing — skip deploy if nothing changed
// ============================================

export function computeContentHash(files: { path: string; content: string }[]): string {
  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));
  const combined = sorted.map(f => `${f.path}::${f.content}`).join("\n---\n");
  return crypto.createHash("sha256").update(combined).digest("hex");
}

function computeFileSha(content: string): string {
  return crypto.createHash("sha1").update(content).digest("hex");
}

// ============================================
// Subdomain Generation
// ============================================

export function generateSubdomain(projectName: string, projectId: string): string {
  const clean = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  // Add short ID suffix for uniqueness
  const suffix = projectId.slice(0, 6);
  return clean ? `${clean}-${suffix}` : suffix;
}

// ============================================
// Database Operations
// ============================================

export async function getLastDeployment(projectId: string): Promise<Deployment | null> {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from("deployments")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (error || !data) return null;
  return data;
}

export async function getDeploymentBySubdomain(subdomain: string): Promise<Deployment | null> {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from("deployments")
    .select("*")
    .eq("subdomain", subdomain)
    .eq("status", "ready")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (error || !data) return null;
  return data;
}

export async function createDeploymentRecord(
  projectId: string, userId: string, subdomain: string, contentHash: string, credits: number
): Promise<Deployment | null> {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from("deployments")
    .insert({
      project_id: projectId,
      user_id: userId,
      subdomain,
      content_hash: contentHash,
      credits_charged: credits,
      status: "building",
    })
    .select()
    .single();
  if (error) { console.error("[deploy] insert error:", error); return null; }
  return data;
}

async function updateDeploymentStatus(
  deploymentId: string,
  status: string,
  extra: { vercel_project_id?: string; vercel_deployment_id?: string; url?: string; error_message?: string } = {}
) {
  if (!supabaseAdmin) return;
  await supabaseAdmin
    .from("deployments")
    .update({ status, ...extra, updated_at: new Date().toISOString() })
    .eq("id", deploymentId);
}

// ============================================
// Cooldown Check
// ============================================

export async function checkCooldown(projectId: string): Promise<{ allowed: boolean; waitMs: number }> {
  const last = await getLastDeployment(projectId);
  if (!last) return { allowed: true, waitMs: 0 };
  const elapsed = Date.now() - new Date(last.created_at).getTime();
  if (elapsed < COOLDOWN_MS) {
    return { allowed: false, waitMs: COOLDOWN_MS - elapsed };
  }
  return { allowed: true, waitMs: 0 };
}

// ============================================
// Deploy Cost
// ============================================

export function getDeployCost(isFirstDeploy: boolean): number {
  return isFirstDeploy ? DEPLOY_COST_INITIAL : DEPLOY_COST_REDEPLOY;
}

// ============================================
// Vercel API — File-based deployment (maximizes caching)
// ============================================

function vercelHeaders() {
  return {
    Authorization: `Bearer ${VERCEL_TOKEN}`,
    "Content-Type": "application/json",
  };
}

function teamParam() {
  return VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : "";
}

/**
 * Build the static HTML package for deployment.
 * Generates a single-page app with all files inlined.
 */
function buildDeploymentPackage(files: { path: string; content: string }[]): { path: string; content: string }[] {
  const htmlFile = files.find(f => f.path.endsWith(".html"));
  const cssFiles = files.filter(f => f.path.endsWith(".css"));
  const jsFiles = files.filter(f => f.path.endsWith(".js") || f.path.endsWith(".jsx") || f.path.endsWith(".tsx"));

  if (htmlFile) {
    // User has HTML — inline CSS/JS into it
    let html = htmlFile.content;
    for (const css of cssFiles) {
      const linkRegex = new RegExp(
        `<link[^>]*href=["']${css.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*/?>`, "gi"
      );
      if (linkRegex.test(html)) {
        html = html.replace(linkRegex, `<style>${css.content}</style>`);
      } else {
        // No link tag, inject before </head>
        html = html.replace("</head>", `<style>${css.content}</style>\n</head>`);
      }
    }
    for (const js of jsFiles) {
      if (js.path === htmlFile.path) continue;
      const scriptRegex = new RegExp(
        `<script[^>]*src=["']${js.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*>\\s*</script>`, "gi"
      );
      if (scriptRegex.test(html)) {
        html = html.replace(scriptRegex, `<script>${js.content}<\/script>`);
      } else {
        html = html.replace("</body>", `<script>${js.content}<\/script>\n</body>`);
      }
    }
    return [{ path: "index.html", content: html }];
  }

  // React/JSX project — build a complete HTML with CDN React
  const cssContent = cssFiles.map(f => f.content).join("\n");
  const jsxFile = jsFiles[0];
  if (!jsxFile) return files.map(f => ({ path: f.path, content: f.content }));

  const cleanCode = jsxFile.content
    .replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, "")
    .replace(/^import\s+['"].*?['"];?\s*$/gm, "")
    .replace(/^export\s+default\s+/gm, "")
    .replace(/^export\s+/gm, "")
    .replace(/module\.exports\s*=\s*/g, "");

  const fullHtml = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>CreazaApp</title>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <script src="https://cdn.tailwindcss.com"><\/script>
  ${cssContent ? `<style>${cssContent}</style>` : ""}
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${cleanCode}
    const rootEl = document.getElementById('root');
    if (typeof App !== 'undefined') {
      ReactDOM.createRoot(rootEl).render(React.createElement(App));
    }
  <\/script>
</body>
</html>`;

  return [{ path: "index.html", content: fullHtml }];
}

/**
 * Assign custom subdomain (slug.creazaapp.com) to a Vercel project.
 * Uses Vercel Domains API — only needs to be done once per project.
 */
async function assignSubdomain(vercelProjectId: string, subdomain: string): Promise<boolean> {
  const domain = `${subdomain}.creazaapp.com`;
  try {
    // Add domain to the Vercel project
    const res = await fetch(`${VERCEL_API}/v10/projects/${vercelProjectId}/domains${teamParam()}`, {
      method: "POST",
      headers: vercelHeaders(),
      body: JSON.stringify({ name: domain }),
    });
    const data = await res.json();
    // 409 = domain already added (that's fine)
    if (res.ok || res.status === 409 || data.error?.code === "domain_already_in_use") {
      return true;
    }
    console.error("[deploy] assign subdomain error:", data);
    return false;
  } catch (err) {
    console.error("[deploy] assign subdomain error:", err);
    return false;
  }
}

/**
 * Deploy to Vercel using the Deployments API v13.
 * Uses file hashing — Vercel only requests files it doesn't already have.
 * Static deployment — no build step = no build minutes cost.
 */
export async function deployToVercel(
  projectFiles: { path: string; content: string }[],
  subdomain: string,
  existingVercelProjectId?: string | null
): Promise<{ success: boolean; url?: string; vercelProjectId?: string; vercelDeploymentId?: string; error?: string }> {
  if (!VERCEL_TOKEN) {
    return { success: false, error: "VERCEL_TOKEN nu este configurat" };
  }

  // Build the deployment package (inline everything into HTML)
  const deployFiles = buildDeploymentPackage(projectFiles);

  // Prepare file list with SHA1 hashes
  const fileList: VercelFile[] = deployFiles.map(f => ({
    file: f.path,
    sha: computeFileSha(f.content),
    size: Buffer.byteLength(f.content, "utf-8"),
  }));

  // Create deployment via Vercel API
  const deployBody: Record<string, unknown> = {
    name: subdomain,
    files: fileList,
    projectSettings: {
      framework: null, // Static — no build step!
    },
    target: "production",
  };

  // If we have an existing Vercel project, reuse it
  if (existingVercelProjectId) {
    deployBody.project = existingVercelProjectId;
  }

  try {
    const res = await fetch(`${VERCEL_API}/v13/deployments${teamParam()}`, {
      method: "POST",
      headers: vercelHeaders(),
      body: JSON.stringify(deployBody),
    });

    const data = await res.json();

    if (res.status === 400 && data.error?.code === "missing_files") {
      // Vercel needs some files uploaded — send only the missing ones
      const missing: string[] = data.error.missing || [];
      const uploads = await Promise.all(
        missing.map(async (sha: string) => {
          const file = deployFiles.find(f => computeFileSha(f.content) === sha);
          if (!file) return null;
          const uploadRes = await fetch(`${VERCEL_API}/v2/files${teamParam()}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${VERCEL_TOKEN}`,
              "Content-Type": "application/octet-stream",
              "x-vercel-digest": sha,
              "Content-Length": String(Buffer.byteLength(file.content, "utf-8")),
            },
            body: file.content,
          });
          return uploadRes.ok;
        })
      );

      if (uploads.some(u => u === null || u === false)) {
        return { success: false, error: "Eroare la uploadul fișierelor" };
      }

      // Retry deployment after uploading missing files
      const retryRes = await fetch(`${VERCEL_API}/v13/deployments${teamParam()}`, {
        method: "POST",
        headers: vercelHeaders(),
        body: JSON.stringify(deployBody),
      });

      const retryData = await retryRes.json();
      if (!retryRes.ok) {
        return { success: false, error: retryData.error?.message || "Eroare la deploy" };
      }

      // Assign custom subdomain
      await assignSubdomain(retryData.projectId, subdomain);
      const cleanUrl = `https://${subdomain}.creazaapp.com`;

      return {
        success: true,
        url: cleanUrl,
        vercelProjectId: retryData.projectId,
        vercelDeploymentId: retryData.id,
      };
    }

    if (!res.ok) {
      return { success: false, error: data.error?.message || `Eroare Vercel: ${res.status}` };
    }

    // Assign custom subdomain
    await assignSubdomain(data.projectId, subdomain);
    const cleanUrl = `https://${subdomain}.creazaapp.com`;

    return {
      success: true,
      url: cleanUrl,
      vercelProjectId: data.projectId,
      vercelDeploymentId: data.id,
    };
  } catch (err) {
    console.error("[deploy] Vercel API error:", err);
    return { success: false, error: "Eroare de conexiune la serverele de deploy" };
  }
}

/**
 * Full deploy flow — checks cache, cooldown, credits, then deploys.
 */
export async function handleDeploy(
  projectId: string,
  userId: string,
  projectName: string,
  files: { path: string; content: string }[]
): Promise<{
  success: boolean;
  url?: string;
  subdomain?: string;
  cached?: boolean;
  error?: string;
  creditsCost?: number;
}> {
  // 1. Check cooldown
  const cooldown = await checkCooldown(projectId);
  if (!cooldown.allowed) {
    const waitMin = Math.ceil(cooldown.waitMs / 60000);
    return { success: false, error: `Așteaptă ${waitMin} minut${waitMin > 1 ? "e" : ""} înainte de următorul deploy` };
  }

  // 2. Compute content hash
  const contentHash = computeContentHash(files);

  // 3. Check if last deploy has same hash — SKIP deploy (free!)
  const lastDeploy = await getLastDeployment(projectId);
  if (lastDeploy && lastDeploy.content_hash === contentHash && lastDeploy.status === "ready") {
    return {
      success: true,
      url: lastDeploy.url || undefined,
      subdomain: lastDeploy.subdomain,
      cached: true,
      creditsCost: 0,
    };
  }

  // 4. Calculate cost
  const isFirstDeploy = !lastDeploy || lastDeploy.status === "error";
  const cost = getDeployCost(isFirstDeploy);

  // 5. Generate or reuse subdomain
  const subdomain = lastDeploy?.subdomain || generateSubdomain(projectName, projectId);

  // 6. Create deployment record
  const record = await createDeploymentRecord(projectId, userId, subdomain, contentHash, cost);
  if (!record) {
    return { success: false, error: "Eroare la salvarea deployment-ului" };
  }

  // 7. Deploy to Vercel
  const result = await deployToVercel(
    files,
    subdomain,
    lastDeploy?.vercel_project_id
  );

  if (!result.success) {
    await updateDeploymentStatus(record.id, "error", { error_message: result.error });
    return { success: false, error: result.error };
  }

  // 8. Update deployment record with Vercel IDs
  await updateDeploymentStatus(record.id, "ready", {
    vercel_project_id: result.vercelProjectId,
    vercel_deployment_id: result.vercelDeploymentId,
    url: result.url,
  });

  return {
    success: true,
    url: result.url,
    subdomain,
    cached: false,
    creditsCost: cost,
  };
}
