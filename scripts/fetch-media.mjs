#!/usr/bin/env node
/**
 * Fable Travels — real photography and film from Pexels.
 *
 * Every asset in the media manifest is searched on Pexels (curated, free to
 * use under the Pexels licence), the best match for the frame is downloaded
 * and cropped to the layout's exact aspect, and pre-blurred siblings are
 * written for the blur-to-focus reveal. The hero film is a Pexels video:
 * an H.264 MP4 is referenced by URL (src/lib/media-remote.json) and its
 * poster frame is cropped from the video's own preview image.
 *
 * Usage: PEXELS_API_KEY=... node scripts/fetch-media.mjs [--only=<substring>] [--skip-videos] [--force] [--regrade]
 */

import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const OUT = path.join(ROOT, "public", "media");
const KEY = process.env.PEXELS_API_KEY;
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) ?? "").split("=")[1] || "";
const SKIP_VIDEOS = process.argv.includes("--skip-videos");
if (!KEY) {
  console.error("PEXELS_API_KEY is required (free key at https://www.pexels.com/api/).");
  process.exit(1);
}

const FRAMES = {
  wide: { w: 2000, h: 1250, orientation: "landscape" },
  card: { w: 1400, h: 1750, orientation: "portrait" },
  tall: { w: 1250, h: 2000, orientation: "portrait" },
  poster: { w: 1920, h: 1080, orientation: "landscape" },
  portrait: { w: 600, h: 800, orientation: "portrait" },
};

