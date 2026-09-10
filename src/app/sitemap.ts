import type { MetadataRoute } from "next";

// Required for `output: "export"` (GitHub Pages build).
export const dynamic = "force-static";
import { getJourneys } from "@/lib/journeys";

const BASE = "https://fabletravels.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const journeys = getJourneys().map((j) => ({
    url: `${BASE}/journeys/${j.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));
  return [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/journeys`, changeFrequency: "weekly", priority: 0.9 },
    ...journeys,
  ];
}
