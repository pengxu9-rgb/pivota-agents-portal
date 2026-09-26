import { resolve } from "node:path"
import type { NextConfig } from "next"

const normalizePublicApiBaseUrl = (value?: string) => {
  const raw = String(value || "https://api.pivota.cc").trim().replace(/\/$/, "")
  if (!raw) {
    return "https://api.pivota.cc"
  }
  if (/https?:\/\/[^/]+\.up\.railway\.app$/i.test(raw)) {
    return "https://api.pivota.cc"
  }
  return raw.replace(/^http:\/\//i, "https://")
}

const publicApiBaseUrl = normalizePublicApiBaseUrl(process.env.NEXT_PUBLIC_API_URL)

const nextConfig: NextConfig = {
  // Cloud Run: self-contained server bundle (.next/standalone/server.js)
  output: "standalone",
  outputFileTracingRoot: resolve(process.cwd()),
  async rewrites() {
    return [
      {
        source: "/developers/docs",
        destination: `${publicApiBaseUrl}/docs`,
      },
      {
        // Straight to where the spec lives. The backend's /openapi.json now answers
        // 307 with a RELATIVE `Location: /agent/docs/openapi.json`; proxied through
        // this rewrite, the browser resolved that against developer.pivota.cc and
        // landed on a 404 (seen 2026-09-26).
        source: "/developers/openapi.json",
        destination: `${publicApiBaseUrl}/agent/docs/openapi.json`,
      },
      {
        source: "/developers/docs/:path*",
        destination: `${publicApiBaseUrl}/docs/:path*`,
      },
    ]
  },
}

export default nextConfig
