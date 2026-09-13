"use client";

import { useEffect, type RefObject } from "react";
import { gsap, setupGsap } from "@/components/motion/gsapSetup";
import { prefersReducedMotion } from "@/lib/useReducedMotion";

/** Fine pointers only: the element leans toward the cursor by up to `max` degrees. */
export function useTilt(ref: RefObject<HTMLElement | null>, max = 6) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    setupGsap();
    gsap.set(el, { transformPerspective: 1200 });
    const rx = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3.out" });
    const ry = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3.out" });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      ry(px * max * 2);
      rx(-py * max * 2);
    };
    const leave = () => { rx(0); ry(0); };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [ref, max]);
}
