import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75, 90],
    deviceSizes: [640, 828, 1080, 1280, 1600, 1920, 2560],
  },
};

export default nextConfig;
