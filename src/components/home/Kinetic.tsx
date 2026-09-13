"use client";

/**
 * A line of destination names in giant italics that slides with the scroll.
 * Pure transform, scrubbed, so it costs nothing at 60 fps.
 */

import { useEffect, useRef } from "react";
import { gsap, setupGsap } from "@/components/motion/gsapSetup";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import styles from "./Kinetic.module.css";

const NAMES = ["Bali", "Mykonos", "Tulum", "Cape Town"];

export function Kinetic() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    setupGsap();
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const track = el.querySelector<HTMLElement>("[data-kinetic-track]");
      if (!track) return;
      gsap.fromTo(track, { xPercent: 4 }, { xPercent: -46, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
    }, el);
    return () => ctx.revert();
  }, []);

  const run = [...NAMES, ...NAMES];
  return (
    <div ref={root} className={styles.kinetic} aria-hidden="true">
      <div className={styles.track} data-kinetic-track>
        {run.map((name, i) => (
          <span key={`${name}-${i}`} className={`t-display ${styles.name}`}>
            <em>{name}</em>
            <span className={styles.dot} />
          </span>
        ))}
      </div>
    </div>
  );
}
