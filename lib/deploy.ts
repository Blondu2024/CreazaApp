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
  custom_domain: string | null;
  custom_domain_verified: boolean;
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

  // Check if a record already exists for this subdomain (redeploy case)
  const { data: existing } = await supabaseAdmin
    .from("deployments")
    .select("id")
    .eq("subdomain", subdomain)
    .limit(1)
    .maybeSingle();

  if (existing) {
    // Redeploy: update existing record
    const { data, error } = await supabaseAdmin
      .from("deployments")
      .update({
        project_id: projectId,
        user_id: userId,
        content_hash: contentHash,
        credits_charged: credits,
        status: "building",
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) { console.error("[deploy] update error:", error); return null; }
    return data;
  }

  // First deploy: insert new record
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

// CreazaApp watermark — injected in deployed HTML for free plan
const CREAZAAPP_WATERMARK = `<a href="https://creazaapp.com" target="_blank" rel="noopener" id="creazaapp-badge" style="position:fixed;bottom:12px;right:12px;z-index:9999;display:flex;align-items:center;gap:6px;background:rgba(15,15,30,0.85);backdrop-filter:blur(8px);padding:6px 12px;border-radius:8px;border:1px solid rgba(99,102,241,0.3);text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,sans-serif;transition:opacity 0.2s" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='0.7'"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.5 4.5h4.74l-3.84 2.79 1.47 4.52L12 12.02l-3.87 2.79 1.47-4.52L5.76 7.5h4.74L12 3z"/></svg><span style="color:#a5b4fc;font-size:11px;font-weight:500">Creat cu CreazaApp.com</span></a>`;

// Base URL for the main CreazaApp app — deployed sites call APIs here
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.creazaapp.com";

/**
 * Rewrite relative API paths to absolute URLs so deployed static sites
 * can reach CreazaApp APIs (images, Eden AI, etc.)
 */
function rewriteApiUrls(code: string): string {
  // Match fetch('/api/...), fetch("/api/...), and fetch(`/api/...) — all quote styles including backticks
  return code
    .replace(/fetch\(\s*(['"`])\/api\//g, `fetch($1${APP_BASE_URL}/api/`)
    .replace(/(['"`])\/api\/images\/search/g, `$1${APP_BASE_URL}/api/images/search`)
    .replace(/(['"`])\/api\/eden\//g, `$1${APP_BASE_URL}/api/eden/`);
}

/**
 * Build the static HTML package for deployment.
 * Generates a single-page app with all files inlined.
 * Injects CreazaApp watermark for free plan users.
 */
function buildDeploymentPackage(files: { path: string; content: string }[], userPlan: string = "free"): { path: string; content: string }[] {
  const showWatermark = userPlan === "free";
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
    // Inject watermark for free plan
    if (showWatermark) {
      html = html.replace("</body>", `${CREAZAAPP_WATERMARK}\n</body>`);
    }
    // Rewrite relative API URLs to absolute so they work on deployed subdomain
    html = rewriteApiUrls(html);
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
  ${showWatermark ? CREAZAAPP_WATERMARK : ""}
  <script type="text/babel">
    ${cleanCode}
    const rootEl = document.getElementById('root');
    if (typeof App !== 'undefined') {
      ReactDOM.createRoot(rootEl).render(React.createElement(App));
    }
  <\/script>
</body>
</html>`;

  // Rewrite relative API URLs to absolute so they work on deployed subdomain
  return [{ path: "index.html", content: rewriteApiUrls(fullHtml) }];
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
  existingVercelProjectId?: string | null,
  userPlan: string = "free"
): Promise<{ success: boolean; url?: string; vercelProjectId?: string; vercelDeploymentId?: string; error?: string }> {
  if (!VERCEL_TOKEN) {
    return { success: false, error: "VERCEL_TOKEN nu este configurat" };
  }

  // Build the deployment package (inline everything into HTML + watermark for free)
  const deployFiles = buildDeploymentPackage(projectFiles, userPlan);

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
    console.log("[deploy] Vercel API response:", res.status, JSON.stringify(data).slice(0, 500));

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
  files: { path: string; content: string }[],
  userPlan: string = "free",
  force: boolean = false
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

  // 3. Check if last deploy has same hash — SKIP deploy (free!) — unless forced
  const lastDeploy = await getLastDeployment(projectId);
  if (!force && lastDeploy && lastDeploy.content_hash === contentHash && lastDeploy.status === "ready") {
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

  // 7. Deploy to Vercel (pass userPlan for watermark logic)
  const result = await deployToVercel(
    files,
    subdomain,
    lastDeploy?.vercel_project_id,
    userPlan
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

// ============================================
// Custom Domain Management
// ============================================

interface DnsRecord {
  type: string;
  name: string;
  value: string;
}

/**
 * Add a custom domain to the Vercel project.
 */
export async function addCustomDomain(
  deployment: Deployment,
  domain: string
): Promise<{ success: boolean; dnsRecords?: DnsRecord[]; error?: string }> {
  if (!deployment.vercel_project_id) {
    return { success: false, error: "Proiectul nu a fost publicat încă" };
  }

  try {
    // Add domain to Vercel project
    const res = await fetch(
      `${VERCEL_API}/v10/projects/${deployment.vercel_project_id}/domains${teamParam()}`,
      {
        method: "POST",
        headers: vercelHeaders(),
        body: JSON.stringify({ name: domain }),
      }
    );

    const data = await res.json();

    if (!res.ok && res.status !== 409) {
      return { success: false, error: data.error?.message || "Eroare la adăugarea domeniului" };
    }

    // Save to DB
    if (supabaseAdmin) {
      await supabaseAdmin
        .from("deployments")
        .update({ custom_domain: domain, custom_domain_verified: false, updated_at: new Date().toISOString() })
        .eq("id", deployment.id);
    }

    // Return DNS instructions for the user
    const isApex = domain.split(".").length === 2; // e.g. mysite.ro (no subdomain)
    const dnsRecords: DnsRecord[] = isApex
      ? [{ type: "A", name: "@", value: "76.76.21.21" }]
      : [{ type: "CNAME", name: domain.split(".")[0], value: "cname.vercel-dns.com" }];

    return { success: true, dnsRecords };
  } catch (err) {
    console.error("[deploy] add custom domain error:", err);
    return { success: false, error: "Eroare de conexiune" };
  }
}

/**
 * Check if a custom domain is verified/configured on Vercel.
 */
export async function checkDomainStatus(
  vercelProjectId: string,
  domain: string
): Promise<{ verified: boolean; dnsRecords?: DnsRecord[]; error?: string }> {
  try {
    const res = await fetch(
      `${VERCEL_API}/v9/projects/${vercelProjectId}/domains/${domain}${teamParam()}`,
      { headers: vercelHeaders() }
    );

    const data = await res.json();
    if (!res.ok) {
      return { verified: false, error: data.error?.message };
    }

    const verified = data.verified === true;

    // Update DB
    if (supabaseAdmin && verified) {
      await supabaseAdmin
        .from("deployments")
        .update({ custom_domain_verified: true })
        .eq("vercel_project_id", vercelProjectId)
        .eq("custom_domain", domain);
    }

    if (!verified) {
      const isApex = domain.split(".").length === 2;
      const dnsRecords: DnsRecord[] = isApex
        ? [{ type: "A", name: "@", value: "76.76.21.21" }]
        : [{ type: "CNAME", name: domain.split(".")[0], value: "cname.vercel-dns.com" }];
      return { verified: false, dnsRecords };
    }

    return { verified: true };
  } catch {
    return { verified: false, error: "Eroare la verificare" };
  }
}

/**
 * Remove custom domain from Vercel project + DB.
 */
export async function removeCustomDomain(deployment: Deployment): Promise<void> {
  if (deployment.vercel_project_id && deployment.custom_domain) {
    try {
      await fetch(
        `${VERCEL_API}/v9/projects/${deployment.vercel_project_id}/domains/${deployment.custom_domain}${teamParam()}`,
        { method: "DELETE", headers: vercelHeaders() }
      );
    } catch {
      // Ignore — cleanup best effort
    }
  }

  if (supabaseAdmin) {
    await supabaseAdmin
      .from("deployments")
      .update({ custom_domain: null, custom_domain_verified: false, updated_at: new Date().toISOString() })
      .eq("id", deployment.id);
  }
}