/** rel → { frame, queries (in order of preference) } */
const IMAGES = {
  "journeys/kyoto-in-silence/hero.jpg": { frame: "wide", q: ["kyoto moss garden temple", "kyoto zen garden autumn", "kyoto temple mist"] },
  "journeys/kyoto-in-silence/hero-tall.jpg": { frame: "tall", q: ["kyoto temple autumn maple", "kyoto torii path", "japanese garden stone lantern"] },
  "journeys/kyoto-in-silence/card.jpg": { frame: "card", q: ["gion kyoto night lantern street", "kyoto alley night lanterns", "japan lantern night street"] },
  "journeys/kyoto-in-silence/chapter-01.jpg": { frame: "wide", q: ["women colorful kimono kyoto street", "kimono women walking kyoto temple", "kyoto lanterns night shrine"] },
  "journeys/kyoto-in-silence/chapter-02.jpg": { frame: "wide", q: ["moss garden kyoto", "japanese moss temple garden", "zen garden moss stone"] },
  "journeys/kyoto-in-silence/chapter-03.jpg": { frame: "wide", q: ["friends izakaya laughing japan", "japanese tea ceremony hands", "matcha tea ceremony bowl"] },
  "journeys/kyoto-in-silence/chapter-04.jpg": { frame: "wide", q: ["japan shrine lanterns stairs forest", "kifune shrine lanterns", "kyoto shrine stone stairs lanterns"] },
  "journeys/kyoto-in-silence/chapter-05.jpg": { frame: "wide", q: ["arashiyama bamboo grove", "bamboo forest kyoto path", "bamboo forest morning light"] },

  "journeys/patagonia-unhurried/hero.jpg": { frame: "wide", q: ["torres del paine sunrise", "patagonia mountains lake sunrise", "torres del paine lake"] },
  "journeys/patagonia-unhurried/hero-tall.jpg": { frame: "tall", q: ["torres del paine", "patagonia mountain peak", "fitz roy mountain"] },
  "journeys/patagonia-unhurried/card.jpg": { frame: "card", q: ["hikers summit celebration mountains", "friends hiking mountain lake", "gaucho horse patagonia"] },
  "journeys/patagonia-unhurried/chapter-01.jpg": { frame: "wide", q: ["torres del paine turquoise lake", "patagonia lake mountains", "cuernos del paine"] },
  "journeys/patagonia-unhurried/chapter-02.jpg": { frame: "wide", q: ["grey glacier patagonia", "glacier wall blue ice patagonia", "perito moreno glacier"] },
  "journeys/patagonia-unhurried/chapter-03.jpg": { frame: "wide", q: ["friends campfire mountains night laughing", "friends hiking laughing mountains", "horses patagonia steppe"] },
  "journeys/patagonia-unhurried/chapter-04.jpg": { frame: "wide", q: ["fitz roy sunrise", "fitz roy laguna", "el chalten mountains"] },
  "journeys/patagonia-unhurried/chapter-05.jpg": { frame: "wide", q: ["patagonia road mountains", "empty road mountains patagonia", "ruta 40 patagonia"] },

  "journeys/sahara-under-glass/hero.jpg": { frame: "wide", q: ["sahara dunes sunset morocco", "erg chebbi dunes", "desert dunes golden light"] },
  "journeys/sahara-under-glass/hero-tall.jpg": { frame: "tall", q: ["sahara dunes morocco", "desert dune ridge", "sand dunes sunset"] },
  "journeys/sahara-under-glass/card.jpg": { frame: "card", q: ["desert camp night stars morocco", "sahara camp milky way", "desert tent stars night"] },
  "journeys/sahara-under-glass/chapter-01.jpg": { frame: "wide", q: ["friends rooftop dinner marrakech sunset", "rooftop dinner friends night lights", "riad courtyard marrakech"] },
  "journeys/sahara-under-glass/chapter-02.jpg": { frame: "wide", q: ["atlas mountains road morocco", "tizi n tichka", "morocco mountain pass road"] },
  "journeys/sahara-under-glass/chapter-03.jpg": { frame: "wide", q: ["kasbah palm oasis morocco", "skoura palm grove", "ait benhaddou kasbah"] },
  "journeys/sahara-under-glass/chapter-04.jpg": { frame: "wide", q: ["friends desert camp fire night", "desert camp dinner lanterns night friends", "sahara night stars milky way"] },
  "journeys/sahara-under-glass/chapter-05.jpg": { frame: "wide", q: ["sahara sunrise dunes", "desert sunrise sand dunes", "erg chebbi sunrise"] },

  "journeys/iceland-edge-of-light/hero.jpg": { frame: "wide", q: ["aurora iceland mountain", "northern lights iceland vestrahorn", "aurora borealis iceland"] },
  "journeys/iceland-edge-of-light/hero-tall.jpg": { frame: "tall", q: ["northern lights iceland", "aurora borealis kirkjufell", "iceland aurora"] },
  "journeys/iceland-edge-of-light/card.jpg": { frame: "card", q: ["woman hot spring iceland steam", "friends geothermal lagoon iceland", "iceland hot spring steam"] },
  "journeys/iceland-edge-of-light/chapter-01.jpg": { frame: "wide", q: ["reykjavik harbour night", "reykjavik harbor lights", "reykjavik winter"] },
  "journeys/iceland-edge-of-light/chapter-02.jpg": { frame: "wide", q: ["reynisfjara black sand beach", "black sand beach basalt columns iceland", "vik iceland beach"] },
  "journeys/iceland-edge-of-light/chapter-03.jpg": { frame: "wide", q: ["ice cave iceland", "blue ice cave vatnajokull", "glacier cave"] },
  "journeys/iceland-edge-of-light/chapter-04.jpg": { frame: "wide", q: ["friends hot spring laughing snow", "couple geothermal lagoon iceland", "hot river iceland snow"] },
  "journeys/iceland-edge-of-light/chapter-05.jpg": { frame: "wide", q: ["jokulsarlon icebergs", "glacier lagoon iceland sunrise", "diamond beach iceland"] },
};

// Moments: real people, mid-trip, having the time of their lives.
const MOMENTS = {
  "moments/m01.jpg": { frame: "card", q: ["woman jumping off boat into sea", "friends jumping into sea from yacht", "girl jumping into turquoise water boat"] },
  "moments/m02.jpg": { frame: "wide", q: ["candid friends rooftop sunset drinks", "friends rooftop party sunset", "friends toast sunset rooftop"] },
  "moments/m03.jpg": { frame: "card", q: ["candid friends road trip car window", "friends road trip car laughing", "woman car window sunset happy"] },
  "moments/m04.jpg": { frame: "wide", q: ["candid friends sailing boat laughing", "friends yacht deck laughing", "friends boat summer"] },
  "moments/m05.jpg": { frame: "card", q: ["candid friends bonfire beach night", "friends dancing beach night", "friends bonfire night sparklers"] },
  "moments/m06.jpg": { frame: "wide", q: ["candid friends hiking summit", "friends mountain top arms raised", "hikers cheering summit"] },
  "moments/m07.jpg": { frame: "card", q: ["candid friends pool villa", "friends pool sunset laughing", "woman pool sunset"] },
  "moments/m08.jpg": { frame: "wide", q: ["young adults dinner party wine night terrace", "friends clinking glasses dinner table night", "group of friends toasting wine outdoor night"] },
};
Object.assign(IMAGES, MOMENTS);

