#!/usr/bin/env node
/**
 * Fable Travels — placeholder media pipeline.
 *
 * Renders every asset in the media manifest (see ARCHITECTURE.md and
 * src/lib/journeys.ts) from procedural SVG scenes: layered silhouettes with
 * atmospheric perspective, fog, a single light source, vignette and film
 * grain, graded to the brand palette. Deterministic (seeded PRNG), idempotent,
 * and honest: these are stand-ins for real photography. Mirror the same paths
 * with real footage and nothing else changes.
 *
 * Usage: node scripts/generate-media.mjs [--only=landscapes|portraits|video] [--fast]
 */

import { mkdir, writeFile, stat, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const OUT = path.join(ROOT, "public", "media");
const FFMPEG = "/opt/pw-browsers/ffmpeg-1011/ffmpeg-linux";
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) ?? "").split("=")[1] || "all";
const FAST = process.argv.includes("--fast");

const SIZES = {
  landscape: { w: 2000, h: 1250 },
  card: { w: 1400, h: 1750 },
  poster: { w: 1920, h: 1080 },
  portrait: { w: 600, h: 800 },
};

/* ----------------------------------------------------------------------------
   Deterministic randomness
   ---------------------------------------------------------------------------- */

function rng(seed) {
  let s = (hashStr(seed) >>> 0) || 1;
  const r = () => {
    // mulberry32
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.range = (a, b) => a + (b - a) * r();
  r.pick = (arr) => arr[Math.floor(r() * arr.length)];
  return r;
}

function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* ----------------------------------------------------------------------------
   Colour helpers (all in sRGB hex, mixed linearly enough for silhouettes)
   ---------------------------------------------------------------------------- */

const hex = (c) => {
  const s = c.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
};
const toHex = ([r, g, b]) =>
  "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
const mix = (a, b, t) => toHex(hex(a).map((v, i) => v + (hex(b)[i] - v) * t));
const lighten = (c, t) => mix(c, "#fbf8f1", t);
const darken = (c, t) => mix(c, "#0d1212", t);

/* ----------------------------------------------------------------------------
   Terrain + atmosphere primitives
   ---------------------------------------------------------------------------- */

/**
 * A ridge line across the frame. `sharp` 0 = rolling, 1 = jagged peaks.
 * Returns a closed path filling down to the bottom of the frame.
 */
function ridgePath(r, { w, h, baseY, amp, freq, sharp = 0, tilt = 0, points = 96, bottom = h + 20 }) {
  const phases = [r() * Math.PI * 2, r() * Math.PI * 2, r() * Math.PI * 2, r() * Math.PI * 2];
  const pts = [];
  for (let i = 0; i <= points; i++) {
    const t = i / points;
    const x = -0.06 * w + t * 1.12 * w;
    let y = 0;
    // three octaves of sines; ridge sharpening via abs()
    const o1 = Math.sin(t * freq * Math.PI * 2 + phases[0]);
    const o2 = Math.sin(t * freq * 2.3 * Math.PI * 2 + phases[1]) * 0.45;
    const o3 = Math.sin(t * freq * 5.1 * Math.PI * 2 + phases[2]) * 0.18;
    const soft = o1 + o2 + o3;
    // Two ridge octaves with a slow amplitude envelope so peaks differ in height and spacing.
    const ridge1 = 1 - Math.abs(Math.sin(t * freq * 1.7 * Math.PI * 2 + phases[3]));
    const ridge2 = 1 - Math.abs(Math.sin(t * freq * 0.65 * Math.PI * 2 + phases[0]));
    const envAmp = 0.55 + 0.45 * Math.sin(t * freq * 0.42 * Math.PI * 2 + phases[1]);
    const ridge = (ridge1 * 0.62 + ridge2 * 0.38) * envAmp;
    y = soft * (1 - sharp) + (ridge * 2 - 0.9) * sharp * 1.15;
    y += (r() - 0.5) * 0.06 * sharp; // rock noise
    pts.push([x, baseY - y * amp + (t - 0.5) * tilt]);
  }
  const d = ["M", pts[0][0].toFixed(1), pts[0][1].toFixed(1)];
  for (let i = 1; i < pts.length; i++) d.push("L", pts[i][0].toFixed(1), pts[i][1].toFixed(1));
  d.push("L", (1.06 * w).toFixed(1), bottom, "L", (-0.06 * w).toFixed(1), bottom, "Z");
  return d.join(" ");
}

/** Smooth dune: a few overlapping crescents with a lit and a shadow side. */
function dunePath(r, { w, h, baseY, amp, spread }) {
  const cx = r.range(-0.2, 1.2) * w;
  const width = spread * w;
  const pts = [];
  for (let i = 0; i <= 80; i++) {
    const t = i / 80;
    const x = -0.06 * w + t * 1.12 * w;
    const u = (x - cx) / width;
    const bump = Math.exp(-u * u * 2.2);
    const skew = u > 0 ? 1 : 0.55; // steep slip face on one side
    const y = baseY - amp * bump * skew * (1 + 0.08 * Math.sin(t * 40 + cx));
    pts.push([x, y]);
  }
  const d = [`M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`];
  for (let i = 1; i < pts.length; i++) d.push(`L ${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)}`);
  d.push(`L ${(1.06 * w).toFixed(1)} ${h + 20} L ${(-0.06 * w).toFixed(1)} ${h + 20} Z`);
  return { d: d.join(" "), cx };
}

function fogBand({ w, y, height, color, alpha, id }) {
  return `<rect x="${-0.1 * w}" y="${y}" width="${1.2 * w}" height="${height}" fill="${color}" opacity="${alpha}" filter="url(#blur${id})"/>`;
}

function defs({ w, sky, light, blurs, seed }) {
  const [s0, s1, s2] = sky;
  return `
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${s0}"/>
      <stop offset="0.55" stop-color="${s1}"/>
      <stop offset="1" stop-color="${s2}"/>
    </linearGradient>
    <radialGradient id="light" cx="${light.x}" cy="${light.y}" r="${light.r}" gradientUnits="objectBoundingBox">
      <stop offset="0" stop-color="${light.color}" stop-opacity="${light.alpha}"/>
      <stop offset="0.35" stop-color="${light.color}" stop-opacity="${light.alpha * 0.45}"/>
      <stop offset="1" stop-color="${light.color}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75">
      <stop offset="0.45" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.62"/>
    </radialGradient>
    ${blurs.map((b, i) => `<filter id="blur${i}" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="${b}"/></filter>`).join("\n")}
    <filter id="rough" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.0035 0.006" numOctaves="3" seed="${seed % 1000}" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="${Math.round(w * 0.012)}" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="roughSoft" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.002 0.004" numOctaves="2" seed="${(seed * 7) % 1000}" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="${Math.round(w * 0.02)}" xChannelSelector="R" yChannelSelector="G"/>
      <feGaussianBlur stdDeviation="${Math.max(1, Math.round(w * 0.0015))}"/>
    </filter>
  </defs>`;
}

/* ----------------------------------------------------------------------------
   Scene renderer
   ---------------------------------------------------------------------------- */

/**
 * scene = {
 *   sky: [top, mid, horizon], light: {x,y,r,color,alpha},
 *   near: colour of the nearest silhouette, haze: colour at the horizon,
 *   layers: [{baseY (0..1), amp (0..1 of h), freq, sharp, tilt}], // far → near
 *   dunes: [{baseY, amp, spread}], fog: [{y, height, alpha}],
 *   features: [ (svg string builder)(ctx) ], vignette: 0..1
 * }
 */
function renderSceneSvg(seed, size, scene) {
  const { w, h } = size;
  const r = rng(seed);
  const blurs = [w * 0.011, w * 0.045, w * 0.09, w * 0.0035];
  const parts = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`);
  parts.push(defs({ w, sky: scene.sky, light: scene.light, blurs, seed: hashStr(seed) }));
  parts.push(`<rect width="${w}" height="${h}" fill="url(#sky)"/>`);
  parts.push(`<rect width="${w}" height="${h}" fill="url(#light)"/>`);
  const ctx = { w, h, r, scene, blurs };
  // Sky-level features (moon, stars, aurora) go before terrain.
  for (const f of scene.skyFeatures ?? []) parts.push(f(ctx));

  const layers = scene.layers ?? [];
  const n = layers.length;
  layers.forEach((L, i) => {
    const depth = n === 1 ? 1 : i / (n - 1); // 0 far → 1 near
    const color = mix(scene.haze, scene.near, Math.pow(depth, 0.85));
    const blurIdx = depth < 0.34 ? 0 : depth < 0.67 ? 3 : -1;
    const filter = blurIdx >= 0 ? `filter="url(#blur${blurIdx})"` : `filter="url(#${L.sharp > 0.5 ? "rough" : "roughSoft"})"`;
    const d = ridgePath(r, {
      w, h, baseY: L.baseY * h, amp: L.amp * h, freq: L.freq, sharp: L.sharp ?? 0, tilt: (L.tilt ?? 0) * h,
    });
    parts.push(`<path d="${d}" fill="${color}" ${filter} opacity="${0.86 + 0.14 * depth}"/>`);
    // fog between layers
    const f = (scene.fog ?? [])[i];
    if (f) parts.push(fogBand({ w, y: f.y * h, height: f.height * h, color: scene.fogColor ?? scene.haze, alpha: f.alpha, blur: 2, id: 2 }));
  });

  (scene.dunes ?? []).forEach((D, i, arr) => {
    const depth = arr.length === 1 ? 1 : i / (arr.length - 1);
    const { d, cx } = dunePath(r, { w, h, baseY: D.baseY * h, amp: D.amp * h, spread: D.spread });
    const shade = mix(scene.haze, scene.near, Math.pow(depth, 0.8));
    const lit = lighten(shade, 0.22 + 0.18 * (1 - depth));
    const gid = `dune${i}`;
    parts.push(`<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${cx - D.spread * w * 0.5}" x2="${cx + D.spread * w * 0.6}"><stop offset="0" stop-color="${lit}"/><stop offset="0.5" stop-color="${shade}"/><stop offset="1" stop-color="${darken(shade, 0.25)}"/></linearGradient>`);
    parts.push(`<path d="${d}" fill="url(#${gid})" filter="url(#roughSoft)"/>`);
  });

  for (const f of scene.features ?? []) parts.push(f(ctx));
  for (const f of scene.fogTop ?? []) parts.push(fogBand({ w, y: f.y * h, height: f.height * h, color: scene.fogColor ?? scene.haze, alpha: f.alpha, blur: 1, id: 1 }));
  parts.push(`<rect width="${w}" height="${h}" fill="url(#vignette)" opacity="${scene.vignette ?? 0.9}"/>`);
  parts.push(`</svg>`);
  return parts.join("\n");
}

