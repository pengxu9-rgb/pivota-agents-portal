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

// Portal v2 route consolidation (build-readiness review §4), only when the build-time flag is
// on. Temporary (307) while v2 is new. Flag off, there are no redirects, exactly as before.
// /docs and its aliases stay as they are for now. /onboarding is NOT redirected: it is the signed-out
// path from /login and /forgot-password to /signup, and a config redirect can't tell who is signed in.
const portalV2Redirects =
  process.env.NEXT_PUBLIC_FEATURE_PORTAL_V2 === "true"
    ? [
        { source: "/api-usage", destination: "/logs", permanent: false },
        { source: "/analytics", destination: "/logs", permanent: false },
        { source: "/endpoints", destination: "/logs", permanent: false },
        { source: "/revenue", destination: "/earnings", permanent: false },
        { source: "/payouts", destination: "/earnings", permanent: false },
        { source: "/wallet", destination: "/earnings", permanent: false },
        { source: "/debug-orders", destination: "/orders", permanent: false },
      ]
    : []

const nextConfig: NextConfig = {
  // Cloud Run: self-contained server bundle (.next/standalone/server.js)
  output: "standalone",
  // Build-time flags are ALWAYS defined, so every `process.env.NEXT_PUBLIC_FEATURE_PORTAL_V2 === "true"`
  // gate folds at build time. Left unset, Next would not inline it: the gate would survive into the
  // bundle (shipping the v2 code, CSS and fonts) and be decided at runtime, server and client apart.
  env: {
    NEXT_PUBLIC_FEATURE_PORTAL_V2: process.env.NEXT_PUBLIC_FEATURE_PORTAL_V2 === "true" ? "true" : "false",
  },
  outputFileTracingRoot: resolve(process.cwd()),
  ...(portalV2Redirects.length ? { async redirects() { return portalV2Redirects } } : {}),
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
