"use client";

import { useEffect, useRef } from "react";
import { Film } from "@/components/motion/Film";
import { gsap, ScrollTrigger, setupGsap } from "@/components/motion/gsapSetup";
import { MOMENTS_FILM, MOMENTS_POSTER } from "@/lib/media";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import styles from "./Reel.module.css";

const LINES = [
  ["Day one.", "A group chat."],
  ["Day four.", "Nobody checked", "a phone."],
  ["Day seven.", "Already planning", "the next one."],
];

export function Reel() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    setupGsap();
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const stage = el.querySelector<HTMLElement>("[data-stage]");
      const media = el.querySelector<HTMLElement>("[data-media]");
      const lines = el.querySelectorAll<HTMLElement>("[data-line]");
      if (!stage || !media) return;
      ScrollTrigger.create({ trigger: el, start: "top top", end: "bottom bottom", pin: stage, pinSpacing: false });
      gsap.fromTo(media, { scale: 1 }, { scale: 1.12, ease: "none", scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: true } });
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: 0.6 } });
      lines.forEach((line, i) => {
        const words = line.querySelectorAll<HTMLElement>("span");
        tl.fromTo(words, { yPercent: 110, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, stagger: 0.08, duration: 0.35, ease: "fable" }, i);
        if (i < lines.length - 1) tl.to(words, { yPercent: -60, autoAlpha: 0, stagger: 0.05, duration: 0.3, ease: "power2.in" }, i + 0.7);
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className={styles.reel} aria-label="How a week goes" data-nav="dark">
      <div className={styles.stage} data-stage>
        <div className={styles.media} data-media>
          <Film film={MOMENTS_FILM} poster={MOMENTS_POSTER} />
        </div>
        <div className={styles.scrim} aria-hidden="true" />
        <div className={`container ${styles.copy}`}>
          <p className={`t-label ${styles.eyebrow}`}>How a week goes</p>
          <div className={styles.lines}>
            {LINES.map((line) => (
              <p key={line.join(" ")} className={`t-display ${styles.line}`} data-line>
                {line.map((part) => (
                  <span key={part} className={styles.word}>{part}</span>
                ))}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