/* ----------------------------------------------------------------------------
   Feature builders (return SVG fragments)
   ---------------------------------------------------------------------------- */

const F = {
  moon: (x, y, radius, color = "#f1e9d2") => ({ w, h }) =>
    `<circle cx="${x * w}" cy="${y * h}" r="${radius * w * 3}" fill="${color}" opacity="0.10" filter="url(#blur1)"/>
     <circle cx="${x * w}" cy="${y * h}" r="${radius * w}" fill="${color}" opacity="0.9"/>`,
  stars: (count, maxY = 0.5) => ({ w, h, r }) => {
    let s = "";
    for (let i = 0; i < count; i++) {
      const x = r() * w, y = r() * h * maxY, rad = r.range(0.6, 1.6) * (w / 1400), o = r.range(0.25, 0.85);
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad.toFixed(2)}" fill="#f6f0e3" opacity="${o.toFixed(2)}"/>`;
    }
    return s;
  },
  aurora: (bands = 3, color = "#7fae8f") => ({ w, h, r }) => {
    let s = "";
    for (let i = 0; i < bands; i++) {
      const x0 = r.range(-0.1, 0.5) * w, x1 = x0 + r.range(0.45, 0.9) * w;
      const y0 = r.range(0.05, 0.25) * h, y1 = r.range(0.25, 0.5) * h;
      const c1 = r.range(0.2, 0.8), c2 = r.range(0.2, 0.8);
      const d = `M ${x0} ${y0} C ${x0 + (x1 - x0) * c1} ${y0 - 0.15 * h}, ${x0 + (x1 - x0) * c2} ${y1 + 0.1 * h}, ${x1} ${y1}`;
      s += `<path d="${d}" fill="none" stroke="${color}" stroke-width="${r.range(0.05, 0.11) * h}" stroke-linecap="round" opacity="${r.range(0.16, 0.3).toFixed(2)}" filter="url(#blur2)"/>`;
      s += `<path d="${d}" fill="none" stroke="${lighten(color, 0.4)}" stroke-width="${r.range(0.01, 0.025) * h}" stroke-linecap="round" opacity="0.28" filter="url(#blur0)"/>`;
    }
    return s;
  },
  // Vertical trunks (bamboo, cedar, palms) in depth bands.
  trunks: ({ count, yTop, yBottom, colorNear, colorFar, width, lean = 0.04, blurFar = true }) => ({ w, h, r }) => {
    let s = "";
    const items = [];
    for (let i = 0; i < count; i++) items.push({ x: r() * 1.1 * w - 0.05 * w, depth: r(), lean: (r() - 0.5) * lean });
    items.sort((a, b) => a.depth - b.depth);
    for (const it of items) {
      const c = mix(colorFar, colorNear, it.depth);
      const wd = width * w * (0.5 + it.depth);
      const top = yTop * h + (1 - it.depth) * 0.08 * h;
      const filter = it.depth < 0.4 && blurFar ? 'filter="url(#blur0)"' : it.depth < 0.7 && blurFar ? 'filter="url(#blur3)"' : "";
      s += `<path d="M ${it.x} ${yBottom * h} L ${it.x + it.lean * h} ${top}" stroke="${c}" stroke-width="${wd.toFixed(1)}" stroke-linecap="round" ${filter} opacity="${(0.55 + 0.45 * it.depth).toFixed(2)}"/>`;
    }
    return s;
  },
  lanterns: (count, yMin, yMax, color = "#e6b968") => ({ w, h, r }) => {
    let s = "";
    for (let i = 0; i < count; i++) {
      const x = r.range(0.05, 0.95) * w, y = r.range(yMin, yMax) * h, rad = r.range(0.006, 0.012) * w;
      s += `<circle cx="${x}" cy="${y}" r="${rad * 6}" fill="${color}" opacity="0.14" filter="url(#blur3)"/>`;
      s += `<circle cx="${x}" cy="${y}" r="${rad * 2.4}" fill="${color}" opacity="0.35" filter="url(#blur3)"/>`;
      s += `<ellipse cx="${x}" cy="${y}" rx="${rad}" ry="${rad * 1.35}" fill="${lighten(color, 0.35)}" opacity="0.95"/>`;
    }
    return s;
  },
  domes: (count, y, color = "#e9c877") => ({ w, h, r }) => {
    let s = "";
    for (let i = 0; i < count; i++) {
      const x = r.range(0.15, 0.85) * w, cy = y * h + r.range(-0.02, 0.02) * h, rx = r.range(0.035, 0.06) * w;
      s += `<ellipse cx="${x}" cy="${cy}" rx="${rx * 3}" ry="${rx * 1.6}" fill="${color}" opacity="0.14" filter="url(#blur1)"/>`;
      s += `<path d="M ${x - rx} ${cy} A ${rx} ${rx * 0.9} 0 0 1 ${x + rx} ${cy} Z" fill="${color}" opacity="0.55"/>`;
      s += `<path d="M ${x - rx} ${cy} A ${rx} ${rx * 0.9} 0 0 1 ${x + rx} ${cy}" fill="none" stroke="${lighten(color, 0.4)}" stroke-width="${(rx * 0.06).toFixed(1)}" opacity="0.8"/>`;
    }
    return s;
  },
  water: (yHorizon, top, bottom) => ({ w, h }) =>
    `<linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>
     <rect x="0" y="${yHorizon * h}" width="${w}" height="${(1 - yHorizon) * h}" fill="url(#water)"/>
     <rect x="0" y="${yHorizon * h}" width="${w}" height="${0.05 * h}" fill="${top}" opacity="0.5" filter="url(#blur3)"/>`,
  reflectionStreaks: (yFrom, color, count = 18) => ({ w, h, r }) => {
    let s = "";
    for (let i = 0; i < count; i++) {
      const y = h * (yFrom + (1 - yFrom) * Math.pow(r(), 1.4));
      const x = r() * w, len = r.range(0.04, 0.2) * w;
      s += `<rect x="${x}" y="${y}" width="${len}" height="${(1.2 * w) / 1000}" fill="${color}" opacity="${r.range(0.06, 0.2).toFixed(2)}" filter="url(#blur3)"/>`;
    }
    return s;
  },
  road: (vanishX, vanishY, bottomWidth, color) => ({ w, h }) =>
    `<path d="M ${w * (0.5 - bottomWidth / 2)} ${h + 10} L ${vanishX * w - 6} ${vanishY * h} L ${vanishX * w + 6} ${vanishY * h} L ${w * (0.5 + bottomWidth / 2)} ${h + 10} Z" fill="${color}" opacity="0.9" filter="url(#roughSoft)"/>
     <path d="M ${w * 0.5} ${h + 10} L ${vanishX * w} ${vanishY * h}" stroke="${lighten(color, 0.35)}" stroke-width="${w * 0.003}" stroke-dasharray="${w * 0.02} ${w * 0.03}" opacity="0.4"/>`,
  river: (vanishX, vanishY, color, steam = true) => ({ w, h }) =>
    `<path d="M ${w * 0.15} ${h + 10} C ${w * 0.4} ${h * 0.9}, ${w * 0.25} ${h * 0.75}, ${vanishX * w} ${vanishY * h} C ${w * 0.6} ${h * 0.78}, ${w * 0.45} ${h * 0.92}, ${w * 0.85} ${h + 10} Z" fill="${color}" opacity="0.85" filter="url(#roughSoft)"/>
     ${steam ? `<path d="M ${w * 0.2} ${h * 0.95} C ${w * 0.4} ${h * 0.8}, ${w * 0.3} ${h * 0.7}, ${vanishX * w} ${vanishY * h}" fill="none" stroke="#f3eee2" stroke-width="${w * 0.08}" opacity="0.28" filter="url(#blur1)"/>` : ""}`,
  glow: (x, y, rad, color, alpha) => ({ w, h }) =>
    `<circle cx="${x * w}" cy="${y * h}" r="${rad * w}" fill="${color}" opacity="${alpha}" filter="url(#blur2)"/>`,
  // Dark framing shapes (cave mouth, archway, doorway) around a lit centre.
  frame: (color, inset = 0.18) => ({ w, h, r }) => {
    const d = `M 0 0 H ${w} V ${h} H 0 Z M ${w * inset} ${h * (0.15 + r() * 0.05)} C ${w * (0.5 - inset)} ${h * 0.02}, ${w * (0.5 + inset)} ${h * 0.02}, ${w * (1 - inset)} ${h * (0.15 + r() * 0.05)} C ${w * (1 - inset * 0.6)} ${h * 0.5}, ${w * (1 - inset * 0.9)} ${h * 0.8}, ${w * (1 - inset * 0.7)} ${h} H ${w * inset * 0.7} C ${w * inset * 0.9} ${h * 0.8}, ${w * inset * 0.6} ${h * 0.5}, ${w * inset} ${h * (0.15 + r() * 0.05)} Z`;
    return `<path d="${d}" fill="${color}" fill-rule="evenodd" filter="url(#rough)"/>`;
  },
  arches: (count, color, yTop = 0.12) => ({ w, h }) => {
    let s = "";
    const span = w / count;
    for (let i = 0; i < count; i++) {
      const x0 = i * span, cx = x0 + span / 2, rx = span * 0.36, ry = h * 0.22;
      s += `<path d="M ${x0} 0 H ${x0 + span} V ${h} H ${x0} Z M ${cx - rx} ${h} V ${yTop * h + ry} A ${rx} ${ry} 0 0 1 ${cx + rx} ${yTop * h + ry} V ${h} Z" fill="${color}" fill-rule="evenodd"/>`;
    }
    return s;
  },
  icebergs: (count, yMin, yMax, color) => ({ w, h, r }) => {
    let s = "";
    for (let i = 0; i < count; i++) {
      const x = r() * w, y = r.range(yMin, yMax) * h, ww = r.range(0.03, 0.12) * w, hh = ww * r.range(0.25, 0.5);
      const d = `M ${x - ww / 2} ${y} L ${x - ww * 0.2} ${y - hh} L ${x + ww * 0.15} ${y - hh * 0.7} L ${x + ww / 2} ${y} Z`;
      s += `<path d="${d}" fill="${color}" opacity="0.85"/><path d="${d}" fill="${lighten(color, 0.3)}" opacity="0.35" transform="translate(0 ${y}) scale(1 -0.5) translate(0 ${-y})"/>`;
    }
    return s;
  },
  rocks: (count, yMin, yMax, color) => ({ w, h, r }) => {
    let s = "";
    for (let i = 0; i < count; i++) {
      const x = r() * w, y = r.range(yMin, yMax) * h, ww = r.range(0.03, 0.09) * w, hh = ww * r.range(0.8, 2.6);
      s += `<path d="M ${x - ww / 2} ${y} C ${x - ww * 0.4} ${y - hh}, ${x + ww * 0.3} ${y - hh * 1.1}, ${x + ww / 2} ${y} Z" fill="${color}" filter="url(#rough)"/>`;
    }
    return s;
  },
};

