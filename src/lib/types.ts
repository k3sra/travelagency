export type TransitionKind = "ripple" | "stretch" | "dissolve";

export interface MediaImage {
  src: string;
  blur: string;
  alt: string;
  width: number;
  height: number;
}

export interface VibeTag {
  label: string;
  pct: number;
}

export interface Traveller {
  id: string;
  firstName: string;
  from: string;
  portrait: string;
  match: number;
  note?: string;
}

export interface Chapter {
  numeral: string;
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
  title: string;
  titleEm?: string;
  /** One short line, the hook. */
  subtitle: string;
  region: string;
  country: string;
  season: string;
  dates: string;
  startDate: string;
  durationDays: number;
  groupMax: number;
  spotsRemaining: number;
  intent: string;
  price: { amount: number; currency: "USD"; deposit: number };
  vibe: VibeTag[];
  hero: MediaImage;
  heroTall: MediaImage;
  card: MediaImage;
  chapters: Chapter[];
  travellers: Traveller[];
  curator: Curator;
  inclusions: string[];
  notIncluded: string[];
  /** Three things you will actually do. */
  highlights: string[];
  /** One honest line on who this week suits. */
  forWho: string;
  transition: TransitionKind;
  promise: string;
}

export type Trip = Journey;
