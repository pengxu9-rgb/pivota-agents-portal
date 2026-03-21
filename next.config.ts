import { resolve } from "node:path"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  outputFileTracingRoot: resolve(process.cwd()),
  async rewrites() {
    return [
      // API documentation main page
      {
        source: "/developers/docs",
        destination: "https://web-production-fedb.up.railway.app/docs",
      },
      // OpenAPI spec
      {
        source: "/developers/openapi.json",
        destination: "https://web-production-fedb.up.railway.app/openapi.json",
      },
      // Swagger UI assets
      {
        source: "/developers/docs/:path*",
        destination: "https://web-production-fedb.up.railway.app/docs/:path*",
      },
    ]
  },
}

export default nextConfig
