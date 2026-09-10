"use client";

/**
 * A stroke padlock on a 24-grid that "clicks" shut. Open: the shackle sits
 * lifted 4 units. Open → closed: the shackle drops and the body settles with
 * a small overshoot (the one place on the site an overshoot is right — it
 * has to read as a mechanical click), then a gold ring blooms and fades.
 * Closed → open: the shackle lifts, no ring. Reduced motion: poses only.
 */

import { useLayoutEffect, useRef } from "react";
import { gsap, setupGsap } from "@/components/motion/gsapSetup";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import styles from "./Padlock.module.css";

export type PadlockState = "open" | "closed";

export interface PadlockProps {
  state: PadlockState;
  /** Rendered size in px. @default 24 */
  size?: number;
  className?: string;
}

const LIFT = -4;

export function Padlock({ state, size = 24, className }: PadlockProps) {
  const shackleRef = useRef<SVGGElement>(null);
  const bodyRef = useRef<SVGGElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  // `undefined` until the first effect: the initial pose is set, never played.
  const previous = useRef<PadlockState | undefined>(undefined);

  useLayoutEffect(() => {
    const shackle = shackleRef.current;
    const body = bodyRef.current;
    const ring = ringRef.current;
    if (!shackle || !body || !ring) return;
    setupGsap();

    const first = previous.current === undefined;
    const wasOpen = previous.current === "open";
    previous.current = state;

    const ctx = gsap.context(() => {
      const pose = () => {
        gsap.set(shackle, { y: state === "open" ? LIFT : 0 });
        gsap.set(body, { scale: 1, transformOrigin: "50% 50%" });
        gsap.set(ring, { opacity: 0, scale: 1, transformOrigin: "50% 50%" });
      };

      if (first || prefersReducedMotion()) {
        pose();
        return;
      }

      if (state === "closed" && wasOpen) {
        const tl = gsap.timeline();
        tl.fromTo(
          shackle,
          { y: LIFT },
          { y: 0, duration: 0.4, ease: "back.out(1.7)" },
          0,
        )
          .fromTo(
            body,
            { scale: 0.96, transformOrigin: "50% 50%" },
            { scale: 1, duration: 0.4, ease: "back.out(1.7)" },
            0,
          )
          .fromTo(
            ring,
            { scale: 0.6, opacity: 1, transformOrigin: "50% 50%" },
            { scale: 1.4, opacity: 0, duration: 0.6, ease: "power2.out" },
            0.22,
          );
        return;
      }

      if (state === "open") {
        gsap.set(ring, { opacity: 0 });
        gsap.to(shackle, { y: LIFT, duration: 0.35, ease: "cinematic" });
        return;
      }

      pose();
    });

    return () => ctx.revert();
  }, [state]);

  const classes = [styles.padlock, className].filter(Boolean).join(" ");

  return (
    <svg
      className={classes}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-state={state}
    >
      <circle ref={ringRef} className={styles.ring} cx="12" cy="13" r="10.5" />
      <g ref={shackleRef} className={styles.shackle}>
        <path d="M7.5 11V8.25a4.5 4.5 0 0 1 9 0V11" />
      </g>
      <g ref={bodyRef} className={styles.body}>
        <rect x="4.75" y="11" width="14.5" height="9.5" rx="1.25" />
        <path d="M12 14.75v2.5" />
      </g>
    </svg>
  );
}