/* ----------------------------------------------------------------------------
   Palettes and scene catalogue
   ---------------------------------------------------------------------------- */

const P = {
  kyoto: { sky: ["#3f4a48", "#6d726a", "#a49d8a"], haze: "#8d8f83", near: "#1d2624", fog: "#a8a79a", light: "#e0d3b0" },
  kyotoNight: { sky: ["#141a1b", "#2a302f", "#5a4e3d"], haze: "#4a4741", near: "#0f1515", fog: "#6a5f4d", light: "#e4b46b" },
  patagonia: { sky: ["#2b3236", "#6e7476", "#b7ada0"], haze: "#8f9391", near: "#1a2122", fog: "#b3b1a8", light: "#e6cfa5" },
  patagoniaGold: { sky: ["#3a3b36", "#8b7d64", "#c9a879"], haze: "#9a8d76", near: "#231f1b", fog: "#c2ad8a", light: "#f0c56f" },
  sahara: { sky: ["#3a2f2a", "#8a6a4a", "#d3a869"], haze: "#b48c60", near: "#3a2618", fog: "#c8a172", light: "#f2c27a" },
  saharaNight: { sky: ["#0f1418", "#1e2630", "#4d3f33"], haze: "#3c342e", near: "#120f0d", fog: "#4f4236", light: "#e6b66a" },
  iceland: { sky: ["#0c1216", "#1c272e", "#3b4a52"], haze: "#3d4a52", near: "#0a0e10", fog: "#4b5a63", light: "#9cc3c9" },
  icelandDay: { sky: ["#2c3538", "#6f7a7d", "#b9b8ad"], haze: "#8c9394", near: "#101617", fog: "#b9bcb4", light: "#e8dcc4" },
};

