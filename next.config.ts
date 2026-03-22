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
  outputFileTracingRoot: resolve(process.cwd()),
  async rewrites() {
    return [
      {
        source: "/developers/docs",
        destination: `${publicApiBaseUrl}/docs`,
      },
      {
        source: "/developers/openapi.json",
        destination: `${publicApiBaseUrl}/openapi.json`,
      },
      {
        source: "/developers/docs/:path*",
        destination: `${publicApiBaseUrl}/docs/:path*`,
      },
    ]
  },
}

export default nextConfig
