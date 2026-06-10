import type { NextConfig } from "next";

// The Express API server URL — read from environment variable.
// Docker users: set NEXT_PUBLIC_API_URL in docker-compose.yml (defaults to http://localhost:5000)
// Vercel/remote users: set SERVER_BASE_URL in your environment
const EXPRESS_API_URL =
  process.env.SERVER_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

const nextConfig: NextConfig = {
  // Required for Docker — generates a self-contained output in .next/standalone
  output: "standalone",

  images: {
    // Allow images from any hostname so self-hosted users don't need to configure this
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "**",
        pathname: "/**",
      },
    ],
  },

  // ─── PROXY REWRITES ──────────────────────────────────────────────────────────
  // These make Next.js act as a transparent proxy to Express.
  // This means the browser always talks to ONE origin → cookies, auth, and CORS work correctly.
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
      // Alert endpoints (login & visit emails)
      { source: "/api/alerts/:path*", destination: `${EXPRESS_API_URL}/api/alerts/:path*` },
      // Public files endpoint
      { source: "/api/public-files", destination: `${EXPRESS_API_URL}/api/public-files` },
      // Health check
      { source: "/api/health", destination: `${EXPRESS_API_URL}/health` },
      // File & folder operations
      { source: "/rename", destination: `${EXPRESS_API_URL}/rename` },
      { source: "/move-file", destination: `${EXPRESS_API_URL}/move-file` },
      { source: "/create-folder", destination: `${EXPRESS_API_URL}/create-folder` },
      { source: "/share/:path*", destination: `${EXPRESS_API_URL}/share/:path*` },
      // Generic API catch-all — proxies /api/* to Express
      { source: "/api/:path*", destination: `${EXPRESS_API_URL}/api/:path*` },
    ];
  },
};

export default nextConfig;
