import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",        // Fully static export (no SSR, no API routes)
  trailingSlash: true,     // Optional: good for static hosting
  images: {
    unoptimized: true,     // Required for static export if using <Image />
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;