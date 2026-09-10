"use client";

/**
 * The WebGL stage: one renderer, one orthographic camera, one scene, created
 * lazily by <GLStage/> and shared through getStage(). Render-on-demand: nothing
 * runs while idle; requestRender() draws exactly one frame and
 * acquireLoop/releaseLoop keep a rAF loop alive only while an owner holds it.
 */

import * as THREE from "three";
import { disposeAllTextures } from "./textures";

const MAX_DPR = 1.5;

type FrameListener = (time: number) => void;
type ResizeListener = (width: number, height: number) => void;

export class Stage {
  readonly canvas: HTMLCanvasElement;
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.OrthographicCamera;
  /** Viewport size in CSS pixels (drawing buffer is this times the capped DPR). */
  width = 1;
  height = 1;

  private readonly owners = new Set<string>();
  private readonly frameListeners = new Set<FrameListener>();
  private readonly resizeListeners = new Set<ResizeListener>();
  private readonly disposeListeners = new Set<() => void>();
  private rafId = 0;
  private frameTime = 0;
  private resizeQueued = true;
  private visible = false;
  private lost = false;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    });
    this.renderer.setClearColor(0x000000, 0);
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    canvas.addEventListener("webglcontextlost", this.onContextLost);
    canvas.addEventListener("webglcontextrestored", this.onContextRestored);
    window.addEventListener("resize", this.onWindowResize);
    this.applyResize();
  }

  get isContextLost() {
    return this.lost;
  }

  get isDisposed() {
    return this.disposed;
  }

  /** Draw one frame on the next animation frame. */
  requestRender() {
    if (this.disposed || this.rafId) return;
    this.rafId = requestAnimationFrame(this.frame);
  }

  /** Keep a continuous rAF loop alive while any owner holds it. */
  acquireLoop(owner: string) {
    this.owners.add(owner);
    this.requestRender();
  }

  releaseLoop(owner: string) {
    this.owners.delete(owner);
  }

  /** Canvas opacity 0/1 via inline style; GSAP tweens the same property in between. */
  setVisible(v: boolean) {
    this.visible = v;
    this.canvas.style.opacity = v ? "1" : "0";
  }

  /** Called with the time in seconds before every rendered frame. */
  onFrame(cb: FrameListener) {
    this.frameListeners.add(cb);
    return () => {
      this.frameListeners.delete(cb);
    };
  }

  onResize(cb: ResizeListener) {
    this.resizeListeners.add(cb);
    return () => {
      this.resizeListeners.delete(cb);
    };
  }

  onDispose(cb: () => void) {
    this.disposeListeners.add(cb);
    return () => {
      this.disposeListeners.delete(cb);
    };
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    window.removeEventListener("resize", this.onWindowResize);
    this.canvas.removeEventListener("webglcontextlost", this.onContextLost);
    this.canvas.removeEventListener("webglcontextrestored", this.onContextRestored);

    this.disposeListeners.forEach((cb) => cb());
    this.disposeListeners.clear();
    this.scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry.dispose();
      const material = mesh.material;
      if (Array.isArray(material)) material.forEach((m) => m.dispose());
      else material.dispose();
    });
    this.scene.clear();
    disposeAllTextures();
    this.owners.clear();
    this.frameListeners.clear();
    this.resizeListeners.clear();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }

  private readonly frame = (now: number) => {
    this.rafId = 0;
    if (this.disposed || this.lost) return;
    if (this.resizeQueued) this.applyResize();
    this.frameTime = now * 0.001;
    this.frameListeners.forEach(this.runFrameListener);
    this.renderer.render(this.scene, this.camera);
    if (this.owners.size > 0) this.rafId = requestAnimationFrame(this.frame);
  };

  // Bound once so the loop allocates nothing per frame.
  private readonly runFrameListener = (cb: FrameListener) => cb(this.frameTime);
  private readonly runResizeListener = (cb: ResizeListener) => cb(this.width, this.height);

  private applyResize() {
    this.resizeQueued = false;
    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);
    this.width = width;
    this.height = height;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
    this.renderer.setSize(width, height, false);
    this.resizeListeners.forEach(this.runResizeListener);
  }

  // Resizes are applied lazily on the next drawn frame; while idle nothing happens.
  private readonly onWindowResize = () => {
    this.resizeQueued = true;
    if (this.visible || this.owners.size > 0) this.requestRender();
  };

  private readonly onContextLost = (event: Event) => {
    event.preventDefault();
    this.lost = true;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  };

  private readonly onContextRestored = () => {
    this.lost = false;
    this.resizeQueued = true;
    if (this.visible || this.owners.size > 0) this.requestRender();
  };
}

let current: Stage | null = null;
let refCount = 0;
let releaseTimer: ReturnType<typeof setTimeout> | null = null;
let probe: boolean | null = null;

/** The live stage, or null before <GLStage/> mounts (or if the renderer could not be created). */
export function getStage(): Stage | null {
  return current && !current.isDisposed ? current : null;
}

function probeWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** False on the server, without WebGL2, after a renderer failure, or while the context is lost. */
export function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") return false;
  if (current && !current.isDisposed) return !current.isContextLost;
  if (probe === null) probe = probeWebGL();
  return probe;
}

/**
 * Create (or reuse) the stage for a canvas. Reference counted, and teardown is
 * deferred a tick so Strict Mode's mount/unmount/mount keeps one renderer.
 */
export function acquireStage(canvas: HTMLCanvasElement): Stage | null {
  if (releaseTimer) {
    clearTimeout(releaseTimer);
    releaseTimer = null;
  }
  if (current && !current.isDisposed && current.canvas === canvas) {
    refCount += 1;
    return current;
  }
  if (current) {
    current.dispose();
    current = null;
  }
  try {
    current = new Stage(canvas);
    probe = true;
  } catch {
    current = null;
    probe = false;
    return null;
  }
  refCount = 1;
  return current;
}

export function releaseStage(stage: Stage) {
  if (stage !== current) {
    stage.dispose();
    return;
  }
  refCount = Math.max(0, refCount - 1);
  if (refCount > 0 || releaseTimer) return;
  releaseTimer = setTimeout(() => {
    releaseTimer = null;
    if (refCount === 0 && current === stage) {
      stage.dispose();
      current = null;
    }
  }, 0);
}
