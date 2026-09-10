"use client";

/**
 * Texture loader for the transition stage.
 *
 * A Map doubles as a small LRU (re-insertion marks recent use); evicted entries
 * are disposed so GPU memory stays bounded. Images larger than 2048 px are
 * downscaled on an offscreen canvas before upload (60 fps rule 4).
 */

import * as THREE from "three";

export interface LoadedTexture {
  texture: THREE.Texture;
  width: number;
  height: number;
  /** True when this is the generated brand plate, i.e. no image was available. */
  plate: boolean;
}

const MAX_ENTRIES = 10;
const MAX_DIMENSION = 2048;
const PLATE_SIZE = 512;

const cache = new Map<string, Promise<LoadedTexture>>();
let loader: THREE.TextureLoader | null = null;
let plate: LoadedTexture | null = null;

function configure(texture: THREE.Texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 1;
  texture.needsUpdate = true;
}

function downscale(image: HTMLImageElement, width: number, height: number): HTMLCanvasElement | null {
  const scale = MAX_DIMENSION / Math.max(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function evict() {
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    const entry = cache.get(oldest);
    cache.delete(oldest);
    entry?.then((loaded) => {
      if (!loaded.plate) loaded.texture.dispose();
    });
  }
}

/** Load (or reuse) a texture. Never rejects: on failure the brand plate is returned. */
export function loadTexture(url: string): Promise<LoadedTexture> {
  const hit = cache.get(url);
  if (hit) {
    cache.delete(url);
    cache.set(url, hit);
    return hit;
  }
  if (!loader) loader = new THREE.TextureLoader();

  const entry: Promise<LoadedTexture> = loader
    .loadAsync(url)
    .then((loaded) => {
      // Widened so a downscaled canvas can replace the image the loader typed in.
      const texture: THREE.Texture = loaded;
      const image = loaded.image as HTMLImageElement;
      let width = image.naturalWidth || image.width;
      let height = image.naturalHeight || image.height;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const small = downscale(image, width, height);
        if (small) {
          texture.image = small;
          width = small.width;
          height = small.height;
        }
      }
      configure(texture);
      return { texture, width, height, plate: false };
    })
    .catch(() => {
      if (cache.get(url) === entry) cache.delete(url);
      return getBrandPlate();
    });

  cache.set(url, entry);
  evict();
  return entry;
}

/** Warm the cache without awaiting. */
export function preload(url: string) {
  if (!url || typeof window === "undefined") return;
  void loadTexture(url);
}

function paintPlate(ctx: CanvasRenderingContext2D, size: number) {
  const base = ctx.createLinearGradient(0, 0, size * 0.35, size);
  base.addColorStop(0, "#3b4b49");
  base.addColorStop(0.5, "#2d3a3a");
  base.addColorStop(1, "#1a2424");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  const vignette = ctx.createRadialGradient(size * 0.45, size * 0.4, size * 0.1, size * 0.5, size * 0.5, size * 0.85);
  vignette.addColorStop(0, "rgba(18, 26, 26, 0)");
  vignette.addColorStop(1, "rgba(18, 26, 26, 0.6)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, size, size);

  const bloom = ctx.createRadialGradient(size * 0.3, size * 0.28, 0, size * 0.3, size * 0.28, size * 0.6);
  bloom.addColorStop(0, "rgba(212, 175, 55, 0.1)");
  bloom.addColorStop(1, "rgba(212, 175, 55, 0)");
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, size, size);

  // Static grain (an LCG keeps it deterministic); Uint8ClampedArray clamps for us.
  const img = ctx.getImageData(0, 0, size, size);
  const px = img.data;
  let seed = 7;
  for (let i = 0; i < px.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const n = (((seed >>> 16) & 0xff) / 255 - 0.5) * 14;
    px[i] += n;
    px[i + 1] += n;
    px[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

/** Generated forest plate used when no image is available. Cached; disposed with the stage. */
export function getBrandPlate(): LoadedTexture {
  if (plate) return plate;
  const canvas = document.createElement("canvas");
  canvas.width = PLATE_SIZE;
  canvas.height = PLATE_SIZE;
  const ctx = canvas.getContext("2d");
  if (ctx) paintPlate(ctx, PLATE_SIZE);
  const texture = new THREE.CanvasTexture(canvas);
  configure(texture);
  plate = { texture, width: PLATE_SIZE, height: PLATE_SIZE, plate: true };
  return plate;
}

/** Release every cached texture (stage teardown). Entries still loading are disposed on arrival. */
export function disposeAllTextures() {
  for (const entry of cache.values()) {
    entry.then((loaded) => {
      if (!loaded.plate) loaded.texture.dispose();
    });
  }
  cache.clear();
  if (plate) {
    plate.texture.dispose();
    plate = null;
  }
}
