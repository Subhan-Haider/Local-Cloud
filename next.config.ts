import type { NextConfig } from "next";

// The Express API server URL (only used server-side for rewrites, never exposed to browser)
// Set EXPRESS_API_URL in Vercel env vars (without NEXT_PUBLIC_ prefix)
const EXPRESS_API_URL = "https://storage.lootops.me";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.lootops.me",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "server.lootops.me",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "storage.subhan.tech",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "server.subhan.tech",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/**",
      },
    ],
  },

  // ─── VERCEL / CROSS-DOMAIN FIX ─────────────────────────────────────────────
  // When the frontend is on Vercel and Express is on a separate VPS,
  // we can't use cross-domain cookies (MFA tokens, etc.).
  // These rewrites make Vercel act as a transparent proxy for all Express routes,
  // so the browser only ever talks to ONE domain → cookies work perfectly.
  async rewrites() {
    return [
      // Admin API
      { source: "/admin/:path*", destination: `${EXPRESS_API_URL}/admin/:path*` },
      // File upload
      { source: "/upload", destination: `${EXPRESS_API_URL}/upload` },
      // File serving & downloads
      { source: "/file-serve/:path*", destination: `${EXPRESS_API_URL}/file-serve/:path*` },
      { source: "/file-download/:path*", destination: `${EXPRESS_API_URL}/file-download/:path*` },
      // Thumbnails
      { source: "/thumbnails/:path*", destination: `${EXPRESS_API_URL}/thumbnails/:path*` },
      // 2FA / Auth endpoints
      { source: "/api/auth/:path*", destination: `${EXPRESS_API_URL}/api/auth/:path*` },
      // Health check
      { source: "/api/health", destination: `${EXPRESS_API_URL}/api/health` },
      // File & folder operations (rename, move, create)
      { source: "/rename", destination: `${EXPRESS_API_URL}/rename` },
      { source: "/move-file", destination: `${EXPRESS_API_URL}/move-file` },
      { source: "/create-folder", destination: `${EXPRESS_API_URL}/create-folder` },
    ];
  },
};

export default nextConfig;
