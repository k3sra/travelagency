"use client";

/**
 * "[ 85% Cultural Deep Dive ]" — the journey's vibe profile in caps.
 * Compact by default (an inline list). With `animate`, each tag carries a
 * one-pixel gold bar that fills to its percentage as the list scrolls in
 * (scaleX, once). At rest the bars sit at their final width, so nothing is
 * lost without scripting or under reduced motion.
 */

import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { gsap, setupGsap } from "@/components/motion/gsapSetup";
import { EASE_FABLE } from "@/lib/easing";
import type { VibeTag } from "@/lib/types";
import { useReducedMotion } from "@/lib/useReducedMotion";
import styles from "./VibeTags.module.css";

export interface VibeTagsProps {
  tags: VibeTag[];
  /** Draw the gold bars filling to each percentage on scroll. @default false */
  animate?: boolean;
  className?: string;
}

const FILL_DURATION = 1.4;
const FILL_STAGGER = 0.12;

export function VibeTags({ tags, animate = false, className }: VibeTagsProps) {
  const rootRef = useRef<HTMLUListElement | null>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !animate || reduced) return;

    setupGsap();
    const ctx = gsap.context(() => {
      const fills = Array.from(root.querySelectorAll<HTMLElement>("[data-pct]"));
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root, start: "top 85%", once: true },
      });
      fills.forEach((fill, i) => {
        const pct = Math.min(100, Math.max(0, Number(fill.dataset.pct) || 0)) / 100;
        tl.fromTo(
          fill,
          { scaleX: 0 },
          { scaleX: pct, duration: FILL_DURATION, ease: EASE_FABLE },
          i * FILL_STAGGER,
        );
      });
    }, root);

    return () => ctx.revert();
  }, [animate, reduced]);

  const classes = [styles.list, animate ? styles.bars : styles.compact, className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <ul ref={rootRef} className={classes}>
      {tags.map((tag) => (
        <li key={tag.label} className={styles.tag}>
          <span className={styles.label}>
            {"[ "}
            <span className={styles.pct}>{tag.pct}%</span> {tag.label}
            {" ]"}
          </span>
          {animate ? (
            <span className={styles.bar} aria-hidden="true">
              <span
                className={styles.fill}
                data-pct={tag.pct}
                style={{ "--pct": tag.pct / 100 } as CSSProperties}
              />
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