const L = (baseY, amp, freq, sharp = 0, tilt = 0) => ({ baseY, amp, freq, sharp, tilt });
const light = (x, y, r, color, alpha) => ({ x, y, r, color, alpha });

/** Every landscape asset: path (relative to /media) → scene. */
const SCENES = {
  // ---- Home hero: a ridge line under a moving fog bank, warm horizon --------
  "hero/poster.jpg": {
    size: "poster", pal: P.patagoniaGold,
    light: light(0.62, 0.52, 0.6, "#f0c56f", 0.55),
    layers: [L(0.56, 0.14, 1.2, 0.85), L(0.66, 0.11, 1.6, 0.75), L(0.78, 0.09, 1.1, 0.45), L(0.92, 0.08, 0.9, 0.2)],
    fog: [{ y: 0.6, height: 0.1, alpha: 0.38 }, { y: 0.72, height: 0.08, alpha: 0.32 }, { y: 0.86, height: 0.06, alpha: 0.22 }],
    skyFeatures: [F.stars(40, 0.3)],
    vignette: 0.95,
  },

  // ---- Kyoto ---------------------------------------------------------------
  "journeys/kyoto-in-silence/hero.jpg": {
    pal: P.kyoto, light: light(0.3, 0.2, 0.7, "#e0d3b0", 0.35),
    layers: [L(0.5, 0.08, 1.4, 0.1), L(0.6, 0.07, 1.8, 0.05), L(0.74, 0.05, 1.2, 0), L(0.86, 0.05, 0.9, 0)],
    fog: [{ y: 0.52, height: 0.12, alpha: 0.55 }, { y: 0.63, height: 0.1, alpha: 0.5 }, { y: 0.78, height: 0.08, alpha: 0.35 }],
    features: [F.trunks({ count: 26, yTop: 0.05, yBottom: 0.92, colorNear: "#141c1b", colorFar: "#6d7168", width: 0.012, lean: 0.06 }), F.rocks(6, 0.9, 1.0, "#1a2322")],
    fogTop: [{ y: 0.85, height: 0.18, alpha: 0.35 }],
  },
  "journeys/kyoto-in-silence/card.jpg": {
    size: "card", pal: P.kyotoNight, light: light(0.5, 0.62, 0.5, "#e4b46b", 0.5),
    layers: [L(0.42, 0.05, 1.5, 0.05), L(0.62, 0.02, 2, 0)],
    features: [F.arches(3, "#0b1010", 0.1), F.lanterns(9, 0.35, 0.62), F.glow(0.5, 0.75, 0.35, "#a67b3a", 0.22)],
    fogTop: [{ y: 0.55, height: 0.35, alpha: 0.18 }],
    vignette: 1,
  },
  "journeys/kyoto-in-silence/chapter-01.jpg": {
    pal: P.kyotoNight, light: light(0.55, 0.55, 0.6, "#e4b46b", 0.45),
    layers: [L(0.45, 0.04, 1.6, 0.02), L(0.7, 0.03, 2.2, 0)],
    features: [F.arches(5, "#0b1010", 0.14), F.lanterns(14, 0.35, 0.65), F.glow(0.5, 0.8, 0.4, "#a67b3a", 0.18)],
    fogTop: [{ y: 0.6, height: 0.3, alpha: 0.2 }],
  },
  "journeys/kyoto-in-silence/chapter-02.jpg": {
    pal: P.kyoto, light: light(0.75, 0.15, 0.6, "#e6dcc0", 0.4),
    layers: [L(0.55, 0.06, 1.3, 0.05), L(0.68, 0.06, 1.7, 0.02), L(0.8, 0.05, 1.2, 0), L(0.92, 0.04, 1, 0)],
    fog: [{ y: 0.56, height: 0.1, alpha: 0.5 }, { y: 0.7, height: 0.08, alpha: 0.4 }],
    features: [F.trunks({ count: 12, yTop: 0.0, yBottom: 0.8, colorNear: "#1a2321", colorFar: "#777a70", width: 0.018, lean: 0.1 }), F.rocks(9, 0.86, 1.0, "#222b29")],
    fogTop: [{ y: 0.86, height: 0.16, alpha: 0.4 }],
  },
  "journeys/kyoto-in-silence/chapter-03.jpg": {
    pal: P.kyotoNight, light: light(0.5, 0.55, 0.45, "#e6c48a", 0.55),
    layers: [L(0.62, 0.02, 2, 0), L(0.7, 0.015, 3, 0)],
    features: [F.glow(0.5, 0.58, 0.25, "#f0d9a8", 0.5), F.glow(0.5, 0.5, 0.12, "#fbf2df", 0.35), F.rocks(2, 0.72, 0.75, "#0f1414")],
    fogTop: [{ y: 0.3, height: 0.35, alpha: 0.5 }, { y: 0.5, height: 0.25, alpha: 0.35 }],
    vignette: 1,
  },
  "journeys/kyoto-in-silence/chapter-04.jpg": {
    pal: P.kyotoNight, light: light(0.5, 0.7, 0.6, "#e4b46b", 0.35),
    layers: [L(0.4, 0.06, 1.2, 0.05), L(0.55, 0.05, 1.5, 0.02), L(0.75, 0.04, 1.3, 0)],
    fog: [{ y: 0.42, height: 0.12, alpha: 0.35 }, { y: 0.58, height: 0.1, alpha: 0.3 }],
    features: [F.trunks({ count: 30, yTop: -0.05, yBottom: 0.9, colorNear: "#0e1414", colorFar: "#4c4e46", width: 0.016, lean: 0.03 }), F.lanterns(12, 0.55, 0.85, "#e88a4a")],
    fogTop: [{ y: 0.8, height: 0.22, alpha: 0.3 }],
  },
  "journeys/kyoto-in-silence/chapter-05.jpg": {
    pal: P.kyoto, light: light(0.5, 0.1, 0.55, "#f0e6cc", 0.5),
    layers: [L(0.85, 0.03, 1.5, 0)],
    features: [F.trunks({ count: 70, yTop: -0.1, yBottom: 0.95, colorNear: "#1b2422", colorFar: "#9a9a8b", width: 0.011, lean: 0.03 })],
    fogTop: [{ y: 0.0, height: 0.5, alpha: 0.28 }, { y: 0.75, height: 0.25, alpha: 0.35 }],
    vignette: 0.85,
  },

  // ---- Patagonia -----------------------------------------------------------
  "journeys/patagonia-unhurried/hero.jpg": {
    pal: P.patagoniaGold, light: light(0.35, 0.35, 0.55, "#f0c56f", 0.5),
    layers: [L(0.42, 0.22, 1.1, 0.95), L(0.6, 0.1, 1.7, 0.6), L(0.74, 0.06, 1.2, 0.2)],
    fog: [{ y: 0.55, height: 0.1, alpha: 0.3 }, { y: 0.66, height: 0.08, alpha: 0.35 }],
    features: [F.water(0.78, "#5a6b6c", "#1d2a2c"), F.reflectionStreaks(0.8, "#e8c98a", 22)],
  },
  "journeys/patagonia-unhurried/card.jpg": {
    size: "card", pal: P.patagoniaGold, light: light(0.5, 0.42, 0.7, "#f0c56f", 0.55),
    layers: [L(0.55, 0.05, 1.5, 0.3), L(0.66, 0.03, 2, 0.1), L(0.8, 0.03, 1.3, 0)],
    fog: [{ y: 0.57, height: 0.08, alpha: 0.35 }],
    features: [F.rocks(1, 0.82, 0.84, "#191a17")],
    skyFeatures: [F.stars(12, 0.25)],
  },
  "journeys/patagonia-unhurried/chapter-01.jpg": {
    pal: P.patagonia, light: light(0.6, 0.3, 0.6, "#e6cfa5", 0.4),
    layers: [L(0.4, 0.2, 1.3, 0.9), L(0.58, 0.1, 1.6, 0.5)],
    fog: [{ y: 0.5, height: 0.1, alpha: 0.4 }, { y: 0.62, height: 0.06, alpha: 0.3 }],
    features: [F.water(0.7, "#6d8b8a", "#22383a"), F.reflectionStreaks(0.72, "#c9d4cf", 16)],
  },
  "journeys/patagonia-unhurried/chapter-02.jpg": {
    pal: { ...P.iceland, sky: ["#1f2a30", "#4d6068", "#8fa3a8"], near: "#233b45", haze: "#7a939b" }, light: light(0.5, 0.2, 0.6, "#dbe9ea", 0.4),
    layers: [L(0.5, 0.06, 1.4, 0.4), L(0.63, 0.07, 1.3, 0.75), L(0.74, 0.05, 0.9, 0.55)],
    fog: [{ y: 0.52, height: 0.08, alpha: 0.35 }],
    features: [F.water(0.8, "#4d6d78", "#182a30"), F.icebergs(7, 0.84, 0.97, "#a9c5cb")],
  },
  "journeys/patagonia-unhurried/chapter-03.jpg": {
    pal: P.patagoniaGold, light: light(0.2, 0.45, 0.7, "#f0c56f", 0.6),
    layers: [L(0.5, 0.05, 1.4, 0.2), L(0.62, 0.02, 2, 0), L(0.78, 0.02, 1.5, 0)],
    fog: [{ y: 0.52, height: 0.08, alpha: 0.35 }],
    features: [F.rocks(4, 0.8, 0.86, "#1c1a16")],
  },
  "journeys/patagonia-unhurried/chapter-04.jpg": {
    pal: P.patagonia, light: light(0.5, 0.25, 0.5, "#e6cfa5", 0.35),
    layers: [L(0.38, 0.25, 1.1, 0.98), L(0.62, 0.06, 1.6, 0.3)],
    fog: [{ y: 0.5, height: 0.08, alpha: 0.3 }],
    features: [F.water(0.7, "#6b7c7c", "#1f2c2d"), F.reflectionStreaks(0.72, "#d7d4c8", 14)],
  },
  "journeys/patagonia-unhurried/chapter-05.jpg": {
    pal: P.patagonia, light: light(0.5, 0.42, 0.6, "#e6cfa5", 0.4),
    layers: [L(0.45, 0.12, 1.2, 0.8), L(0.56, 0.06, 1.8, 0.4), L(0.66, 0.03, 1.4, 0)],
    fog: [{ y: 0.5, height: 0.08, alpha: 0.35 }, { y: 0.6, height: 0.06, alpha: 0.3 }],
    features: [F.road(0.5, 0.66, 0.5, "#3a3b36")],
  },

  // ---- Sahara --------------------------------------------------------------
  "journeys/sahara-under-glass/hero.jpg": {
    pal: P.sahara, light: light(0.72, 0.4, 0.7, "#f2c27a", 0.6),
    layers: [], dunes: [{ baseY: 0.62, amp: 0.14, spread: 0.6 }, { baseY: 0.72, amp: 0.16, spread: 0.45 }, { baseY: 0.86, amp: 0.2, spread: 0.5 }, { baseY: 1.0, amp: 0.2, spread: 0.4 }],
    fogTop: [{ y: 0.55, height: 0.12, alpha: 0.25 }],
  },
  "journeys/sahara-under-glass/card.jpg": {
    size: "card", pal: P.saharaNight, light: light(0.5, 0.75, 0.5, "#e6b66a", 0.45),
    layers: [], dunes: [{ baseY: 0.7, amp: 0.08, spread: 0.9 }, { baseY: 0.88, amp: 0.1, spread: 0.7 }],
    skyFeatures: [F.stars(160, 0.65), F.moon(0.25, 0.14, 0.02)],
    features: [F.domes(3, 0.78)],
    vignette: 1,
  },
  "journeys/sahara-under-glass/chapter-01.jpg": {
    pal: { ...P.saharaNight, sky: ["#2a201a", "#4a3626", "#8a6438"] }, light: light(0.5, 0.5, 0.45, "#f0c98a", 0.55),
    layers: [L(0.66, 0.02, 2, 0)],
    features: [F.arches(4, "#160f0c", 0.08), F.glow(0.5, 0.6, 0.3, "#d8a45e", 0.35), F.lanterns(5, 0.45, 0.6, "#f0c07a")],
    fogTop: [{ y: 0.5, height: 0.3, alpha: 0.2 }],
    vignette: 1,
  },
  "journeys/sahara-under-glass/chapter-02.jpg": {
    pal: P.sahara, light: light(0.55, 0.2, 0.6, "#f2c27a", 0.5),
    layers: [L(0.45, 0.14, 1.2, 0.7), L(0.58, 0.1, 1.5, 0.5), L(0.72, 0.08, 1.2, 0.3), L(0.86, 0.06, 1, 0.1)],
    fog: [{ y: 0.5, height: 0.08, alpha: 0.35 }, { y: 0.62, height: 0.07, alpha: 0.3 }],
    features: [F.road(0.62, 0.62, 0.35, "#4a3a2b")],
  },
  "journeys/sahara-under-glass/chapter-03.jpg": {
    pal: { ...P.sahara, sky: ["#6a5a45", "#c3a072", "#e7c48f"], near: "#2a2418", haze: "#c9a77a" }, light: light(0.5, 0.05, 0.6, "#fbe6bd", 0.55),
    layers: [L(0.62, 0.03, 1.6, 0.1), L(0.78, 0.04, 1.2, 0)],
    features: [F.trunks({ count: 22, yTop: 0.2, yBottom: 0.82, colorNear: "#241f16", colorFar: "#9b8767", width: 0.014, lean: 0.12 }), F.rocks(3, 0.8, 0.86, "#3a2f22")],
    fogTop: [{ y: 0.0, height: 0.6, alpha: 0.18 }],
    vignette: 0.8,
  },
  "journeys/sahara-under-glass/chapter-04.jpg": {
    pal: P.saharaNight, light: light(0.5, 0.8, 0.45, "#e6b66a", 0.4),
    layers: [], dunes: [{ baseY: 0.66, amp: 0.08, spread: 0.8 }, { baseY: 0.85, amp: 0.12, spread: 0.6 }],
    skyFeatures: [F.stars(220, 0.6), F.glow(0.5, 0.1, 0.4, "#d9d3c4", 0.08)],
    features: [F.domes(4, 0.76)],
    vignette: 1,
  },
  "journeys/sahara-under-glass/chapter-05.jpg": {
    pal: { ...P.sahara, sky: ["#5a4335", "#c98c55", "#f0c48a"] }, light: light(0.5, 0.5, 0.55, "#fbd58f", 0.75),
    layers: [], dunes: [{ baseY: 0.58, amp: 0.12, spread: 0.7 }, { baseY: 0.7, amp: 0.14, spread: 0.5 }, { baseY: 0.86, amp: 0.18, spread: 0.55 }, { baseY: 1.02, amp: 0.2, spread: 0.45 }],
    fogTop: [{ y: 0.5, height: 0.1, alpha: 0.3 }],
  },

  // ---- Iceland -------------------------------------------------------------
  "journeys/iceland-edge-of-light/hero.jpg": {
    pal: P.iceland, light: light(0.5, 0.35, 0.6, "#9cc3c9", 0.2),
    layers: [L(0.62, 0.05, 1.3, 0.3), L(0.8, 0.04, 1.5, 0.1)],
    skyFeatures: [F.stars(200, 0.6), F.aurora(4, "#7fae8f")],
    features: [F.water(0.82, "#25353b", "#0b1113"), F.rocks(5, 0.78, 0.86, "#0c1112"), F.reflectionStreaks(0.84, "#7fae8f", 12)],
    vignette: 1,
  },
  "journeys/iceland-edge-of-light/card.jpg": {
    size: "card", pal: { ...P.icelandDay, sky: ["#1f2a30", "#4a5c64", "#8d9ea3"] }, light: light(0.5, 0.35, 0.6, "#c9dfe2", 0.35),
    layers: [L(0.5, 0.06, 1.4, 0.3), L(0.62, 0.04, 1.8, 0.1)],
    features: [F.water(0.68, "#6e8b90", "#213036"), F.glow(0.5, 0.62, 0.45, "#e8f0ee", 0.28), F.rocks(6, 0.9, 1.0, "#0e1416")],
    fogTop: [{ y: 0.55, height: 0.3, alpha: 0.5 }],
  },
  "journeys/iceland-edge-of-light/chapter-01.jpg": {
    pal: P.iceland, light: light(0.5, 0.55, 0.5, "#e4b46b", 0.25),
    layers: [L(0.55, 0.03, 1.6, 0.1)],
    features: [F.water(0.6, "#1e2a30", "#080c0e"), F.lanterns(18, 0.5, 0.58, "#e8b45e"), F.reflectionStreaks(0.62, "#e8b45e", 20)],
    vignette: 1,
  },
  "journeys/iceland-edge-of-light/chapter-02.jpg": {
    pal: P.icelandDay, light: light(0.5, 0.25, 0.6, "#e8dcc4", 0.35),
    layers: [L(0.5, 0.1, 1.5, 0.7), L(0.62, 0.05, 2, 0.4)],
    fog: [{ y: 0.52, height: 0.1, alpha: 0.5 }],
    features: [F.water(0.7, "#8b9c9c", "#2a3537"), F.rocks(6, 0.68, 0.72, "#0e1416"), F.reflectionStreaks(0.75, "#e2e5df", 26)],
  },
  "journeys/iceland-edge-of-light/chapter-03.jpg": {
    pal: { ...P.iceland, sky: ["#0d1a22", "#28506a", "#6fa6c1"], near: "#07101a", haze: "#4f86a3" }, light: light(0.5, 0.45, 0.45, "#bfe1ee", 0.55),
    layers: [L(0.7, 0.04, 1.4, 0.3)],
    features: [F.frame("#050a10", 0.2), F.glow(0.5, 0.45, 0.3, "#a9d4e6", 0.3)],
    vignette: 1,
  },
  "journeys/iceland-edge-of-light/chapter-04.jpg": {
    pal: P.icelandDay, light: light(0.5, 0.2, 0.6, "#e8dcc4", 0.35),
    layers: [L(0.45, 0.1, 1.4, 0.5), L(0.58, 0.06, 1.8, 0.2), L(0.7, 0.04, 1.2, 0)],
    fog: [{ y: 0.48, height: 0.1, alpha: 0.45 }],
    features: [F.river(0.5, 0.62, "#8ea6a8")],
    fogTop: [{ y: 0.72, height: 0.3, alpha: 0.35 }],
  },
  "journeys/iceland-edge-of-light/chapter-05.jpg": {
    pal: { ...P.iceland, sky: ["#1a2630", "#4a5f6e", "#b08a68"] }, light: light(0.5, 0.5, 0.6, "#e3b98a", 0.45),
    layers: [L(0.55, 0.05, 1.4, 0.3)],
    features: [F.water(0.6, "#4b6068", "#151f24"), F.icebergs(12, 0.66, 0.96, "#b9cfd5"), F.reflectionStreaks(0.64, "#e3b98a", 14)],
  },
};

