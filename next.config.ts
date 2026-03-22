import { resolve } from "node:path"
import type { NextConfig } from "next"

const publicApiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "https://api.pivota.cc").replace(/\/$/, "")

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
