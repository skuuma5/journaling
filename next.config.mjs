/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Disable type checking during build step on Vercel
    ignoreBuildErrors: true,
  },
  eslint: {
    // Disable ESLint during build step on Vercel
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;