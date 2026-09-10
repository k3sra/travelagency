"use client";

/**
 * Zero-reload page transitions.
 *
 * `transitions.navigate()` runs the whole sequence from ARCHITECTURE.md:
 * canvas up over the outgoing hero → shader progress 0→1 (route pushed at the
 * midpoint) → hold on the incoming image until the new page and its texture
 * are both there → scroll settled under cover → canvas down → page-enter.
 * Without WebGL, or with reduced motion, the same sequence drives the CSS
 * curtain rendered by <GLStage/>. Nothing here touches the DOM at import time.
 *
 * TransitionProvider hands over the router and keeps `currentPathname` fresh;
 * TransitionLink is the usual entry point.
 */

import { useEffect, useRef } from "react";
import type { useRouter } from "next/navigation";
import { gsap, setupGsap } from "@/components/motion/gsapSetup";
import { scrollControl } from "@/components/motion/SmoothScroll";
import { DUR, EASE_CINEMATIC } from "@/lib/easing";
import { setState } from "@/lib/store";
import type { TransitionKind } from "@/lib/types";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import { getStage, isWebGLAvailable, type Stage } from "./stage";
import { preload as preloadTexture } from "./textures";
import { getTransitionLayer, type TransitionOrigin } from "./TransitionLayer";

export type { TransitionKind };

export interface NavigateOptions {
  kind?: TransitionKind;
  /** Texture for the destination page (its hero); the brand plate otherwise. */
  to?: string;
  /** Ripple centre, 0..1 with y up. */
  origin?: TransitionOrigin;
}

type Router = ReturnType<typeof useRouter>;

const ROOT_CLASS = "is-transitioning";
const LOOP_OWNER = "transition";
const HERO_SELECTOR = "[data-transition-hero]";
const CURTAIN_SELECTOR = "[data-transition-curtain]";

/** Seconds. */
const CANVAS_IN = 0.25;
const CANVAS_OUT = 0.6;
const CURTAIN = 0.7;
const REDUCED_FADE = 0.3;
/** Milliseconds. */
const FROM_WAIT = 300;
const TO_TIMEOUT = 4000;
const HOLD_TIMEOUT = 6000;
const HERO_WARM_DELAY = 900;

const DEFAULT_ORIGIN: TransitionOrigin = { x: 0.5, y: 0.5 };

/* ------------------------------------------------------------------------
   Module state
   ------------------------------------------------------------------------ */

let router: Router | null = null;
let currentPathname: string | null = null;
let active = false;
let pendingHash: string | null = null;
let heroWarmTimer = 0;

const enterListeners = new Set<() => void>();

interface PathWaiter {
  from: string | null;
  resolve: () => void;
}
const pathWaiters = new Set<PathWaiter>();

/* ------------------------------------------------------------------------
   Helpers
   ------------------------------------------------------------------------ */

