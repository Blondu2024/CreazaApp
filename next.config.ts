import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow E2B sandbox preview URLs in iframes
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
