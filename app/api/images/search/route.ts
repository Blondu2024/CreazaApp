import { NextRequest, NextResponse } from "next/server";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { verifyAuth } from "@/lib/verify-auth";

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || "";
const PEXELS_API = "https://api.pexels.com/v1";

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

// GET /api/images/search?q=cars&count=6&size=medium
export async function GET(req: NextRequest) {
  const userId = await verifyAuth(req);
  if (!userId) {
    return NextResponse.json({ error: "Autentificare necesară" }, { status: 401 });
  }

  // Rate limit: 30 requests/min per user
  const rl = rateLimit(`images:${userId}`, 30, 60_000);
  if (!rl.allowed) return rateLimitResponse(rl.resetIn);

  const query = req.nextUrl.searchParams.get("q");
  if (!query) {
    return NextResponse.json({ error: "Parametrul q lipsește" }, { status: 400 });
  }

  const count = Math.min(Number(req.nextUrl.searchParams.get("count") || "6"), 15);
  const size = req.nextUrl.searchParams.get("size") || "large";

  if (!PEXELS_API_KEY) {
    return NextResponse.json({ error: "Serviciul de imagini nu este configurat" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `${PEXELS_API}/search?query=${encodeURIComponent(query)}&per_page=${count}&locale=ro-RO`,
      { headers: { Authorization: PEXELS_API_KEY } }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Eroare la căutarea imaginilor" }, { status: 502 });
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

    return NextResponse.json({ photos, total: data.total_results });
  } catch {
    return NextResponse.json({ error: "Eroare de conexiune" }, { status: 502 });
  }
}
