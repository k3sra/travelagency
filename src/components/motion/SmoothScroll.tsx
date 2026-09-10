"use client";

/**
 * Lenis provider — the single source of truth for scroll position.
 * Lenis drives GSAP's ticker and feeds ScrollTrigger from its own scroll
 * events (60 fps rule 5). Mount once in the root layout.
 *
 * `scrollControl` exposes the same instance to non-React callers (transition
 * controller, booking drawer) and is safe before Lenis exists: it falls back
 * to native scrolling.
 */

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger, setupGsap } from "./gsapSetup";
import { LENIS } from "@/lib/easing";
import { getState, subscribe } from "@/lib/store";

export type ScrollTarget = number | string | HTMLElement;

export interface ScrollToOptions {
  immediate?: boolean;
  offset?: number;
  duration?: number;
}

/* ------------------------------------------------------------------------
   Module-level instance (external store) so `scrollControl` and `useLenis`
   share one source of truth without React state written from effects.
   ------------------------------------------------------------------------ */

let instance: Lenis | null = null;
const instanceListeners = new Set<() => void>();

function setInstance(next: Lenis | null) {
  instance = next;
  instanceListeners.forEach((listener) => listener());
}

function subscribeInstance(listener: () => void) {
  instanceListeners.add(listener);
  return () => {
    instanceListeners.delete(listener);
  };
}

const getInstance = () => instance;
const getServerInstance = () => null;

function resolveTarget(target: ScrollTarget): number | null {
  if (typeof target === "number") return target;
  if (target === "top") return 0;
  if (target === "bottom") return document.documentElement.scrollHeight;
  let el: HTMLElement | null = null;
  if (typeof target === "string") {
    try {
      el = target.startsWith("#")
        ? document.getElementById(target.slice(1))
        : document.querySelector<HTMLElement>(target);
    } catch {
      return null;
    }
  } else {
    el = target;
  }
  if (!el) return null;
  return el.getBoundingClientRect().top + window.scrollY;
}

/** Native fallback used before Lenis exists (or after it was destroyed). */
function nativeScrollTo(target: ScrollTarget, opts?: ScrollToOptions) {
  const top = resolveTarget(target);
  if (top === null) return;
  window.scrollTo({
    top: top + (opts?.offset ?? 0),
    behavior: opts?.immediate ? "instant" : "smooth",
  });
}

export const scrollControl = {
  stop() {
    instance?.stop();
  },
  start() {
    instance?.start();
  },
  scrollTo(target: ScrollTarget, opts?: ScrollToOptions) {
    if (typeof window === "undefined") return;
    if (!instance) {
      nativeScrollTo(target, opts);
      return;
    }
    instance.scrollTo(target, {
      offset: opts?.offset,
      immediate: opts?.immediate,
      duration: opts?.duration,
      // The route swap under the transition curtain jumps to the top while the
      // drawer may still hold Lenis stopped; an immediate jump must always land.
      force: opts?.immediate === true,
    });
  },
  get lenis(): Lenis | null {
    return instance;
  },
};

/* ------------------------------------------------------------------------
   Provider
   ------------------------------------------------------------------------ */

const LenisContext = createContext<Lenis | null>(null);

export function useLenis(): Lenis | null {
  return useContext(LenisContext);
}

/** The static export serves "/journeys/x/"; compare routes without the slash. */
const normalizePath = (path: string) => (path.length > 1 ? path.replace(/\/+$/, "") : path);

export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenis = useSyncExternalStore(subscribeInstance, getInstance, getServerInstance);
  const pathname = usePathname();
  const lastPathname = useRef(pathname);

  useEffect(() => {
    setupGsap();

    const lenis = new Lenis({
      lerp: LENIS.lerp,
      duration: LENIS.duration,
      easing: LENIS.easing,
      wheelMultiplier: LENIS.wheelMultiplier,
      touchMultiplier: LENIS.touchMultiplier,
      smoothWheel: true,
      syncTouch: false,
      autoRaf: false,
      anchors: true,
      // Reduced motion: Lenis keeps running, so ScrollTrigger stays accurate
      // and scrollTo/anchors still work, but lerp is forced to 1 and
      // programmatic scrolls become instant: no smoothing, no inertia.
      respectReducedMotion: true,
    });

    const offScroll = lenis.on("scroll", () => ScrollTrigger.update());
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    setInstance(lenis);

    let alive = true;
    let frame = 0;
    const refresh = () => {
      if (alive) ScrollTrigger.refresh();
    };
    const refreshNextFrame = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(refresh);
    };
    document.fonts.ready.then(refresh);
    if (document.readyState === "complete") refresh();
    else window.addEventListener("load", refresh, { once: true });

    // The booking drawer locks the page by flipping `drawerOpen`; the GL
    // transition announces the new page by returning `transition` to "idle",
    // which is the moment to re-measure every ScrollTrigger.
    let locked = getState().drawerOpen;
    let phase = getState().transition;
    if (locked) lenis.stop();
    const unsubscribe = subscribe(() => {
      const next = getState();
      if (next.drawerOpen !== locked) {
        locked = next.drawerOpen;
        if (locked) lenis.stop();
        else lenis.start();
      }
      if (next.transition !== phase) {
        const settled = phase !== "idle" && next.transition === "idle";
        phase = next.transition;
        if (settled) refreshNextFrame();
      }
    });

    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      unsubscribe();
      window.removeEventListener("load", refresh);
      gsap.ticker.remove(tick);
      offScroll();
      lenis.destroy();
      setInstance(null);
    };
  }, []);

  // Back/forward and plain router navigations arrive here without the GL
  // transition: jump to the top (or the hash target) and let ScrollTrigger
  // re-measure the new page on the next frame.
  useEffect(() => {
    if (normalizePath(lastPathname.current) === normalizePath(pathname)) return;
    lastPathname.current = pathname;
    if (getState().transition !== "idle") return;
    const hash = window.location.hash;
    scrollControl.scrollTo(hash.length > 1 ? hash : 0, { immediate: true });
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return <LenisContext value={lenis}>{children}</LenisContext>;
}
