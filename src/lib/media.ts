/**
 * Media manifest.
 *
 * Stills live under MEDIA_BASE ("/media", prefixed with NEXT_PUBLIC_BASE_PATH
 * on sub-path hosts such as GitHub Pages). Films are licensed Pexels clips
 * streamed from Pexels (H.264 MP4), recorded in media-remote.json by
 * `npm run media`, with their own first frames as the posters under hero/ and
 * journeys/<slug>/. Point NEXT_PUBLIC_MEDIA_BASE at a CDN that mirrors the
 * same paths to serve your own stills.
 */

import remote from "./media-remote.json";
import type { MediaImage } from "./types";

const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

export const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_BASE ?? `${BASE_PATH}/media`;

export const media = (path: string) => `${MEDIA_BASE}/${path.replace(/^\/+/, "")}`;

export interface FilmFile {
  hd: string;
  sd: string;
  width: number;
  height: number;
  duration?: number;
  url?: string;
  credit?: string;
}

export interface Film {
  wide: FilmFile;
  tall: FilmFile | null;
}

interface RemoteMedia {
  heroVideo: Film | null;
  moments?: Film | null;
  journeys: Record<string, Film>;
}

const REMOTE = remote as unknown as RemoteMedia;

export const HERO_FILM: Film | null = REMOTE.heroVideo ?? null;

export const MOMENTS_FILM: Film | null = REMOTE.moments ?? null;

export const getFilm = (slug: string): Film | null => REMOTE.journeys?.[slug] ?? null;

export const HERO_POSTER = {
  wide: media("hero/poster.jpg"),
  wideBlur: media("hero/poster-blur.jpg"),
  tall: media("hero/poster-tall.jpg"),
  tallBlur: media("hero/poster-tall-blur.jpg"),
};

export const image = (
  path: string,
  alt: string,
  width = 2000,
  height = 1250,
): MediaImage => ({
  src: media(path),
  blur: media(path.replace(/\.(jpg|jpeg|png|webp)$/i, "-blur.$1")),
  alt,
  width,
  height,
});

export const MOMENTS_POSTER = {
  wide: media("moments/film.jpg"),
  wideBlur: media("moments/film-blur.jpg"),
  tall: media("moments/film-tall.jpg"),
  tallBlur: media("moments/film-tall-blur.jpg"),
};

/** Candid stills of travellers mid-trip, alternating portrait and landscape frames. */
export const moment = (n: number, alt: string, wide: boolean): MediaImage =>
  image(`moments/m${String(n).padStart(2, "0")}.jpg`, alt, wide ? 2000 : 1400, wide ? 1250 : 1750);

export const portrait = (n: number) => media(`portraits/p${String(n).padStart(2, "0")}.jpg`);
export const curatorPortrait = (n: number) => media(`curators/c${String(n).padStart(2, "0")}.jpg`);
