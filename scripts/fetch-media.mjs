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

/**
 * rel → { frame, ov: Openverse queries, q: Pexels queries }. Every frame has a
 * person in it. Openverse (Creative Commons photographs, mostly Flickr) is
 * tried first because that is where the unposed, phone-shot, wind-in-the-hair
 * pictures live; Pexels is the fallback.
 */
const IMAGES = {
  "journeys/kyoto-in-silence/card.jpg": { frame: "card", ov: ["friends kimono kyoto laughing", "kyoto friends night lanterns", "yukata friends kyoto"], q: ["friends kimono kyoto walking", "tourists yukata kyoto night"] },
  "journeys/kyoto-in-silence/chapter-01.jpg": { frame: "wide", ov: ["gion night friends walking", "kyoto night street people umbrella", "pontocho night people"], q: ["kyoto street night people walking lanterns", "friends kimono kyoto night"] },
  "journeys/kyoto-in-silence/chapter-02.jpg": { frame: "wide", ov: ["kyoto temple visitors moss garden", "japan temple garden people walking", "kyoto garden woman walking"], q: ["woman walking japanese garden temple", "kyoto temple visitors"] },
  "journeys/kyoto-in-silence/chapter-03.jpg": { frame: "wide", ov: ["tea ceremony friends japan", "matcha tea ceremony guests", "izakaya friends laughing"], q: ["friends izakaya laughing japan", "japanese tea ceremony guests"] },
  "journeys/kyoto-in-silence/chapter-04.jpg": { frame: "wide", ov: ["kurama hike friends", "hiking kyoto mountains friends", "japan forest shrine hikers"], q: ["friends hiking forest shrine japan", "hikers stone stairs forest japan"] },
  "journeys/kyoto-in-silence/chapter-05.jpg": { frame: "wide", ov: ["arashiyama bamboo people walking", "bamboo forest friends walking", "bamboo grove tourists"], q: ["people walking bamboo forest kyoto", "friends bamboo forest"] },

  "journeys/patagonia-unhurried/card.jpg": { frame: "card", ov: ["torres del paine hikers laughing", "patagonia hikers friends", "trekking friends patagonia"], q: ["hikers summit celebration mountains", "friends hiking mountain lake"] },
  "journeys/patagonia-unhurried/chapter-01.jpg": { frame: "wide", ov: ["torres del paine trekking group", "patagonia hikers lake", "w trek hikers"], q: ["friends hiking patagonia lake", "hikers torres del paine"] },
  "journeys/patagonia-unhurried/chapter-02.jpg": { frame: "wide", ov: ["glacier hike group patagonia", "perito moreno trekking people", "ice trekking friends"], q: ["people glacier trekking ice", "friends glacier hike"] },
  "journeys/patagonia-unhurried/chapter-03.jpg": { frame: "wide", ov: ["friends campfire mountains night", "asado friends patagonia", "estancia friends"], q: ["friends campfire mountains night laughing", "friends bonfire night mountains"] },
  "journeys/patagonia-unhurried/chapter-04.jpg": { frame: "wide", ov: ["fitz roy hikers sunrise", "el chalten trekking friends", "laguna de los tres hikers"], q: ["hikers mountain sunrise friends", "friends hiking sunrise mountains"] },
  "journeys/patagonia-unhurried/chapter-05.jpg": { frame: "wide", ov: ["road trip friends patagonia car", "friends van road mountains", "ruta 40 friends car"], q: ["friends road trip mountains van", "friends car window mountains"] },

  "journeys/sahara-under-glass/card.jpg": { frame: "card", ov: ["desert camp friends night morocco", "sahara camp friends fire", "merzouga camp friends"], q: ["friends desert camp night fire", "desert camp friends night"] },
  "journeys/sahara-under-glass/chapter-01.jpg": { frame: "wide", ov: ["marrakech rooftop friends sunset", "morocco rooftop dinner friends", "marrakech friends terrace"], q: ["friends rooftop dinner marrakech sunset", "friends rooftop terrace evening"] },
  "journeys/sahara-under-glass/chapter-02.jpg": { frame: "wide", ov: ["atlas mountains road trip friends", "morocco road trip friends car", "friends 4x4 morocco"], q: ["friends road trip morocco mountains", "friends car desert road"] },
  "journeys/sahara-under-glass/chapter-03.jpg": { frame: "wide", ov: ["morocco oasis friends walking", "kasbah friends morocco", "ait benhaddou friends"], q: ["friends walking kasbah morocco", "friends palm oasis"] },
  "journeys/sahara-under-glass/chapter-04.jpg": { frame: "wide", ov: ["sahara campfire friends night", "desert campfire friends stars", "bedouin camp friends fire"], q: ["friends desert camp fire night", "campfire friends desert night"] },
  "journeys/sahara-under-glass/chapter-05.jpg": { frame: "wide", ov: ["sahara dunes friends sunrise", "friends running sand dunes", "erg chebbi friends dune"], q: ["friends running sand dunes sunrise", "people walking dunes sunrise"] },

  "journeys/iceland-edge-of-light/card.jpg": { frame: "card", ov: ["friends hot spring iceland laughing", "blue lagoon friends", "iceland hot pool friends"], q: ["friends geothermal lagoon iceland", "woman hot spring iceland steam"] },
  "journeys/iceland-edge-of-light/chapter-01.jpg": { frame: "wide", ov: ["reykjavik friends night bar", "reykjavik nightlife friends", "reykjavik friends winter street"], q: ["friends bar night laughing winter", "friends night city winter laughing"] },
  "journeys/iceland-edge-of-light/chapter-02.jpg": { frame: "wide", ov: ["reynisfjara friends beach", "iceland black beach people wind", "vik beach friends"], q: ["people black sand beach iceland wind", "friends black sand beach"] },
  "journeys/iceland-edge-of-light/chapter-03.jpg": { frame: "wide", ov: ["ice cave iceland people", "glacier cave visitors", "vatnajokull ice cave tour"], q: ["people ice cave iceland", "ice cave visitors"] },
  "journeys/iceland-edge-of-light/chapter-04.jpg": { frame: "wide", ov: ["reykjadalur hot river people", "hot spring friends snow iceland", "iceland hot river bathing"], q: ["friends hot spring laughing snow", "couple geothermal lagoon iceland"] },
  "journeys/iceland-edge-of-light/chapter-05.jpg": { frame: "wide", ov: ["northern lights friends watching", "aurora people watching iceland", "jokulsarlon friends"], q: ["people watching northern lights", "friends aurora night"] },

  // Moments: real people, mid-trip, caught rather than posed.
  "moments/m01.jpg": { frame: "card", ov: ["friends jumping off boat", "friends jumping into lake", "jumping into sea friends"], q: ["woman jumping off boat into sea", "friends jumping into sea from yacht"] },
  "moments/m02.jpg": { frame: "wide", ov: ["friends rooftop party sunset", "friends beer sunset rooftop", "rooftop friends laughing"], q: ["candid friends rooftop sunset drinks", "friends rooftop party sunset"] },
  "moments/m03.jpg": { frame: "card", ov: ["friends road trip car laughing", "friends convertible road trip", "road trip friends car window"], q: ["candid friends road trip car window", "friends road trip car laughing"] },
  "moments/m04.jpg": { frame: "wide", ov: ["friends sailing boat laughing", "friends sailboat", "sailing friends wind"], q: ["candid friends sailing boat laughing", "friends yacht deck laughing"] },
  "moments/m05.jpg": { frame: "card", ov: ["friends campfire beach night", "friends bonfire beach", "beach bonfire party"], q: ["candid friends bonfire beach night", "friends dancing beach night"] },
  "moments/m06.jpg": { frame: "wide", ov: ["hikers summit celebration", "friends mountain summit jumping", "summit friends arms up"], q: ["candid friends hiking summit", "friends mountain top arms raised"] },
  "moments/m07.jpg": { frame: "card", ov: ["friends pool villa party", "friends swimming pool sunset", "pool party friends"], q: ["candid friends pool villa", "friends pool sunset laughing"] },
  "moments/m08.jpg": { frame: "wide", ov: ["friends dinner table night laughing", "friends long table dinner outdoor", "dinner party friends laughing"], q: ["young adults dinner party wine night terrace", "friends clinking glasses dinner table night"] },
};

