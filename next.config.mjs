/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Production should fail fast on type errors.
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    turbopack: {},
  },
}

export default nextConfig
