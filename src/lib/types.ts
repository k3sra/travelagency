/**
 * Fable Travels — domain model.
 * Everything the pages render comes from this shape. Swap the source of
 * `getJourneys()` for a CMS later without touching components.
 */

export type TransitionKind = "ripple" | "stretch" | "dissolve";

export interface MediaImage {
  /** Sharp, full-resolution asset (served from /public or MEDIA_BASE). */
  src: string;
  /** Pre-blurred sibling used by the blur-to-focus reveal (compositor-only crossfade). */
  blur: string;
  alt: string;
  /** Intrinsic size so <img> never causes layout shift. */
  width: number;
  height: number;
}

export interface VibeTag {
  label: string;
  /** 0–100. Rendered as "[ 85% Cultural Deep Dive ]". */
  pct: number;
}

export interface Traveller {
  id: string;
  firstName: string;
  /** "Lagos → London" reads as home → base; keep it short. */
  from: string;
  /** Monochrome portrait path. */
  portrait: string;
  /** 0–100 vibe alignment with this journey. */
  match: number;
  /** Optional one-line note shown on hover in the marquee. */
  note?: string;
}

export interface Chapter {
  /** Roman numeral label, e.g. "I", "II". */
  numeral: string;
  /** Day span, e.g. "Days 1–2". */
  days: string;
  title: string;
  body: string;
  image: MediaImage;
}

export interface Curator {
  name: string;
  role: string;
  bio: string;
  portrait: string;
}

export interface Journey {
  slug: string;
  /** Headline, may contain a single italic span via `titleEm`. */
  title: string;
  /** Word or phrase inside the title to set in italic gold. */
  titleEm?: string;
  subtitle: string;
  region: string;
  country: string;
  season: string;
  /** Human dates, e.g. "21 Nov – 29 Nov 2026". */
  dates: string;
  /** ISO start date for structured data. */
  startDate: string;
  durationDays: number;
  groupMax: number;
  spotsRemaining: number;
  price: { amount: number; currency: "USD"; deposit: number };
  vibe: VibeTag[];
  hero: MediaImage;
  card: MediaImage;
  chapters: Chapter[];
  travellers: Traveller[];
  curator: Curator;
  inclusions: string[];
  /** Which WebGL displacement to use when navigating INTO this journey. */
  transition: TransitionKind;
  /** Short manifesto line under the header. */
  promise: string;
}