/* ----------------------------------------------------------------------------
   Rasterisation: SVG → graded JPEG (+ blurred sibling)
   ---------------------------------------------------------------------------- */

async function grain(width, height, sigma = 18) {
  return sharp({ create: { width, height, channels: 3, noise: { type: "gaussian", mean: 128, sigma } } })
    .png()
    .toBuffer();
}

async function renderLandscape(rel, scene) {
  const size = SIZES[scene.size ?? "landscape"];
  const pal = scene.pal;
  const svg = renderSceneSvg(rel, size, {
    sky: pal.sky, haze: pal.haze, near: pal.near, fogColor: pal.fog,
    light: scene.light ?? light(0.5, 0.4, 0.6, pal.light, 0.4),
    layers: scene.layers, dunes: scene.dunes, fog: scene.fog, fogTop: scene.fogTop,
    features: scene.features, skyFeatures: scene.skyFeatures, vignette: scene.vignette,
  });
  const base = sharp(Buffer.from(svg), { density: 96 }).resize(size.w, size.h);
  const noise = await grain(Math.ceil(size.w / 2), Math.ceil(size.h / 2), 15);
  const graded = base
    // print-like grade: lift blacks a touch, soften saturation, warm
    .linear(1.04, -2)
    .modulate({ saturation: 0.84 })
    .composite([{ input: await sharp(noise).resize(size.w, size.h).toBuffer(), blend: "soft-light" }]);
  const out = path.join(OUT, rel);
  await mkdir(path.dirname(out), { recursive: true });
  const buf = await graded.jpeg({ quality: 80, mozjpeg: true, progressive: true }).toBuffer();
  await writeFile(out, buf);
  await writeBlurSibling(out, buf, size);
  return buf.length;
}