const PORTRAIT_QUERIES = [
  "candid portrait woman laughing", "candid portrait man laughing beard", "woman mid laugh portrait", "man laughing candid",
  "woman laughing wind hair", "man smiling candid street", "woman laughing cafe", "man candid portrait outdoors",
  "woman laughing hat", "young man laughing candid", "older man laughing candid", "older woman laughing candid",
  "woman curly hair laughing", "man profile laughing", "woman laughing friends", "woman laughing sunlight",
  "man hat laughing", "woman candid smile", "man window light candid", "woman confident laughing",
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

/* ----------------------------------------------------------------------------
   Openverse (Creative Commons; Flickr, Wikimedia and friends)
   ---------------------------------------------------------------------------- */

const OV_OK = new Set(["by", "by-sa", "cc0", "pdm"]);

async function openverse(q, orientation) {
  const url = new URL("https://api.openverse.org/v1/images/");
  url.searchParams.set("q", q);
  url.searchParams.set("license_type", "commercial");
  url.searchParams.set("page_size", "20");
  url.searchParams.set("mature", "false");
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) { await new Promise((r) => setTimeout(r, 5000)); continue; }
      if (!res.ok) return [];
      const data = await res.json();
      return (data.results ?? []).filter((r) => {
        if (!OV_OK.has(r.license)) return false;
        if (!r.width || !r.height) return false;
        if (Math.max(r.width, r.height) < 900) return false;
        if (r.source === "rawpixel" || r.source === "stocksnap") return false;
        return orientation === "portrait" ? r.height > r.width : r.width >= r.height;
      });
    } catch { await new Promise((r) => setTimeout(r, 2000)); }
  }
  return [];
}

