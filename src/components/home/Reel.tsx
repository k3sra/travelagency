"use client";

/**
 * The reel: a full-bleed film pinned for three screens while three lines of
 * the manifesto take turns over it. Scroll drives the film's slow push-in and
 * the copy swap (transform and opacity only); the film itself keeps playing.
 */

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, setupGsap } from "@/components/motion/gsapSetup";
import { Film } from "@/components/motion/Film";
import { MOMENTS_FILM, MOMENTS_POSTER } from "@/lib/media";
import { EASE_FABLE } from "@/lib/easing";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import styles from "./Reel.module.css";

const LINES = [
  ["Day one.", "Already a", "group chat."],
  ["Day four.", "Nobody has", "checked a phone."],
  ["Day nine.", "Already naming", "the next one."],
];

export function Reel() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = root.current;
    if (!section) return;
    setupGsap();
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const media = section.querySelector<HTMLElement>("[data-reel-media]");
      const lines = gsap.utils.toArray<HTMLElement>("[data-reel-line]", section);
      const stage = section.querySelector<HTMLElement>("[data-reel-stage]");
      if (!media || !stage || lines.length === 0) return;

      ScrollTrigger.create({ trigger: section, start: "top top", end: "bottom bottom", pin: stage, pinSpacing: false });
      gsap.fromTo(media, { scale: 1 }, { scale: 1.12, ease: "none", scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: true } });

      // Each line owns a third of the scroll: rise in, hold, drift out.
      const tl = gsap.timeline({ scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: 0.6 } });
      lines.forEach((line, i) => {
        const words = line.querySelectorAll<HTMLElement>("span");
        const at = i * 1;
        tl.fromTo(words, { yPercent: 110, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, stagger: 0.08, duration: 0.35, ease: EASE_FABLE }, at);
        if (i < lines.length - 1) tl.to(words, { yPercent: -60, autoAlpha: 0, stagger: 0.05, duration: 0.3, ease: "power2.in" }, at + 0.7);
      });
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className={styles.reel} aria-label="Fable in motion" data-nav="dark">
      <div className={styles.stage} data-reel-stage>
        <div className={styles.media} data-reel-media>
          <Film film={MOMENTS_FILM} poster={MOMENTS_POSTER} />
        </div>
        <div className={styles.scrim} aria-hidden="true" />
        <div className={`container ${styles.copy}`}>
          <p className={`t-caps ${styles.eyebrow}`}>How a Fable week goes</p>
          <div className={styles.lines}>
            {LINES.map((line) => (
              <p key={line.join(" ")} className={`t-display ${styles.line}`} data-reel-line>
                {line.map((part) => (
                  <span key={part} className={styles.word}>
                    {part}
                  </span>
                ))}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
