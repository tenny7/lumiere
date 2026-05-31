import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the Turbopack workspace root to this project directory. Without this,
  // Turbopack can misinfer the root as a parent folder and then fail to resolve
  // packages such as `tailwindcss` (it only resolves within the root). The dev,
  // build, and start scripts all run from the project root, so cwd is correct.
  turbopack: {
    root: path.resolve(),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