const PORTRAIT_QUERIES = [
  "black and white portrait woman", "black and white portrait man beard", "portrait woman natural light", "portrait man moody",
  "portrait woman smiling monochrome", "portrait man glasses", "portrait woman scarf", "portrait man street",
  "portrait woman hat", "portrait young man", "portrait older man", "portrait older woman",
  "portrait woman curly hair", "portrait man profile", "portrait woman braid", "portrait woman laughing",
  "portrait man hat monochrome", "portrait woman studio", "portrait man window light", "portrait woman confident",
];

/* ----------------------------------------------------------------------------
   Pexels
   ---------------------------------------------------------------------------- */

async function pexels(pathname, params) {
  const url = new URL(`https://api.pexels.com${pathname}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: { Authorization: KEY } });
    if (res.status === 429) { await new Promise((r) => setTimeout(r, 4000 * (attempt + 1))); continue; }
    if (!res.ok) throw new Error(`Pexels ${res.status} for ${url}`);
    return res.json();
  }
  throw new Error("Pexels rate limit");
}

const used = new Set();

async function findPhoto(queries, frame, { portrait = false } = {}) {
  const { w, h, orientation } = FRAMES[frame];
  for (const q of queries) {
    const data = await pexels("/v1/search", { query: q, orientation, size: "large", per_page: 15 });
    const cands = (data.photos ?? []).filter((p) => !used.has(p.id) && p.width >= (portrait ? 1200 : 2400) && p.height >= (portrait ? 1600 : 1200));
    // Prefer frames close to the target aspect so the crop keeps the composition.
    const target = w / h;
    cands.sort((a, b) => Math.abs(a.width / a.height - target) - Math.abs(b.width / b.height - target));
    if (cands.length) return cands.slice(0, 4);
  }
  return [];
}

/** Try candidates in order until one downloads. */
async function fetchFirst(cands, width) {
  for (const photo of cands) {
    const buf = await download(`${photo.src.original}?auto=compress&cs=tinysrgb&w=${width}`);
    if (buf) return { photo, buf };
  }
  return null;
}

async function download(url) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) return Buffer.from(await res.arrayBuffer());
    } catch {}
    await new Promise((r) => setTimeout(r, 1500));
  }
  return null;
}

async function writeImage(rel, buf, frame, { portrait = false } = {}) {
  const { w, h } = FRAMES[frame];
  let img = sharp(buf).rotate().resize(w, h, { fit: "cover", position: sharp.strategy.attention });
  if (portrait) img = img.grayscale().tint({ r: 232, g: 224, b: 210 }).linear(1.04, -3);
  else img = grade(img);
  const out = path.join(OUT, rel);
  await mkdir(path.dirname(out), { recursive: true });
  const jpg = await img.jpeg({ quality: portrait ? 80 : 82, mozjpeg: true, progressive: true }).toBuffer();
  await writeFile(out, jpg);
  if (!portrait) {
    const bh = Math.round((h / w) * 640);
    const blur = await sharp(jpg).resize(640, bh).blur(22).jpeg({ quality: 55, mozjpeg: true }).toBuffer();
    await writeFile(out.replace(/\.jpg$/, "-blur.jpg"), blur);
  }
  return jpg.length;
}

/**
 * One grade for every still so the site reads as a single roll of film rather
 * than a stock library: blacks lifted a touch, contrast eased, saturation
 * pulled back slightly, shadows warmed, plus a whisper of grain.
 */
function grade(img) {
  return img
    .modulate({ saturation: 0.88, brightness: 1.0 })
    .linear(0.92, 10)
    .recomb([
      [1.0, 0.0, 0.0],
      [0.0, 0.985, 0.015],
      [0.03, 0.0, 0.93],
    ])
    .gamma(1.05);
}

function credit(photo) {
  return { id: photo.id, photographer: photo.photographer, photographerUrl: photo.photographer_url, url: photo.url, alt: photo.alt };
}

/* ----------------------------------------------------------------------------
   Main
   ---------------------------------------------------------------------------- */

const creditsPath = path.join(OUT, "credits.json");
const credits = existsSync(creditsPath) ? JSON.parse(await readFile(creditsPath, "utf8")) : {};
for (const c of Object.values(credits)) if (c.id) used.add(c.id);

// Images
const FORCE = process.argv.includes("--force");
const REGRADE = process.argv.includes("--regrade");
if (REGRADE) {
  for (const [rel, spec] of Object.entries(IMAGES)) {
    if (ONLY && !rel.includes(ONLY)) continue;
    const c = credits[rel];
    if (!c?.id) continue;
    let photo;
    try { photo = await pexels(`/v1/photos/${c.id}`, {}); } catch { console.log(`  SKIP ${rel} (photo ${c.id} gone)`); continue; }
    const got = await fetchFirst([photo], 2600);
    if (!got) { console.log(`  SKIP ${rel} (download failed)`); continue; }
    const bytes = await writeImage(rel, got.buf, spec.frame);
    console.log(`  regraded ${rel.padEnd(46)} ${(bytes / 1024).toFixed(0).padStart(4)} KB`);
  }
}
for (const [rel, spec] of Object.entries(IMAGES)) {
  if (ONLY && !rel.includes(ONLY)) continue;
  if (!FORCE && existsSync(path.join(OUT, rel)) && credits[rel]) continue;
  const got = await fetchFirst(await findPhoto(spec.q, spec.frame), 2600);
  if (!got) { console.log(`  MISSING ${rel}`); continue; }
  used.add(got.photo.id);
  const bytes = await writeImage(rel, got.buf, spec.frame);
  credits[rel] = credit(got.photo);
  console.log(`  ${rel.padEnd(50)} ${(bytes / 1024).toFixed(0).padStart(4)} KB  ${got.photo.photographer} · ${(got.photo.alt || "").slice(0, 50)}`);
}

// Portraits (monochrome)
const targets = [];
for (let i = 1; i <= 16; i++) targets.push(`portraits/p${String(i).padStart(2, "0")}.jpg`);
for (let i = 1; i <= 4; i++) targets.push(`curators/c${String(i).padStart(2, "0")}.jpg`);
for (let i = 0; i < targets.length; i++) {
  const rel = targets[i];
  if (ONLY && !rel.includes(ONLY)) continue;
  if (!FORCE && existsSync(path.join(OUT, rel)) && credits[rel]) continue;
  const q = PORTRAIT_QUERIES[i % PORTRAIT_QUERIES.length];
  const got = await fetchFirst(await findPhoto([q, "portrait black and white"], "portrait", { portrait: true }), 1200);
  if (!got) { console.log(`  MISSING ${rel}`); continue; }
  used.add(got.photo.id);
  const bytes = await writeImage(rel, got.buf, "portrait", { portrait: true });
  credits[rel] = credit(got.photo);
  console.log(`  ${rel.padEnd(50)} ${(bytes / 1024).toFixed(0).padStart(4)} KB  ${got.photo.photographer}`);
}

// Films: a landscape and a portrait clip for the home hero and every journey.
// Each clip's own frame becomes the poster / hero still, so the WebGL
// transition lands on the exact frame the film starts from.
const FILMS = {
  hero: { q: ["friends jumping off yacht into sea", "friends yacht party champagne sunset", "women jumping into sea boat slow motion", "friends swimming sea boat summer"], qTall: ["friends jumping into sea vertical", "yacht party vertical", "friends beach sunset vertical"] },
  moments: { q: ["friends rooftop party sunset slow motion", "friends toasting sunset drinks slow motion", "friends dancing sunset", "friends road trip convertible sunset"], qTall: ["friends party sunset vertical", "friends dancing vertical", "friends cheers vertical"] },
  "kyoto-in-silence": { q: ["kyoto temple night lanterns", "japan temple autumn maple", "kyoto bamboo forest", "japan torii gates"], qTall: ["japan temple vertical", "kyoto vertical", "japan lanterns night vertical"] },
  "patagonia-unhurried": { q: ["patagonia drone mountains lake", "torres del paine", "glacier drone aerial", "patagonia horses"], qTall: ["mountains lake vertical drone", "glacier vertical", "patagonia vertical"] },
  "sahara-under-glass": { q: ["sahara dunes drone sunset", "desert dunes aerial golden", "morocco desert camels sunset", "sand dunes wind"], qTall: ["desert dunes vertical", "sahara vertical", "sand dunes vertical drone"] },
  "iceland-edge-of-light": { q: ["aurora borealis timelapse iceland", "northern lights timelapse", "iceland waterfall drone", "iceland black sand beach drone"], qTall: ["northern lights vertical", "iceland vertical drone", "waterfall vertical"] },
};

async function findFilm(queries, orientation) {
  for (const q of queries) {
    const data = await pexels("/videos/search", { query: q, orientation, size: "large", per_page: 12 });
    const cands = (data.videos ?? []).filter((v) => v.duration >= 8 && v.duration <= 45 && !used.has(`v${v.id}`));
    const want = orientation === "portrait" ? (v) => v.height > v.width : (v) => v.width > v.height;
    const ok = cands.filter(want);
    if (ok.length) return ok[0];
  }
  return null;
}

function filmFiles(v) {
  const mp4 = v.video_files.filter((f) => f.file_type === "video/mp4" && f.width && f.height).sort((a, b) => b.width * b.height - a.width * a.height);
  const long = (f) => Math.max(f.width, f.height);
  const hd = mp4.find((f) => long(f) <= 1920 && long(f) >= 1280) ?? mp4[mp4.length - 1];
  const sd = mp4.find((f) => long(f) <= 1280 && long(f) >= 640) ?? hd;
  return { hd: hd.link, sd: sd.link, width: hd.width, height: hd.height };
}

if (!SKIP_VIDEOS) {
  const remotePath = path.join(ROOT, "src/lib/media-remote.json");
  const remote = ONLY && existsSync(remotePath) ? JSON.parse(await readFile(remotePath, "utf8")) : { heroVideo: null, moments: null, journeys: {} };
  for (const [key, spec] of Object.entries(FILMS)) {
    if (ONLY && !(ONLY === "films" || key.includes(ONLY))) continue;
    const wide = await findFilm(spec.q, "landscape");
    const tall = await findFilm(spec.qTall, "portrait");
    if (!wide) { console.log(`  MISSING film ${key}`); continue; }
    used.add(`v${wide.id}`); if (tall) used.add(`v${tall.id}`);
    const entry = {
      wide: { ...filmFiles(wide), duration: wide.duration, url: wide.url, credit: wide.user?.name ?? "" },
      tall: tall ? { ...filmFiles(tall), duration: tall.duration, url: tall.url, credit: tall.user?.name ?? "" } : null,
    };
    // Posters from the films' own frames.
    const frame = await download(wide.image.replace(/\?.*$/, "") + "?auto=compress&cs=tinysrgb&w=2400");
    const frameTall = tall ? await download(tall.image.replace(/\?.*$/, "") + "?auto=compress&cs=tinysrgb&w=1600") : null;
    if (key === "moments") {
      if (frame) await writeImage("moments/film.jpg", frame, "wide");
      if (frameTall) await writeImage("moments/film-tall.jpg", frameTall, "tall");
      remote.moments = entry;
      credits["moments/film"] = { id: wide.id, photographer: wide.user?.name, url: wide.url, tall: tall?.url };
    } else if (key === "hero") {
      if (frame) await writeImage("hero/poster.jpg", frame, "poster");
      if (frameTall) await writeImage("hero/poster-tall.jpg", frameTall, "tall");
      remote.heroVideo = entry;
      credits["hero/film"] = { id: wide.id, photographer: wide.user?.name, url: wide.url, tall: tall?.url };
    } else {
      if (frame) await writeImage(`journeys/${key}/hero.jpg`, frame, "wide");
      if (frameTall) await writeImage(`journeys/${key}/hero-tall.jpg`, frameTall, "tall");
      remote.journeys[key] = entry;
      credits[`journeys/${key}/film`] = { id: wide.id, photographer: wide.user?.name, url: wide.url, tall: tall?.url };
    }
    console.log(`  film ${key.padEnd(24)} ${wide.duration}s ${entry.wide.width}x${entry.wide.height} by ${wide.user?.name}${tall ? ` · portrait ${tall.duration}s by ${tall.user?.name}` : " · no portrait"}`);
  }
  await writeFile(remotePath, JSON.stringify(remote, null, 2));
}

await writeFile(creditsPath, JSON.stringify(credits, null, 2));
const lines = ["# Photography and film credits", "", "All imagery and film is from Pexels (https://www.pexels.com/license/). Travellers and hosts on the site are fictional personas; the portraits are stock photographs.", ""];
for (const [rel, c] of Object.entries(credits)) lines.push(`- \`${rel}\` — ${c.photographer || "Pexels"} · ${c.url}`);
await writeFile(path.join(ROOT, "CREDITS.md"), lines.join("\n") + "\n");
console.log(`credits: ${Object.keys(credits).length} entries`);
