import type { NextConfig } from "next";

/**
 * STATIC_EXPORT=1 produces a fully static build in ./out for hosts like
 * GitHub Pages. NEXT_PUBLIC_BASE_PATH ("/travelagency" on Pages, "" on a
 * custom domain or Vercel) prefixes routes and, via src/lib/media.ts, media.
 */
const isStatic = process.env.STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") || "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isStatic
    ? {
        output: "export",
        trailingSlash: true,
        basePath: basePath || undefined,
        images: { unoptimized: true },
      }
    : {
        images: {
          formats: ["image/avif", "image/webp"],
          qualities: [60, 75, 90],
          deviceSizes: [640, 828, 1080, 1280, 1600, 1920, 2560],
        },
      }),
};

export default nextConfig;
