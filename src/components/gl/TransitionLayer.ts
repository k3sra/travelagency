"use client";

/**
 * The full-screen transition quad: one PlaneGeometry(2, 2) with the shared
 * ShaderMaterial from shaders.ts. It lives in the stage's scene for the life of
 * the stage and is only ever drawn while the controller holds the render loop.
 *
 * Textures arrive asynchronously; a per-slot token discards stale loads and a
 * short plate→image ramp (driven from tick) hides a late arrival instead of
 * popping it in.
 */

import * as THREE from "three";
import type { TransitionKind } from "@/lib/types";
import { fragmentShader, vertexShader } from "./shaders";
import { getBrandPlate, loadTexture, type LoadedTexture } from "./textures";
import type { Stage } from "./stage";

export interface TransitionOrigin {
  /** 0..1 across the viewport. */
  x: number;
  /** 0..1, y up (shader space). */
  y: number;
}

const KIND_INDEX: Record<TransitionKind, number> = { dissolve: 0, ripple: 1, stretch: 2 };
/** Per-kind displacement strength; the shader treats stretch's value as a multiplier. */
const KIND_INTENSITY: Record<TransitionKind, number> = { dissolve: 0.12, ripple: 0.06, stretch: 1 };

const NOISE_SIZE = 256;
/** Seconds for a late texture to crossfade in over the procedural plate. */
const PLATE_RAMP = 0.35;

// A type literal (not an interface) so it satisfies ShaderMaterial's index signature.
type LayerUniforms = {
  uFrom: THREE.IUniform<THREE.Texture>;
  uTo: THREE.IUniform<THREE.Texture>;
  uDisp: THREE.IUniform<THREE.DataTexture>;
  uRes: THREE.IUniform<THREE.Vector2>;
  uFromRes: THREE.IUniform<THREE.Vector2>;
  uToRes: THREE.IUniform<THREE.Vector2>;
  uProgress: THREE.IUniform<number>;
  uKind: THREE.IUniform<number>;
  uOrigin: THREE.IUniform<THREE.Vector2>;
  uIntensity: THREE.IUniform<number>;
  uTime: THREE.IUniform<number>;
  uDispScale: THREE.IUniform<number>;
  uHasFrom: THREE.IUniform<number>;
  uHasTo: THREE.IUniform<number>;
  uTint: THREE.IUniform<THREE.Color>;
  uGold: THREE.IUniform<THREE.Color>;
};

type Slot = "from" | "to";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/* ------------------------------------------------------------------------
   Tileable fractal value noise → RG DataTexture. The lattice wraps at every
   octave so RepeatWrapping never shows a seam.
   ------------------------------------------------------------------------ */

function hash2(x: number, y: number, seed: number): number {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 2246822519)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function valueNoise(x: number, y: number, cells: number, seed: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = fade(x - x0);
  const fy = fade(y - y0);
  const x1 = (x0 + 1) % cells;
  const y1 = (y0 + 1) % cells;
  const a = hash2(x0, y0, seed);
  const b = hash2(x1, y0, seed);
  const c = hash2(x0, y1, seed);
  const d = hash2(x1, y1, seed);
  return lerp(lerp(a, b, fx), lerp(c, d, fx), fy);
}

function fbm(u: number, v: number, seed: number): number {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let cells = 4;
  for (let octave = 0; octave < 5; octave += 1) {
    sum += valueNoise(u * cells, v * cells, cells, seed + octave * 101) * amp;
    norm += amp;
    amp *= 0.5;
    cells *= 2;
  }
  // fbm clusters around 0.5; open the range so the field has real push in it.
  return clamp01(((sum / norm) - 0.5) * 1.9 + 0.5);
}

