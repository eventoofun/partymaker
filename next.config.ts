import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  // Cloudflare Pages compatibility
  // Uncomment when deploying to Cloudflare:
  // experimental: { runtime: "edge" },

  images: {
    remotePatterns: [
      // Cloudflare R2 — public CDN domain
      { protocol: "https", hostname: "media.cumplefy.com" },
      // R2 direct (fallback / dev)
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      // Fal.ai generated images/videos
      { protocol: "https", hostname: "**.fal.media" },
      { protocol: "https", hostname: "fal.media" },
      // Clerk profile photos
      { protocol: "https", hostname: "img.clerk.com" },
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