async function findOpenverse(queries, frame) {
  const { w, h, orientation } = FRAMES[frame];
  const target = w / h;
  for (const q of queries) {
    const cands = (await openverse(q, orientation)).filter((r) => !used.has(`ov${r.id}`));
    cands.sort((a, b) => Math.abs(a.width / a.height - target) - Math.abs(b.width / b.height - target));
    if (cands.length) return cands.slice(0, 4).map((r) => ({ provider: "openverse", raw: r }));
  }
  return [];
}

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

/** Try candidates in order until one downloads. Pexels photos and Openverse wrappers both welcome. */
async function fetchFirst(cands, width) {
  for (const photo of cands) {
    const url = photo.provider === "openverse" ? photo.raw.url : `${photo.src.original}?auto=compress&cs=tinysrgb&w=${width}`;
    const buf = await download(url);
    if (buf) return { photo, buf };
  }
  return null;
}

function mark(photo) {
  used.add(photo.provider === "openverse" ? `ov${photo.raw.id}` : photo.id);
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
  let img = sharp(buf).rotate().resize(w, h, { fit: "cover", position: sharp.strategy.attention, kernel: "lanczos3" });
  if (portrait) img = img.grayscale().tint({ r: 232, g: 224, b: 210 }).linear(1.04, -3);
  else img = grade(img);
  const out = path.join(OUT, rel);
  await mkdir(path.dirname(out), { recursive: true });
  if (!portrait) {
    const grain = await sharp({ create: { width: w, height: h, channels: 3, noise: { type: "gaussian", mean: 128, sigma: 9 } } }).jpeg({ quality: 90 }).toBuffer();
    img = sharp(await img.toBuffer()).composite([{ input: grain, blend: "overlay" }]);
  }
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
  if (photo.provider === "openverse") {
    const r = photo.raw;
    return { provider: "openverse", id: r.id, src: r.url, photographer: r.creator || "Unknown", photographerUrl: r.creator_url || r.foreign_landing_url, url: r.foreign_landing_url, alt: r.title, license: r.license.toUpperCase(), licenseUrl: r.license_url };
  }
  return { provider: "pexels", id: photo.id, photographer: photo.photographer, photographerUrl: photo.photographer_url, url: photo.url, alt: photo.alt, license: "Pexels" };
}

/* ----------------------------------------------------------------------------
   Main
   ---------------------------------------------------------------------------- */

const creditsPath = path.join(OUT, "credits.json");
const credits = existsSync(creditsPath) ? JSON.parse(await readFile(creditsPath, "utf8")) : {};
for (const c of Object.values(credits)) if (c.id) used.add(c.provider === "openverse" ? `ov${c.id}` : c.id);

