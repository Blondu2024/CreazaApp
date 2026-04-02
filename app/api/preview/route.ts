import { NextRequest } from "next/server";

// GET /api/preview?url=https://3000-sandboxid.e2b.app/path
// Proxies E2B sandbox content through our domain to avoid iframe CSP blocks
export async function GET(req: NextRequest) {
  const targetUrl = req.nextUrl.searchParams.get("url");

  if (!targetUrl || !targetUrl.includes(".e2b.app")) {
    return new Response("Missing or invalid url param", { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: { "Accept": "text/html,*/*" },
    });

    const contentType = response.headers.get("content-type") || "text/html";
    const body = await response.arrayBuffer();

    // For HTML responses, rewrite asset URLs to also go through our proxy
    if (contentType.includes("text/html")) {
      let html = new TextDecoder().decode(body);
      const baseUrl = new URL(targetUrl);
      const origin = baseUrl.origin;

      // Rewrite relative and absolute URLs to go through proxy
      html = html.replace(
        /(href|src|action)="(?!https?:\/\/|data:|blob:|javascript:|#)(\/?)([^"]*?)"/g,
        (_match, attr, slash, path) => {
          const fullUrl = slash ? `${origin}/${path}` : `${origin}/${path}`;
          return `${attr}="/api/preview?url=${encodeURIComponent(fullUrl)}"`;
        }
      );

      return new Response(html, {
        status: response.status,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "X-Frame-Options": "SAMEORIGIN",
        },
      });
    }

    // For non-HTML (CSS, JS, images), pass through directly
    return new Response(body, {
      status: response.status,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=30",
      },
    });
  } catch (error) {
    return new Response(
      `Proxy error: ${error instanceof Error ? error.message : "Unknown"}`,
      { status: 502 }
    );
  }
}
