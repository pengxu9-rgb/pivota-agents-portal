import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/developers/docs',
        destination: 'https://web-production-fedb.up.railway.app/docs',
      },
      {
        source: '/developers/docs/:path*',
        destination: 'https://web-production-fedb.up.railway.app/docs/:path*',
      },
    ]
  },
}

export default nextConfig
