/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Force Next.js to skip TypeScript errors on Vercel build
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig