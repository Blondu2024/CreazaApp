import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/cont", "/projects", "/workspace"],
      },
    ],
    sitemap: "https://creazaapp.com/sitemap.xml",
  };
}
