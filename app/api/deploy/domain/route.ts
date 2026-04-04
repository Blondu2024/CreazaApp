import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/verify-auth";
import { checkCredits, deductCredits } from "@/lib/credits";
import { getLastDeployment, addCustomDomain, checkDomainStatus, removeCustomDomain } from "@/lib/deploy";

const CUSTOM_DOMAIN_COST = 50;

// POST /api/deploy/domain — connect custom domain
export async function POST(req: NextRequest) {
  const userId = await verifyAuth(req);
  if (!userId) {
    return NextResponse.json({ error: "Autentificare necesară" }, { status: 401 });
  }

  const { projectId, domain } = await req.json();
  if (!projectId || !domain) {
    return NextResponse.json({ error: "projectId și domain sunt necesare" }, { status: 400 });
  }

  // Validate domain format
  const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z]{2,})+$/.test(cleanDomain)) {
    return NextResponse.json({ error: "Domeniu invalid. Ex: mysite.ro" }, { status: 400 });
  }

  // Check deployment exists
  const deployment = await getLastDeployment(projectId);
  if (!deployment || deployment.user_id !== userId || deployment.status !== "ready") {
    return NextResponse.json({ error: "Publică proiectul mai întâi" }, { status: 400 });
  }

  // Already has same domain
  if (deployment.custom_domain === cleanDomain) {
    const status = await checkDomainStatus(deployment.vercel_project_id!, cleanDomain);
    return NextResponse.json({ success: true, domain: cleanDomain, ...status });
  }

  // Check credits
  const creditCheck = await checkCredits(userId, CUSTOM_DOMAIN_COST);
  if (!creditCheck.allowed) {
    return NextResponse.json({
      error: `Credite insuficiente. Ai ${creditCheck.balance}, dar costă ${CUSTOM_DOMAIN_COST}.`,
      needCredits: true,
    }, { status: 402 });
  }

  // Add domain to Vercel + DB
  const result = await addCustomDomain(deployment, cleanDomain);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  // Deduct credits
  await deductCredits(userId, CUSTOM_DOMAIN_COST, {
    model: "custom-domain",
    inputTokens: 0,
    outputTokens: 0,
    description: `Domeniu custom: ${cleanDomain}`,
  });

  return NextResponse.json({
    success: true,
    domain: cleanDomain,
    dnsRecords: result.dnsRecords,
    verified: false,
  });
}

// GET /api/deploy/domain?projectId=xxx — check domain verification status
export async function GET(req: NextRequest) {
  const userId = await verifyAuth(req);
  if (!userId) {
    return NextResponse.json({ error: "Autentificare necesară" }, { status: 401 });
  }

  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId lipsește" }, { status: 400 });
  }

  const deployment = await getLastDeployment(projectId);
  if (!deployment || deployment.user_id !== userId || !deployment.custom_domain) {
    return NextResponse.json({ domain: null });
  }

  const status = await checkDomainStatus(deployment.vercel_project_id!, deployment.custom_domain);

  return NextResponse.json({
    domain: deployment.custom_domain,
    ...status,
  });
}

// DELETE /api/deploy/domain — remove custom domain
export async function DELETE(req: NextRequest) {
  const userId = await verifyAuth(req);
  if (!userId) {
    return NextResponse.json({ error: "Autentificare necesară" }, { status: 401 });
  }

  const { projectId } = await req.json();
  const deployment = await getLastDeployment(projectId);
  if (!deployment || deployment.user_id !== userId || !deployment.custom_domain) {
    return NextResponse.json({ error: "Niciun domeniu de șters" }, { status: 400 });
  }

  await removeCustomDomain(deployment);
  return NextResponse.json({ success: true });
}