async function writeBlurSibling(out, buf, size) {
  const blurOut = out.replace(/\.jpg$/, "-blur.jpg");
  const w = 640, h = Math.round((size.h / size.w) * 640);
  const blurred = await sharp(buf).resize(w, h).blur(22).jpeg({ quality: 55, mozjpeg: true }).toBuffer();
  await writeFile(blurOut, blurred);
  return blurred.length;
}

/* ----------------------------------------------------------------------------
   Portraits: monochrome, soft-focus, backlit silhouettes
   ---------------------------------------------------------------------------- */

function portraitSvg(seed, { w, h }) {
  const r = rng(seed);
  const side = r() > 0.5 ? 1 : -1; // key light from the left or the right
  const tilt = r.range(-14, 14);
  const headR = w * r.range(0.14, 0.23);
  const cx = w * (0.5 - side * r.range(0.0, 0.12));
  const cy = h * r.range(0.3, 0.46);
  const shoulder = w * r.range(0.4, 0.62);
  const hair = r();
  const g = (v) => `rgb(${Math.round(v * 255)},${Math.round(v * 255)},${Math.round(v * 255)})`;
  const bgA = 0.22 + r() * 0.18, bgB = 0.04 + r() * 0.05;
  const dark = g(0.045 + r() * 0.02);
  const rim = g(0.55 + r() * 0.35);
  const rimOff = headR * r.range(0.16, 0.28);
  const focus = w * r.range(0.008, 0.02); // soft focus amount
  const shoulders = (dx) =>
    `M ${cx - shoulder + dx} ${h * 1.08} C ${cx - shoulder * 0.92 + dx} ${h * 0.74}, ${cx - headR + dx} ${h * 0.64}, ${cx + dx} ${h * 0.585} C ${cx + headR + dx} ${h * 0.64}, ${cx + shoulder * 0.92 + dx} ${h * 0.74}, ${cx + shoulder + dx} ${h * 1.08} Z`;
  const head = (dx, dy = 0, k = 1) =>
    `<ellipse cx="${cx + dx}" cy="${cy + dy}" rx="${headR * 0.9 * k}" ry="${headR * k}"/>`;
  const hairShape = (dx) =>
    `<ellipse cx="${cx - side * headR * 0.08 + dx}" cy="${cy - headR * 0.32}" rx="${headR * (0.92 + hair * 0.4)}" ry="${headR * (0.72 + hair * 0.45)}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="${side > 0 ? 1 : 0}" y1="0" x2="${side > 0 ? 0 : 1}" y2="1">
      <stop offset="0" stop-color="${g(bgA)}"/><stop offset="1" stop-color="${g(bgB)}"/>
    </linearGradient>
    <filter id="window" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${w * 0.09}"/></filter>
    <filter id="focus" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${focus}"/></filter>
    <filter id="rimSoft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${w * 0.014}"/></filter>
    <radialGradient id="vig" cx="0.5" cy="0.45" r="0.85"><stop offset="0.45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.72"/></radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <!-- window light behind the shoulder on the key side -->
  <g filter="url(#window)">
    <ellipse cx="${w * (side > 0 ? 0.92 : 0.08)}" cy="${h * r.range(0.2, 0.5)}" rx="${w * 0.28}" ry="${h * 0.34}" fill="#fff" opacity="${(0.18 + r() * 0.2).toFixed(2)}"/>
    <ellipse cx="${w * (side > 0 ? 0.7 : 0.3)}" cy="${h * 0.95}" rx="${w * 0.4}" ry="${h * 0.16}" fill="#fff" opacity="0.06"/>
  </g>
  <g transform="rotate(${tilt} ${cx} ${cy})" filter="url(#focus)">
    <!-- rim light: the same shapes in a light tone, revealed as a crescent on the key side -->
    <g fill="${rim}" filter="url(#rimSoft)" opacity="0.85">
      <path d="${shoulders(side * rimOff * 0.9)}"/>
      ${hairShape(side * rimOff * 0.7)}
      ${head(side * rimOff)}
    </g>
    <g fill="${dark}">
      <path d="${shoulders(0)}"/>
      <rect x="${cx - headR * 0.3}" y="${cy + headR * 0.6}" width="${headR * 0.6}" height="${headR}" />
      ${hairShape(0)}
      ${head(0)}
    </g>
  </g>
  <rect width="${w}" height="${h}" fill="url(#vig)"/>
</svg>`;
}

