import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Allow production builds to complete even with ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to complete even with TypeScript errors (use cautiously)
    ignoreBuildErrors: false,
  },
  images: {
    // Configure allowed quality values for next/image
    qualities: [25, 50, 75, 90, 100],
  },
};

export default nextConfig;
