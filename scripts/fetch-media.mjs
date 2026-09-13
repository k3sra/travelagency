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
 * rel → { frame, q: Pexels queries, ov: Openverse queries }. Every frame has
 * people in it, mid-moment. Pexels is asked first for the bright villa, boat
 * and beach-club frames; Openverse (Creative Commons, mostly Flickr) is asked
 * first for the candid moments strip, where a phone-shot picture is the point.
 */
const IMAGES = {
  "journeys/bali-in-full-colour/card.jpg": { frame: "card", q: ["young adults pool party friends laughing", "friends in pool sunset drinks adults", "group of friends infinity pool tropical"], ov: [] },
  "journeys/bali-in-full-colour/chapter-01.jpg": { frame: "wide", q: ["friends night pool party lights adults", "friends pool evening party tropical villa", "friends swimming pool night laughing"], ov: [] },
  "journeys/bali-in-full-colour/chapter-02.jpg": { frame: "wide", q: ["friends jumping off boat blue water","friends jumping boat bali","boat trip friends laughing"], ov: ["friends jumping off boat","boat trip friends jumping"] },
  "journeys/bali-in-full-colour/chapter-03.jpg": { frame: "wide", q: ["friends scooter bali sunset","friends riding scooters beach road","scooter friends tropical"], ov: ["friends scooters bali","scooter trip friends"] },
  "journeys/bali-in-full-colour/chapter-04.jpg": { frame: "wide", q: ["white water rafting friends laughing","rafting group jungle river","friends rafting splash"], ov: ["rafting friends laughing","white water rafting group"] },
  "journeys/bali-in-full-colour/chapter-05.jpg": { frame: "wide", q: ["beach club friends dancing sunset","friends dancing beach sunset drinks","friends party beach sunset"], ov: ["beach party friends sunset dancing","friends dancing beach"] },

  "journeys/mykonos-after-dark/card.jpg": { frame: "card", q: ["friends toasting cocktails pool sunset", "friends drinks pool sunset laughing", "women cocktails poolside sunset"], ov: ["mykonos friends pool", "friends sunset drinks greece"] },
  "journeys/mykonos-after-dark/chapter-01.jpg": { frame: "wide", q: ["friends sunset drinks terrace sea greece", "friends rooftop sunset sea toast", "friends pool sunset sea laughing"], ov: ["mykonos villa friends", "greece friends pool sunset"] },
  "journeys/mykonos-after-dark/chapter-02.jpg": { frame: "wide", q: ["friends jumping off yacht","friends yacht party greece","friends yacht swimming"], ov: ["friends jumping off yacht","yacht friends greece"] },
  "journeys/mykonos-after-dark/chapter-03.jpg": { frame: "wide", q: ["friends quad bikes beach","friends atv dirt road island","quad bike friends laughing"], ov: ["quad bikes friends mykonos","atv friends island"] },
  "journeys/mykonos-after-dark/chapter-04.jpg": { frame: "wide", q: ["friends dancing beach club sunset","beach club party friends","friends party dancing sunset drinks"], ov: ["mykonos beach club party","friends dancing beach club"] },
  "journeys/mykonos-after-dark/chapter-05.jpg": { frame: "wide", q: ["friends breakfast by the pool laughing", "friends brunch outdoor laughing sunny", "friends breakfast terrace laughing"], ov: ["friends breakfast pool", "brunch friends villa"] },

  "journeys/tulum-slow-heat/card.jpg": { frame: "card", q: ["man jumping into cenote water", "cliff jumping into blue water", "friends jumping into water cave"], ov: [] },
  "journeys/tulum-slow-heat/chapter-01.jpg": { frame: "wide", q: ["friends pool night tropical lights laughing", "friends night swimming pool party", "friends jungle pool evening"], ov: [] },
  "journeys/tulum-slow-heat/chapter-02.jpg": { frame: "wide", q: ["people swimming in cenote mexico", "cenote swimmers", "friends cenote jump"], ov: [] },
  "journeys/tulum-slow-heat/chapter-03.jpg": { frame: "wide", q: ["friends floating lagoon life jackets","friends boat lagoon mexico","friends floating river tropical"], ov: ["sian kaan floating","friends floating lagoon"] },
  "journeys/tulum-slow-heat/chapter-04.jpg": { frame: "wide", q: ["friends beach bar laughing drinks", "friends beach club dancing day", "friends laughing beach drinks sunny"], ov: ["tulum beach club friends", "friends beach daybed"] },
  "journeys/tulum-slow-heat/chapter-05.jpg": { frame: "wide", q: ["friends swimming turquoise water laughing","friends in the sea laughing","friends swimming ocean sunset"], ov: ["friends swimming sea laughing","friends in water laughing"] },

  "journeys/cape-town-two-oceans/card.jpg": { frame: "card", q: ["friends summit arms raised mountain sea","friends mountain top celebrating ocean view","hikers cheering summit coast"], ov: ["table mountain summit friends","friends summit arms up"] },
  "journeys/cape-town-two-oceans/chapter-01.jpg": { frame: "wide", q: ["friends terrace sunset drinks braai","friends rooftop sunset drinks ocean","friends barbecue sunset friends laughing"], ov: ["camps bay friends sunset","friends braai sunset"] },
  "journeys/cape-town-two-oceans/chapter-02.jpg": { frame: "wide", q: ["friends celebrating mountain summit ocean view", "hikers arms raised summit sea", "friends hiking lions head cape town"], ov: [] },
  "journeys/cape-town-two-oceans/chapter-03.jpg": { frame: "wide", q: ["friends long lunch vineyard","friends wine tasting laughing vineyard","long table lunch friends outdoor wine"], ov: ["franschhoek friends wine","wine farm friends lunch"] },
  "journeys/cape-town-two-oceans/chapter-04.jpg": { frame: "wide", q: ["friends catamaran net sunset","friends sailing catamaran laughing","friends boat sunset ocean laughing"], ov: ["catamaran friends sunset","friends sailing boat laughing"] },
  "journeys/cape-town-two-oceans/chapter-05.jpg": { frame: "wide", q: ["friends birthday party night villa sparklers","friends celebrating night sparklers","friends party night cake laughing"], ov: ["friends birthday party night","friends sparklers night"] },

  // Moments: real people, mid-trip, caught rather than posed.
  "moments/m01.jpg": { frame: "card", ov: ["friends jumping off boat", "friends jumping into lake", "jumping into sea friends"], q: ["woman jumping off boat into sea", "friends jumping into sea from yacht"], ovFirst: true },
  "moments/m02.jpg": { frame: "wide", q: ["friends pool party sunset laughing", "friends swimming pool laughing drinks", "pool party friends jumping"], ov: ["friends pool party sunset"] },
  "moments/m03.jpg": { frame: "card", ov: ["friends scooter trip laughing", "friends laughing in car road trip", "girls road trip car laughing"], q: ["friends scooter sunset", "candid friends road trip car window"], ovFirst: true },
  "moments/m04.jpg": { frame: "wide", q: ["friends sailing boat laughing wind", "friends yacht deck laughing", "friends boat trip laughing sea"], ov: ["friends on sailboat laughing"] },
  "moments/m05.jpg": { frame: "card", q: ["friends beach party night dancing", "friends bonfire beach night laughing", "friends sparklers beach night"], ov: ["friends beach party night"] },
  "moments/m06.jpg": { frame: "wide", q: ["friends mountain summit arms raised cheering", "hikers celebrating summit friends", "friends top of mountain jumping"], ov: ["hikers celebrating summit arms raised"] },
  "moments/m07.jpg": { frame: "card", ov: ["friends watching sunset beach", "friends sunset silhouette beach", "sunset friends sitting"], q: ["friends watching sunset beach", "friends sunset silhouette"], ovFirst: true },
  "moments/m08.jpg": { frame: "wide", q: ["friends dinner party outdoor night laughing wine", "friends toasting wine dinner terrace night", "young friends dinner table night string lights"], ov: ["friends dinner outdoors laughing night"] },
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
    if (cands.length) return cands.slice(0, 8);
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
for (const [k, c] of Object.entries(credits)) if (c.id) used.add(k.endsWith("/film") ? `v${c.id}` : c.provider === "openverse" ? `ov${c.id}` : c.id);

// Images
const FORCE = process.argv.includes("--force");
const REGRADE = process.argv.includes("--regrade");
const PEXELS_ONLY = process.argv.includes("--pexels");
const PICK = Number((process.argv.find((a) => a.startsWith("--pick=")) ?? "--pick=0").split("=")[1]);
const CANDIDATES = (process.argv.find((a) => a.startsWith("--candidates=")) ?? "").split("=")[1] || "";
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
  const ovFirst = Boolean(spec.ovFirst && spec.ov && !PEXELS_ONLY);
  if (CANDIDATES) {
    // Write a strip of the top candidates to CANDIDATES/<rel>-<i>.jpg for a human to choose from (--pick=i).
    const cands = await findPhoto(spec.q, spec.frame);
    await mkdir(CANDIDATES, { recursive: true });
    for (let i = 0; i < cands.length; i++) {
      const got = await fetchFirst([cands[i]], 900);
      if (!got) continue;
      const { w, h } = FRAMES[spec.frame];
      await sharp(got.buf).resize(Math.round(360 * (w / h) > 360 ? 360 : Math.round(360 * (w / h))), null).jpeg({ quality: 70 }).toFile(path.join(CANDIDATES, rel.replace(/\//g, "__").replace(/\.jpg$/, `-${i}.jpg`)));
    }
    console.log(`  candidates ${rel}: ${cands.length}`);
    continue;
  }
  let got = ovFirst ? await fetchFirst(await findOpenverse(spec.ov, spec.frame), 2600) : null;
  if (!got) got = await fetchFirst((await findPhoto(spec.q, spec.frame)).slice(PICK), 2600);
  if (!got && spec.ov && !ovFirst && !PEXELS_ONLY) got = await fetchFirst(await findOpenverse(spec.ov, spec.frame), 2600);
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
  hero: { q: ["friends jumping into pool together", "friends jumping off boat sea", "pool party friends splash", "friends running into sea"], qTall: ["friends jumping into pool", "friends jumping off boat", "friends pool party", "friends beach running"] },
  moments: { q: ["friends pool party", "friends dancing beach club sunset", "friends beach party night", "friends jumping pool"], qTall: ["friends dancing club", "friends pool party", "friends party night"] },
  "bali-in-full-colour": { q: ["friends jumping into pool splash", "pool party friends splashing", "friends pool float laughing", "friends boat trip tropical jumping"], qTall: ["friends pool tropical", "friends underwater swimming", "friends scooter"] },
  "mykonos-after-dark": { q: ["friends yacht party dancing", "friends jumping off yacht", "friends yacht swimming sea", "friends dancing beach club sunset"], qTall: ["friends yacht dancing", "friends jumping yacht", "friends yacht party", "friends sunset drinks sea"] },
  "tulum-slow-heat": { q: ["friends swimming cenote", "cenote swimming people", "friends jumping into water cave", "friends swimming turquoise water"], qTall: ["cenote diving", "friends swimming cenote", "jungle pool"] },
  "cape-town-two-oceans": { q: ["friends running beach sunset", "friends beach volleyball sunset", "friends beach party dancing sunset", "friends hiking summit ocean cheering"], qTall: ["friends beach sunset", "hikers summit", "friends boat sunset"] },
};

const CUT = (process.argv.find((a) => a.startsWith("--cut=")) ?? "").split("=")[1] || "";

async function findFilms(queries, orientation, limit = 1) {
  const out = [];
  for (const q of queries) {
    const data = await pexels("/videos/search", { query: q, orientation, size: "large", per_page: 12 });
    const cands = (data.videos ?? []).filter((v) => v.duration >= 8 && v.duration <= 45 && !used.has(`v${v.id}`) && !out.some((o) => o.id === v.id));
    const want = orientation === "portrait" ? (v) => v.height > v.width : (v) => v.width > v.height;
    out.push(...cands.filter(want));
    if (out.length >= limit) break;
  }
  return out.slice(0, limit);
}

const VPICK = Object.fromEntries((process.argv.filter((a) => a.startsWith("--vpick=")).map((a) => a.slice(8).split(":"))).map(([k, cut, i]) => [`${k}:${cut}`, Number(i)]));
const VCAND = (process.argv.find((a) => a.startsWith("--vcandidates=")) ?? "").split("=")[1] || "";

/** One film for a key and cut: the --vpick index of the candidate list, else the first. */
async function findFilm(queries, orientation, key) {
  const cut = orientation === "portrait" ? "tall" : "wide";
  const pick = VPICK[`${key}:${cut}`] ?? 0;
  const list = await findFilms(queries, orientation, VCAND ? 8 : pick + 1);
  if (VCAND) {
    await mkdir(VCAND, { recursive: true });
    for (let i = 0; i < list.length; i++) {
      const buf = await download(list[i].image.replace(/\?.*$/, "") + "?auto=compress&cs=tinysrgb&w=600");
      if (buf) await writeFile(path.join(VCAND, `${key}-${cut}-${i}.jpg`), buf);
    }
    console.log(`  candidates ${key} ${cut}: ${list.length}`);
    return null;
  }
  return list[pick] ?? list[0] ?? null;
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
    const prev = key === "hero" ? remote.heroVideo : key === "moments" ? remote.moments : remote.journeys[key];
    const wide = CUT === "tall" && prev?.wide ? null : await findFilm(spec.q, "landscape", key);
    const tall = CUT === "wide" && prev?.tall ? null : await findFilm(spec.qTall, "portrait", key);
    if (VCAND) continue;
    if (!wide && !(CUT === "tall" && prev?.wide)) { console.log(`  MISSING film ${key}`); continue; }
    if (wide) used.add(`v${wide.id}`); if (tall) used.add(`v${tall.id}`);
    const entry = {
      wide: wide ? { ...filmFiles(wide), duration: wide.duration, url: wide.url, credit: wide.user?.name ?? "" } : prev.wide,
      tall: tall ? { ...filmFiles(tall), duration: tall.duration, url: tall.url, credit: tall.user?.name ?? "" } : (CUT === "wide" ? prev?.tall ?? null : null),
    };
    // Posters from the films' own frames.
    const frame = wide ? await download(wide.image.replace(/\?.*$/, "") + "?auto=compress&cs=tinysrgb&w=2400") : null;
    const frameTall = tall ? await download(tall.image.replace(/\?.*$/, "") + "?auto=compress&cs=tinysrgb&w=1600") : null;
    if (key === "moments") {
      if (frame) await writeImage("moments/film.jpg", frame, "wide");
      if (frameTall) await writeImage("moments/film-tall.jpg", frameTall, "tall");
      remote.moments = entry;
      credits["moments/film"] = { id: wide?.id ?? credits["moments/film"]?.id, photographer: entry.wide.credit, url: entry.wide.url, tall: entry.tall?.url };
    } else if (key === "hero") {
      if (frame) await writeImage("hero/poster.jpg", frame, "poster");
      if (frameTall) await writeImage("hero/poster-tall.jpg", frameTall, "tall");
      remote.heroVideo = entry;
      credits["hero/film"] = { id: wide?.id ?? credits["hero/film"]?.id, photographer: entry.wide.credit, url: entry.wide.url, tall: entry.tall?.url };
    } else {
      if (frame) await writeImage(`journeys/${key}/hero.jpg`, frame, "wide");
      if (frameTall) await writeImage(`journeys/${key}/hero-tall.jpg`, frameTall, "tall");
      remote.journeys[key] = entry;
      credits[`journeys/${key}/film`] = { id: wide?.id ?? credits[`journeys/${key}/film`]?.id, photographer: entry.wide.credit, url: entry.wide.url, tall: entry.tall?.url };
    }
    console.log(`  film ${key.padEnd(24)} ${entry.wide.duration}s ${entry.wide.width}x${entry.wide.height} by ${entry.wide.credit}${tall ? ` · portrait ${tall.duration}s by ${tall.user?.name}` : " · no portrait"}`);
  }
  await writeFile(remotePath, JSON.stringify(remote, null, 2));
}

await writeFile(creditsPath, JSON.stringify(credits, null, 2));
const lines = ["# Photography and film credits", "", "All imagery and film is from Pexels (https://www.pexels.com/license/). Travellers and hosts on the site are fictional personas; the portraits are stock photographs.", ""];
for (const [rel, c] of Object.entries(credits)) lines.push(`- \`${rel}\` — ${c.photographer || "Pexels"} · ${c.url}`);
await writeFile(path.join(ROOT, "CREDITS.md"), lines.join("\n") + "\n");
console.log(`credits: ${Object.keys(credits).length} entries`);