async function renderPortrait(rel, seed) {
  const size = SIZES.portrait;
  const svg = portraitSvg(seed, size);
  const noise = await grain(size.w, size.h, 26);
  const buf = await sharp(Buffer.from(svg))
    .resize(size.w, size.h)
    .composite([{ input: noise, blend: "soft-light" }])
    .grayscale()
    .tint({ r: 232, g: 224, b: 210 }) // faint warm paper tone
    .linear(1.05, -4)
    .jpeg({ quality: 78, mozjpeg: true })
    .toBuffer();
  const out = path.join(OUT, rel);
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, buf);
  return buf.length;
}

/* ----------------------------------------------------------------------------
   Hero video: slow push-in + drifting fog + grain, VP8 WebM
   ---------------------------------------------------------------------------- */

async function fogStripPng(w, h) {
  const r = rng("fog-overlay");
  let blobs = "";
  for (let i = 0; i < 14; i++) {
    blobs += `<ellipse cx="${r() * w}" cy="${h * (0.3 + r() * 0.5)}" rx="${w * r.range(0.08, 0.2)}" ry="${h * r.range(0.14, 0.3)}" fill="#f2ead8" opacity="${r.range(0.1, 0.22).toFixed(2)}"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><filter id="b" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="${h * 0.12}"/></filter></defs><g filter="url(#b)">${blobs}</g></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * The Playwright ffmpeg build only has crop/scale/format filters, so every
 * frame is composed here (push-in, drifting fog, film grain, soft fade) and
 * streamed to ffmpeg as MJPEG for VP8 encoding.
 */
async function renderVideo() {
  const { spawn } = await import("node:child_process");
  const posterPath = path.join(OUT, "hero/poster.jpg");
  const out = path.join(OUT, "hero/hero.webm");
  const W = 1280, H = 720, fps = 30, frames = FAST ? 120 : 360;
  const poster = await sharp(posterPath).raw().toBuffer({ resolveWithObject: true });
  const PW = poster.info.width, PH = poster.info.height;
  const stripW = 3400, stripH = 800;
  const strip = await fogStripPng(stripW, stripH);
  const noiseTiles = [];
  for (let i = 0; i < 6; i++) noiseTiles.push(await grain(W, H, 11));

  const ff = spawn(FFMPEG, [
    "-y", "-loglevel", "error",
    "-f", "image2pipe", "-vcodec", "mjpeg", "-framerate", String(fps), "-i", "pipe:0",
    "-c:v", "libvpx", "-b:v", "1800k", "-crf", "14", "-deadline", "good", "-cpu-used", String(FAST ? 5 : 2),
    "-pix_fmt", "yuv420p", "-an", out,
  ], { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((resolve, reject) => {
    ff.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`))));
    ff.on("error", reject);
  });
  const write = (buf) => new Promise((resolve) => (ff.stdin.write(buf) ? resolve() : ff.stdin.once("drain", resolve)));

  for (let i = 0; i < frames; i++) {
    const t = i / (frames - 1);
    const zoom = 1 + 0.08 * (0.5 - 0.5 * Math.cos(Math.PI * t));
    const cw = Math.round(PW / zoom), ch = Math.round(PH / zoom);
    const left = Math.round((PW - cw) / 2), top = Math.round((PH - ch) / 2);
    const fogX = Math.round(t * (stripW - W - 40)), fogY = Math.round(30 + 20 * Math.sin(t * Math.PI * 2));
    const fog = await sharp(strip).extract({ left: fogX, top: fogY, width: W, height: H }).png().toBuffer();
    const fade = Math.min(1, i / (fps * 0.9), (frames - 1 - i) / (fps * 0.9));
    const frame = await sharp(poster.data, { raw: { width: PW, height: PH, channels: 3 } })
      .extract({ left, top, width: cw, height: ch })
      .resize(W, H)
      .composite([
        { input: fog, blend: "screen" },
        { input: noiseTiles[i % noiseTiles.length], blend: "soft-light" },
      ])
      .linear(fade, 0)
      .jpeg({ quality: 90 })
      .toBuffer();
    await write(frame);
    if (i % 60 === 0) console.log(`  video frame ${i}/${frames}`);
  }
  ff.stdin.end();
  await done;
  const s = await stat(out);
  return s.size;
}