/** "/journeys/x/" and "/journeys/x" are the same route (static export adds the slash). */
export function normalizePathname(pathname: string): string {
  const bare = pathname.split(/[?#]/, 1)[0] || "/";
  if (bare.length > 1 && bare.endsWith("/")) return bare.slice(0, -1);
  return bare;
}

interface ParsedHref {
  pathname: string;
  search: string;
  hash: string;
}

// Hrefs are base-path-free ("/journeys/x"); resolving against a private origin
// keeps window.location's base path out of the comparison.
function parseHref(href: string): ParsedHref | null {
  const base = "http://fable.internal";
  let url: URL;
  try {
    url = new URL(href, base + (currentPathname ?? "/"));
  } catch {
    return null;
  }
  if (url.origin !== base) return null;
  return { pathname: normalizePathname(url.pathname), search: url.search, hash: url.hash };
}

function readHeroUrl(): string | null {
  const value = document.querySelector(HERO_SELECTOR)?.getAttribute("data-transition-hero");
  return value && value.trim() ? value : null;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function withTimeout(promise: Promise<unknown>, ms: number): Promise<void> {
  return Promise.race([promise.then(() => undefined), delay(ms)]);
}

function waitForPathnameChange(from: string | null, timeoutMs: number): Promise<void> {
  if (currentPathname !== null && currentPathname !== from) return Promise.resolve();
  return new Promise((resolve) => {
    const waiter: PathWaiter = {
      from,
      resolve: () => {
        window.clearTimeout(timer);
        pathWaiters.delete(waiter);
        resolve();
      },
    };
    const timer = window.setTimeout(waiter.resolve, timeoutMs);
    pathWaiters.add(waiter);
  });
}

/** Land the new page at its top (or at the requested anchor) while it is still covered. */
function settleScroll() {
  if (pendingHash) {
    const el = document.getElementById(decodeURIComponent(pendingHash.slice(1)));
    if (el) {
      scrollControl.scrollTo(el, { immediate: true });
      return;
    }
  }
  scrollControl.scrollTo(0, { immediate: true });
}

function canUseGL(): boolean {
  return getStage() !== null && isWebGLAvailable() && !prefersReducedMotion();
}

/** Decode the current hero into the texture cache so the next click's first frame is ready. */
function scheduleHeroWarm() {
  window.clearTimeout(heroWarmTimer);
  heroWarmTimer = window.setTimeout(() => {
    heroWarmTimer = 0;
    if (active || !canUseGL()) return;
    const url = readHeroUrl();
    if (url) preloadTexture(url);
  }, HERO_WARM_DELAY);
}

function emitPageEnter() {
  Array.from(enterListeners).forEach((listener) => listener());
}

/* ------------------------------------------------------------------------
   Provider bindings (TransitionProvider)
   ------------------------------------------------------------------------ */

export function registerRouter(next: Router | null) {
  router = next;
}

export function setCurrentPathname(pathname: string) {
  const next = normalizePathname(pathname);
  const changed = next !== currentPathname;
  currentPathname = next;
  if (!changed) return;
  if (active) settleScroll();
  Array.from(pathWaiters).forEach((waiter) => {
    if (waiter.from !== next) waiter.resolve();
  });
  if (!active) scheduleHeroWarm();
}

/* ------------------------------------------------------------------------
   Sequences
   ------------------------------------------------------------------------ */

interface RoutePush {
  pushed: boolean;
  push(): void;
}

function createPush(href: string): RoutePush {
  return {
    pushed: false,
    push() {
      if (this.pushed) return;
      this.pushed = true;
      setState({ transition: "swap" });
      // Scroll is settled by hand once the new page exists, under the canvas.
      router?.push(href, { scroll: false });
    },
  };
}

function tween(ctx: gsap.Context, build: (done: () => void) => void): Promise<void> {
  return new Promise((resolve) => {
    ctx.add(() => build(resolve));
  });
}

async function runGL(
  stage: Stage,
  nav: RoutePush,
  startPath: string | null,
  fromUrl: string | null,
  toUrl: string | null,
  opts: NavigateOptions,
) {
  const layer = getTransitionLayer(stage);
  const canvas = stage.canvas;

  layer.setLive(false);
  layer.setKind(opts.kind ?? "dissolve");
  layer.setOrigin(opts.origin ?? DEFAULT_ORIGIN);
  layer.setProgress(0);
  const toReady = layer.setTo(toUrl);
  // The outgoing hero is already decoded by the page, so this usually resolves
  // within a frame; the cap keeps a cold cache from delaying the click.
  await Promise.race([layer.setFrom(fromUrl), delay(FROM_WAIT)]);
  layer.setLive(true);

  stage.acquireLoop(LOOP_OWNER);
  const progress = { value: 0 };
  const ctx = gsap.context(() => {});

  try {
    await tween(ctx, (done) => {
      const tl = gsap.timeline({ onComplete: done });
      tl.fromTo(canvas, { opacity: 0 }, { opacity: 1, duration: CANVAS_IN, ease: "power2.out" }, 0);
      tl.to(
        progress,
        {
          value: 1,
          duration: DUR.transition,
          ease: EASE_CINEMATIC,
          onUpdate: () => {
            layer.setProgress(progress.value);
            if (progress.value >= 0.5) nav.push();
          },
        },
        0,
      );
    });
    nav.push();
    layer.setProgress(1);

    // Hold on the incoming image until the new page is mounted and its texture is in.
    await Promise.all([waitForPathnameChange(startPath, HOLD_TIMEOUT), withTimeout(toReady, TO_TIMEOUT)]);

    settleScroll();
    setState({ transition: "in" });
    await tween(ctx, (done) => {
      gsap.to(canvas, { opacity: 0, duration: CANVAS_OUT, ease: "power2.inOut", onComplete: done });
    });
  } finally {
    ctx.revert();
    stage.setVisible(false);
    stage.releaseLoop(LOOP_OWNER);
    layer.setLive(false);
    layer.setProgress(0);
  }
}

async function runCurtain(nav: RoutePush, startPath: string | null) {
  const curtain = document.querySelector<HTMLElement>(CURTAIN_SELECTOR);
  if (!curtain) {
    nav.push();
    await waitForPathnameChange(startPath, HOLD_TIMEOUT);
    settleScroll();
    setState({ transition: "in" });
    return;
  }

  // Reduced motion: a short crossfade instead of a wipe — no movement, no flash.
  const reduced = prefersReducedMotion();
  const ctx = gsap.context(() => {});

  try {
    await tween(ctx, (done) => {
      if (reduced) {
        gsap.fromTo(
          curtain,
          { opacity: 0, scaleY: 1, transformOrigin: "50% 100%" },
          { opacity: 1, duration: REDUCED_FADE, ease: "none", onComplete: done },
        );
      } else {
        gsap.fromTo(
          curtain,
          { opacity: 1, scaleY: 0, transformOrigin: "50% 100%" },
          { scaleY: 1, duration: CURTAIN, ease: EASE_CINEMATIC, onComplete: done },
        );
      }
    });
    // The plate has to cover the page before the swap can happen underneath it.
    nav.push();
    await waitForPathnameChange(startPath, HOLD_TIMEOUT);

    settleScroll();
    setState({ transition: "in" });
    await tween(ctx, (done) => {
      if (reduced) {
        gsap.to(curtain, { opacity: 0, duration: REDUCED_FADE, ease: "none", onComplete: done });
      } else {
        gsap.to(curtain, {
          scaleY: 0,
          transformOrigin: "50% 0%",
          duration: CURTAIN,
          ease: EASE_CINEMATIC,
          onComplete: done,
        });
      }
    });
  } finally {
    ctx.revert();
  }
}

async function navigate(href: string, opts: NavigateOptions = {}): Promise<void> {
  if (typeof window === "undefined" || active) return;

  const target = parseHref(href);
  if (!target) {
    window.location.assign(href);
    return;
  }

  if (currentPathname !== null && target.pathname === currentPathname) {
    // Same route: no curtain. A changed query re-renders in place; a hash just
    // scrolls. Either way the URL is pushed so history stays truthful.
    const searchChanged = target.search !== window.location.search;
    if (searchChanged || target.hash) router?.push(href, { scroll: false });
    if (target.hash) {
      const el = document.getElementById(decodeURIComponent(target.hash.slice(1)));
      if (el) scrollControl.scrollTo(el, { immediate: prefersReducedMotion() });
    }
    return;
  }

  if (!router) {
    // Provider not mounted: last resort is a real navigation under the base path.
    const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
    window.location.assign(basePath + href);
    return;
  }

  setupGsap();
  active = true;
  pendingHash = target.hash || null;
  window.clearTimeout(heroWarmTimer);
  heroWarmTimer = 0;

  const startPath = currentPathname;
  const nav = createPush(href);
  const root = document.documentElement;
  const fromUrl = readHeroUrl();
  const toUrl = opts.to ?? null;
  const stage = canUseGL() ? getStage() : null;
  if (toUrl && stage) preloadTexture(toUrl);

  setState({ transition: "out" });
  root.classList.add(ROOT_CLASS);

  try {
    if (stage) await runGL(stage, nav, startPath, fromUrl, toUrl, opts);
    else await runCurtain(nav, startPath);
  } catch {
    // Whatever failed mid-sequence, the route must still change.
    nav.push();
  } finally {
    root.classList.remove(ROOT_CLASS);
    pendingHash = null;
    active = false;
    setState({ transition: "idle" });
  }

  emitPageEnter();
  scheduleHeroWarm();
}

/* ------------------------------------------------------------------------
   Public API
   ------------------------------------------------------------------------ */

export const transitions = {
  navigate,
  /** Warm a destination texture (hover / focus). No-op without a usable stage. */
  preload(url: string) {
    if (!url || typeof window === "undefined" || !canUseGL()) return;
    preloadTexture(url);
  },
  /** Hero calls this once its intro has played; safe to call any number of times. */
  markIntroDone() {
    setState({ introDone: true });
  },
  get active(): boolean {
    return active;
  },
};

/**
 * Runs `cb` when the curtain lifts on a new page. If no transition is active
 * when the component mounts (first load, back/forward), it runs on the next
 * frame instead. Persistent components (layout chrome) receive every entry.
 */
export function usePageEnter(cb: () => void): void {
  const callbackRef = useRef(cb);

  useEffect(() => {
    callbackRef.current = cb;
  });

  useEffect(() => {
    const run = () => callbackRef.current();
    enterListeners.add(run);
    const frame = active ? 0 : requestAnimationFrame(run);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      enterListeners.delete(run);
    };
  }, []);
}
