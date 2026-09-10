import type { MetadataRoute } from "next";

// Required for `output: "export"` (GitHub Pages build).
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://fabletravels.com/sitemap.xml",
  };
}
