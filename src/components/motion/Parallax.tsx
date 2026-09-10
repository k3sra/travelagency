"use client";

/**
 * Scrubbed vertical drift. `speed` is the fraction of the wrapper's own height
 * travelled while it crosses the viewport (0.15 = 15 %); negative values drift
 * the other way. Transform only, reverted on unmount, inert under reduced motion.
 */

import { useEffect, useRef, type ReactNode } from "react";
import { gsap, setupGsap } from "./gsapSetup";
import { useReducedMotion } from "@/lib/useReducedMotion";

export interface ParallaxProps {
  children: ReactNode;
  /** @default 0.15 */
  speed?: number;
  className?: string;
}

export function Parallax({ children, speed = 0.15, className }: ParallaxProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    const inner = innerRef.current;
    if (!root || !inner || reduced || speed === 0) return;

    setupGsap();
    const ctx = gsap.context(() => {
      gsap.fromTo(
        inner,
        { yPercent: -speed * 50 },
        {
          yPercent: speed * 50,
          ease: "none",
          scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: true },
        },
      );
    }, root);

    return () => ctx.revert();
  }, [reduced, speed]);

  return (
    <div ref={rootRef} className={className}>
      <div ref={innerRef}>{children}</div>
    </div>
  );
}