// Images
const FORCE = process.argv.includes("--force");
const REGRADE = process.argv.includes("--regrade");
const PEXELS_ONLY = process.argv.includes("--pexels");
if (REGRADE) {
  for (const [rel, spec] of Object.entries(IMAGES)) {
    if (ONLY && !rel.includes(ONLY)) continue;
    const c = credits[rel];
    if (!c?.id) continue;
    let photo;
    if (c.provider === "openverse") photo = { provider: "openverse", raw: { id: c.id, url: c.src } };
    else { try { photo = await pexels(`/v1/photos/${c.id}`, {}); } catch { console.log(`  SKIP ${rel} (photo ${c.id} gone)`); continue; } }
    const got = await fetchFirst([photo], 2600);
    if (!got) { console.log(`  SKIP ${rel} (download failed)`); continue; }
    const bytes = await writeImage(rel, got.buf, spec.frame);
    console.log(`  regraded ${rel.padEnd(46)} ${(bytes / 1024).toFixed(0).padStart(4)} KB`);
  }
}
for (const [rel, spec] of Object.entries(IMAGES)) {
  if (ONLY && !rel.includes(ONLY)) continue;
  if (!FORCE && existsSync(path.join(OUT, rel)) && credits[rel]) continue;
  let got = PEXELS_ONLY || !spec.ov ? null : await fetchFirst(await findOpenverse(spec.ov, spec.frame), 2600);
  if (!got) got = await fetchFirst(await findPhoto(spec.q, spec.frame), 2600);
  if (!got) { console.log(`  MISSING ${rel}`); continue; }
  mark(got.photo);
  const bytes = await writeImage(rel, got.buf, spec.frame);
  credits[rel] = credit(got.photo);
  const c = credits[rel];
  console.log(`  ${rel.padEnd(50)} ${(bytes / 1024).toFixed(0).padStart(4)} KB  ${c.provider} · ${c.photographer} · ${(c.alt || "").slice(0, 44)}`);
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
  const got = await fetchFirst(await findPhoto([q, "candid laughing portrait"], "portrait", { portrait: true }), 1200);
  if (!got) { console.log(`  MISSING ${rel}`); continue; }
  mark(got.photo);
  const bytes = await writeImage(rel, got.buf, "portrait", { portrait: true });
  credits[rel] = credit(got.photo);
  console.log(`  ${rel.padEnd(50)} ${(bytes / 1024).toFixed(0).padStart(4)} KB  ${got.photo.photographer}`);
}

// Films: a landscape and a portrait clip for the home hero and every journey.
// Each clip's own frame becomes the poster / hero still, so the WebGL
// transition lands on the exact frame the film starts from.
const FILMS = {
  hero: { q: ["friends jumping off boat handheld", "friends laughing boat sunset", "friends running into sea sunset", "friends jumping into sea"], qTall: ["friends jumping into sea vertical", "friends beach sunset vertical", "friends boat vertical"] },
  moments: { q: ["friends dancing bonfire night", "friends laughing campfire night", "friends party rooftop night", "friends dancing sunset"], qTall: ["friends campfire vertical", "friends dancing vertical", "friends party vertical"] },
  "kyoto-in-silence": { q: ["friends walking kyoto night lanterns", "tourists kimono kyoto walking", "kyoto street night people", "kyoto temple visitors"], qTall: ["kyoto people vertical", "japan lanterns people vertical", "kimono walking vertical"] },
  "patagonia-unhurried": { q: ["hikers patagonia mountains walking", "friends hiking mountains lake", "hiker glacier walking", "friends trekking mountains"], qTall: ["hiker mountains vertical", "friends hiking vertical", "trekking vertical"] },
  "sahara-under-glass": { q: ["friends sahara dunes walking sunset", "people walking desert dunes", "camel ride friends desert sunset", "desert camp friends night"], qTall: ["desert dunes people vertical", "sahara walking vertical", "camel desert vertical"] },
  "iceland-edge-of-light": { q: ["friends watching northern lights", "people hot spring iceland snow", "hikers iceland waterfall", "friends iceland black beach"], qTall: ["northern lights people vertical", "iceland hot spring vertical", "iceland hiker vertical"] },
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