/* ----------------------------------------------------------------------------
   Manifest verification
   ---------------------------------------------------------------------------- */

async function verify() {
  const src = await readFile(path.join(ROOT, "src/lib/journeys.ts"), "utf8");
  const slugs = [...src.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);
  const required = ["hero/hero.webm", "hero/poster.jpg", "hero/poster-blur.jpg"];
  for (const slug of slugs) {
    for (const name of ["hero", "card", "chapter-01", "chapter-02", "chapter-03", "chapter-04", "chapter-05"]) {
      required.push(`journeys/${slug}/${name}.jpg`, `journeys/${slug}/${name}-blur.jpg`);
    }
  }
  for (let i = 1; i <= 16; i++) required.push(`portraits/p${String(i).padStart(2, "0")}.jpg`);
  for (let i = 1; i <= 4; i++) required.push(`curators/c${String(i).padStart(2, "0")}.jpg`);
  const missing = required.filter((rel) => !existsSync(path.join(OUT, rel)));
  if (missing.length) {
    console.error("Missing media:\n  " + missing.join("\n  "));
    process.exit(1);
  }
  let total = 0;
  for (const rel of required) total += (await stat(path.join(OUT, rel))).size;
  console.log(`verified ${required.length} files · ${(total / 1048576).toFixed(2)} MB total`);
}

/* ----------------------------------------------------------------------------
   Main
   ---------------------------------------------------------------------------- */

const t0 = Date.now();
await mkdir(OUT, { recursive: true });
const table = [];

if (ONLY === "all" || ONLY === "landscapes") {
  for (const [rel, scene] of Object.entries(SCENES)) {
    const bytes = await renderLandscape(rel, scene);
    table.push([rel, bytes]);
    console.log(`  ${rel.padEnd(52)} ${(bytes / 1024).toFixed(0).padStart(5)} KB`);
  }
}
if (ONLY === "all" || ONLY === "portraits") {
  for (let i = 1; i <= 16; i++) {
    const rel = `portraits/p${String(i).padStart(2, "0")}.jpg`;
    table.push([rel, await renderPortrait(rel, `traveller-${i}`)]);
  }
  for (let i = 1; i <= 4; i++) {
    const rel = `curators/c${String(i).padStart(2, "0")}.jpg`;
    table.push([rel, await renderPortrait(rel, `curator-${i}`)]);
  }
  console.log(`  portraits ×20 done`);
}
if (ONLY === "all" || ONLY === "video") {
  const bytes = await renderVideo();
  table.push(["hero/hero.webm", bytes]);
  console.log(`  hero/hero.webm ${(bytes / 1048576).toFixed(2)} MB`);
}
if (ONLY === "all") await verify();
console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
