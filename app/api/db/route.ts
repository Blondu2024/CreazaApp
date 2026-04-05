import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { rateLimit, rateLimitResponse, getClientIP } from "@/lib/rate-limit";

const ALLOWED_ORIGINS = [
  "https://www.creazaapp.com",
  "https://creazaapp.com",
];

function getCorsHeaders(req: NextRequest) {
  const origin = req.headers.get("origin") || "";
  // Allow *.creazaapp.com subdomains (deployed apps) + main domain
  const isAllowed =
    ALLOWED_ORIGINS.includes(origin) ||
    /^https:\/\/[a-z0-9-]+\.creazaapp\.com$/.test(origin) ||
    origin === "null"; // sandbox iframe (preview)

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin || "*" : "https://www.creazaapp.com",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

const MAX_DOC_SIZE = 100_000; // 100KB per document
const MAX_DOCS_PER_COLLECTION = 5000;

// Cache verified projectIds for 5 min to avoid repeated DB lookups
const projectCache = new Map<string, number>();

async function isValidProject(projectId: string): Promise<boolean> {
  const cached = projectCache.get(projectId);
  if (cached && Date.now() - cached < 300_000) return true;

  if (!supabaseAdmin) return false;
  const { data } = await supabaseAdmin
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .is("deleted_at", null)
    .single();

  if (data) {
    projectCache.set(projectId, Date.now());
    return true;
  }
  return false;
}

// OPTIONS — CORS preflight
export async function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 204, headers: getCorsHeaders(req) });
}

// GET /api/db?projectId=X&collection=Y[&id=Z][&filter.field=value][&sort=field&order=asc|desc][&limit=N]
export async function GET(req: NextRequest) {
  const cors = getCorsHeaders(req);
  const params = req.nextUrl.searchParams;
  const projectId = params.get("projectId");
  const collection = params.get("collection");

  if (!projectId || !collection) {
    return NextResponse.json(
      { error: "projectId și collection sunt obligatorii" },
      { status: 400, headers: cors }
    );
  }

  // Verify project exists and is not deleted
  if (!await isValidProject(projectId)) {
    return NextResponse.json({ error: "Proiect invalid" }, { status: 403, headers: cors });
  }

  // Rate limit: 60 req/min per project
  const rl = rateLimit(`db:${projectId}`, 60, 60_000);
  if (!rl.allowed) return rateLimitResponse(rl.resetIn);

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Eroare internă" }, { status: 500, headers: cors });
  }

  const docId = params.get("id");

  try {
    if (docId) {
      // Get single document
      const { data, error } = await supabaseAdmin
        .from("project_data")
        .select("id, collection, data, created_at, updated_at")
        .eq("project_id", projectId)
        .eq("collection", collection)
        .eq("id", docId)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: "Document negăsit" }, { status: 404, headers: cors });
      }
      return NextResponse.json({ doc: { id: data.id, ...data.data, _created: data.created_at, _updated: data.updated_at } }, { headers: cors });
    }

    // List documents in collection
    let query = supabaseAdmin
      .from("project_data")
      .select("id, data, created_at, updated_at")
      .eq("project_id", projectId)
      .eq("collection", collection);

    // Sort
    const sort = params.get("sort") || "created_at";
    const order = params.get("order") || "desc";
    query = query.order(sort === "created_at" || sort === "updated_at" ? sort : "created_at", {
      ascending: order === "asc",
    });

    // Limit
    const limit = Math.min(Number(params.get("limit") || "100"), 500);
    query = query.limit(limit);

    const { data, error } = await query;
    if (error) {
      console.error("[db] list error:", error);
      return NextResponse.json({ error: "Eroare la citire" }, { status: 500, headers: cors });
    }

    const docs = (data || []).map(d => ({
      id: d.id,
      ...d.data,
      _created: d.created_at,
      _updated: d.updated_at,
    }));

    // Apply client-side filters (filter.field=value)
    let filtered = docs;
    for (const [key, value] of params.entries()) {
      if (key.startsWith("filter.")) {
        const field = key.slice(7);
        filtered = filtered.filter(d => String(d[field]) === value);
      }
    }

    return NextResponse.json({ docs: filtered, count: filtered.length }, { headers: cors });
  } catch (err) {
    console.error("[db] GET error:", err);
    return NextResponse.json({ error: "Eroare la citire" }, { status: 500, headers: cors });
  }
}