function createNoiseTexture(size: number): THREE.DataTexture {
  const data = new Uint8Array(size * size * 2);
  let i = 0;
  for (let y = 0; y < size; y += 1) {
    const v = y / size;
    for (let x = 0; x < size; x += 1) {
      const u = x / size;
      data[i] = Math.round(fbm(u, v, 11) * 255);
      data[i + 1] = Math.round(fbm(u, v, 97) * 255);
      i += 2;
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGFormat, THREE.UnsignedByteType);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

/* ------------------------------------------------------------------------
   Layer
   ------------------------------------------------------------------------ */

export class TransitionLayer {
  readonly stage: Stage;
  readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  readonly material: THREE.ShaderMaterial;

  private readonly uniforms: LayerUniforms;
  private readonly noise: THREE.DataTexture;
  private readonly unsubscribe: Array<() => void> = [];
  private readonly tokens: Record<Slot, number> = { from: 0, to: 0 };
  private readonly hasTarget: Record<Slot, number> = { from: 0, to: 0 };
  private live = false;
  private lastTime = 0;
  private disposed = false;

  constructor(stage: Stage) {
    this.stage = stage;
    this.noise = createNoiseTexture(NOISE_SIZE);
    const plate = getBrandPlate().texture;

    this.uniforms = {
      uFrom: { value: plate },
      uTo: { value: plate },
      uDisp: { value: this.noise },
      uRes: { value: new THREE.Vector2(stage.width, stage.height) },
      uFromRes: { value: new THREE.Vector2(1, 1) },
      uToRes: { value: new THREE.Vector2(1, 1) },
      uProgress: { value: 0 },
      uKind: { value: 0 },
      uOrigin: { value: new THREE.Vector2(0.5, 0.5) },
      uIntensity: { value: KIND_INTENSITY.dissolve },
      uTime: { value: 0 },
      uDispScale: { value: 1 },
      uHasFrom: { value: 0 },
      uHasTo: { value: 0 },
      // THREE.Color converts these sRGB hex values to the linear working space,
      // which is what the shader mixes in before colorspace_fragment encodes out.
      uTint: { value: new THREE.Color(0x2d3a3a) },
      uGold: { value: new THREE.Color(0xd4af37) },
    };

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
      transparent: false,
    });

    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    this.mesh.frustumCulled = false;
    this.mesh.matrixAutoUpdate = false;
    stage.scene.add(this.mesh);

    this.unsubscribe.push(
      stage.onResize((width, height) => {
        this.uniforms.uRes.value.set(width, height);
      }),
      stage.onFrame((time) => this.tick(time)),
      stage.onDispose(() => this.dispose()),
    );
  }

  get isDisposed() {
    return this.disposed;
  }

  setKind(kind: TransitionKind) {
    this.uniforms.uKind.value = KIND_INDEX[kind];
    this.uniforms.uIntensity.value = KIND_INTENSITY[kind];
  }

  setOrigin(origin: TransitionOrigin) {
    this.uniforms.uOrigin.value.set(clamp01(origin.x), clamp01(origin.y));
  }

  setProgress(progress: number) {
    this.uniforms.uProgress.value = clamp01(progress);
    this.stage.requestRender();
  }

  /**
   * While live, a texture that lands late ramps in over the plate instead of
   * snapping; while not live (between transitions) slots update instantly.
   */
  setLive(live: boolean) {
    this.live = live;
    this.lastTime = 0;
  }

  /** Resolves once the slot holds its final texture (or the plate, if the load failed). */
  setFrom(url: string | null): Promise<void> {
    return this.load("from", url);
  }

  setTo(url: string | null): Promise<void> {
    return this.load("to", url);
  }

  /** Called by the stage before every rendered frame. Time in seconds. */
  tick(time: number) {
    const u = this.uniforms;
    u.uTime.value = time;
    const dt = this.lastTime > 0 ? Math.min(0.1, time - this.lastTime) : 0;
    this.lastTime = time;
    if (dt <= 0) return;
    const step = dt / PLATE_RAMP;
    u.uHasFrom.value = approach(u.uHasFrom.value, this.hasTarget.from, step);
    u.uHasTo.value = approach(u.uHasTo.value, this.hasTarget.to, step);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.unsubscribe.forEach((off) => off());
    this.unsubscribe.length = 0;
    this.stage.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.noise.dispose();
    if (current === this) current = null;
  }

  private async load(slot: Slot, url: string | null): Promise<void> {
    const token = ++this.tokens[slot];
    // Clear the slot first: a slow load shows the plate, never the previous
    // transition's image. A cache hit resolves before the next frame anyway.
    this.apply(slot, null);
    if (!url) return;
    const loaded = await loadTexture(url);
    if (this.disposed || token !== this.tokens[slot]) return;
    this.apply(slot, loaded.plate ? null : loaded);
  }

  private apply(slot: Slot, loaded: LoadedTexture | null) {
    const u = this.uniforms;
    const texture = loaded ? loaded.texture : getBrandPlate().texture;
    const width = loaded ? loaded.width : 1;
    const height = loaded ? loaded.height : 1;
    if (slot === "from") {
      u.uFrom.value = texture;
      u.uFromRes.value.set(width, height);
    } else {
      u.uTo.value = texture;
      u.uToRes.value.set(width, height);
    }
    const target = loaded ? 1 : 0;
    this.hasTarget[slot] = target;
    const has = slot === "from" ? u.uHasFrom : u.uHasTo;
    // Losing a texture always snaps: fading to the plate mid-frame reads as a glitch.
    if (!this.live || target === 0) has.value = target;
    this.stage.requestRender();
  }
}

function approach(value: number, target: number, step: number): number {
  if (value === target) return value;
  return value < target ? Math.min(target, value + step) : Math.max(target, value - step);
}

let current: TransitionLayer | null = null;

/** The layer bound to this stage, created on first use. */
export function getTransitionLayer(stage: Stage): TransitionLayer {
  if (current && !current.isDisposed && current.stage === stage) return current;
  current?.dispose();
  current = new TransitionLayer(stage);
  return current;
}

/**
 * Build the layer and compile its program ahead of the first navigation so the
 * click itself never pays for noise generation or a shader compile.
 */
export function warmTransitionLayer(stage: Stage) {
  if (stage.isDisposed) return;
  getTransitionLayer(stage);
  stage.renderer.compileAsync(stage.scene, stage.camera).catch(() => {
    // A failed warm-up only means the first transition compiles on demand.
  });
}
