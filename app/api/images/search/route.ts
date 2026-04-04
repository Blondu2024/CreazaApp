import { NextRequest, NextResponse } from "next/server";
import { rateLimit, rateLimitResponse, getClientIP } from "@/lib/rate-limit";

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || "";
const PEXELS_API = "https://api.pexels.com/v1";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

interface PexelsPhoto {
  id: number;
  alt: string;
  photographer: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    landscape: string;
  };
}

// OPTIONS — CORS preflight
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// GET /api/images/search?q=cars&count=6&size=medium
// No auth required — images are free. Rate limited by IP.
export async function GET(req: NextRequest) {
  // Rate limit: 30 requests/min per IP
  const ip = getClientIP(req);
  const rl = rateLimit(`images:${ip}`, 30, 60_000);
  if (!rl.allowed) return rateLimitResponse(rl.resetIn);

  const query = req.nextUrl.searchParams.get("q");
  if (!query) {
    return NextResponse.json({ error: "Parametrul q lipsește" }, { status: 400, headers: CORS_HEADERS });
  }

  const count = Math.min(Number(req.nextUrl.searchParams.get("count") || "6"), 15);
  const size = req.nextUrl.searchParams.get("size") || "large";

  if (!PEXELS_API_KEY) {
    return NextResponse.json({ error: "Serviciul de imagini nu este configurat" }, { status: 500, headers: CORS_HEADERS });
  }

  try {
    const res = await fetch(
      `${PEXELS_API}/search?query=${encodeURIComponent(query)}&per_page=${count}&locale=ro-RO`,
      { headers: { Authorization: PEXELS_API_KEY } }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Eroare la căutarea imaginilor" }, { status: 502, headers: CORS_HEADERS });
    }

    const data = await res.json();
    const photos = (data.photos || []).map((p: PexelsPhoto) => ({
      id: p.id,
      url: p.src[size as keyof PexelsPhoto["src"]] || p.src.large,
      urlSmall: p.src.small,
      urlLarge: p.src.large2x,
      alt: p.alt || query,
      photographer: p.photographer,
    }));

    return NextResponse.json({ photos, total: data.total_results }, { headers: CORS_HEADERS });
  } catch {
    return NextResponse.json({ error: "Eroare de conexiune" }, { status: 502, headers: CORS_HEADERS });
  }
}