// POST /api/db — create document
// Body: { projectId, collection, data }
export async function POST(req: NextRequest) {
  const cors = getCorsHeaders(req);
  const ip = getClientIP(req);
  const rl = rateLimit(`db:write:${ip}`, 30, 60_000);
  if (!rl.allowed) return rateLimitResponse(rl.resetIn);

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Eroare internă" }, { status: 500, headers: cors });
  }

  try {
    const body = await req.json();
    const { projectId, collection, data } = body;

    if (!projectId || !collection || !data) {
      return NextResponse.json(
        { error: "projectId, collection și data sunt obligatorii" },
        { status: 400, headers: cors }
      );
    }

    // Verify project exists and is not deleted
    if (!await isValidProject(projectId)) {
      return NextResponse.json({ error: "Proiect invalid" }, { status: 403, headers: cors });
    }

    // Validate document size
    const docSize = JSON.stringify(data).length;
    if (docSize > MAX_DOC_SIZE) {
      return NextResponse.json(
        { error: `Documentul e prea mare (${Math.ceil(docSize / 1024)}KB). Maxim: ${MAX_DOC_SIZE / 1000}KB` },
        { status: 400, headers: cors }
      );
    }

    // Check collection document count limit
    const { count } = await supabaseAdmin
      .from("project_data")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("collection", collection);

    if (count !== null && count >= MAX_DOCS_PER_COLLECTION) {
      return NextResponse.json(
        { error: `Colecția "${collection}" a atins limita de ${MAX_DOCS_PER_COLLECTION} documente` },
        { status: 400, headers: cors }
      );
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("project_data")
      .insert({
        project_id: projectId,
        collection,
        data,
      })
      .select("id, data, created_at")
      .single();

    if (error) {
      console.error("[db] insert error:", error);
      return NextResponse.json({ error: "Eroare la salvare" }, { status: 500, headers: cors });
    }

    return NextResponse.json(
      { doc: { id: inserted.id, ...inserted.data, _created: inserted.created_at } },
      { status: 201, headers: cors }
    );
  } catch (err) {
    console.error("[db] POST error:", err);
    return NextResponse.json({ error: "Eroare la salvare" }, { status: 500, headers: cors });
  }
}

// PUT /api/db — update document
// Body: { projectId, collection, id, data }
export async function PUT(req: NextRequest) {
  const cors = getCorsHeaders(req);
  const ip = getClientIP(req);
  const rl = rateLimit(`db:write:${ip}`, 30, 60_000);
  if (!rl.allowed) return rateLimitResponse(rl.resetIn);

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Eroare internă" }, { status: 500, headers: cors });
  }

  try {
    const body = await req.json();
    const { projectId, collection, id, data } = body;

    if (!projectId || !collection || !id || !data) {
      return NextResponse.json(
        { error: "projectId, collection, id și data sunt obligatorii" },
        { status: 400, headers: cors }
      );
    }

    // Verify project exists and is not deleted
    if (!await isValidProject(projectId)) {
      return NextResponse.json({ error: "Proiect invalid" }, { status: 403, headers: cors });
    }

    const docSize = JSON.stringify(data).length;
    if (docSize > MAX_DOC_SIZE) {
      return NextResponse.json(
        { error: `Documentul e prea mare (${Math.ceil(docSize / 1024)}KB). Maxim: ${MAX_DOC_SIZE / 1000}KB` },
        { status: 400, headers: cors }
      );
    }

    const { data: updated, error } = await supabaseAdmin
      .from("project_data")
      .update({ data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("project_id", projectId)
      .eq("collection", collection)
      .select("id, data, updated_at")
      .single();

    if (error || !updated) {
      return NextResponse.json({ error: "Document negăsit" }, { status: 404, headers: cors });
    }

    return NextResponse.json(
      { doc: { id: updated.id, ...updated.data, _updated: updated.updated_at } },
      { headers: cors }
    );
  } catch (err) {
    console.error("[db] PUT error:", err);
    return NextResponse.json({ error: "Eroare la actualizare" }, { status: 500, headers: cors });
  }
}

// DELETE /api/db?projectId=X&collection=Y&id=Z
export async function DELETE(req: NextRequest) {
  const cors = getCorsHeaders(req);
  const ip = getClientIP(req);
  const rl = rateLimit(`db:write:${ip}`, 30, 60_000);
  if (!rl.allowed) return rateLimitResponse(rl.resetIn);

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Eroare internă" }, { status: 500, headers: cors });
  }

  const params = req.nextUrl.searchParams;
  const projectId = params.get("projectId");
  const collection = params.get("collection");
  const id = params.get("id");

  if (!projectId || !collection || !id) {
    return NextResponse.json(
      { error: "projectId, collection și id sunt obligatorii" },
      { status: 400, headers: cors }
    );
  }

  // Verify project exists and is not deleted
  if (!await isValidProject(projectId)) {
    return NextResponse.json({ error: "Proiect invalid" }, { status: 403, headers: cors });
  }

  try {
    const { error } = await supabaseAdmin
      .from("project_data")
      .delete()
      .eq("id", id)
      .eq("project_id", projectId)
      .eq("collection", collection);

    if (error) {
      console.error("[db] delete error:", error);
      return NextResponse.json({ error: "Eroare la ștergere" }, { status: 500, headers: cors });
    }

    return NextResponse.json({ deleted: true }, { headers: cors });
  } catch (err) {
    console.error("[db] DELETE error:", err);
    return NextResponse.json({ error: "Eroare la ștergere" }, { status: 500, headers: cors });
  }
}
