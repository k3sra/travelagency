"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { TransitionLink } from "@/components/gl/TransitionLink";
import { Film } from "@/components/motion/Film";
import { Magnetic } from "@/components/motion/Magnetic";
import { gsap, setupGsap } from "@/components/motion/gsapSetup";
import { HERO_FILM, HERO_POSTER } from "@/lib/media";
import { useStore } from "@/lib/store";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import styles from "./Hero.module.css";

const LINES = ["Best", "week", "of your year"];

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const introDone = useStore((s) => s.introDone);

  useEffect(() => {
    const el = root.current;
    if (!el || !introDone) return;
    setupGsap();
    const ctx = gsap.context(() => {
      const lines = el.querySelectorAll<HTMLElement>("[data-line]");
      const rest = el.querySelectorAll<HTMLElement>("[data-rise]");
      if (prefersReducedMotion()) {
        gsap.set([lines, rest], { yPercent: 0, y: 0, opacity: 1 });
        return;
      }
      gsap.timeline()
        .fromTo(lines, { yPercent: 110, y: 0 }, { yPercent: 0, y: 0, duration: 1.1, ease: "fable", stagger: 0.09 }, 0.1)
        .fromTo(rest, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, ease: "fable", stagger: 0.08 }, 0.5);
      // Leaving: the film shrinks into a rounded frame and the copy drifts up.
      gsap.fromTo(el.querySelector("[data-frame]"), { scale: 1, borderRadius: 0 }, { scale: 0.86, borderRadius: 28, ease: "none", scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: 0.6 } });
      gsap.to(el.querySelector("[data-copy]"), { yPercent: -25, opacity: 0, ease: "none", scrollTrigger: { trigger: el, start: "top top", end: "70% top", scrub: 0.6 } });
    }, el);
    return () => ctx.revert();
  }, [introDone]);

  return (
    <section ref={root} className={styles.hero} aria-label="FABLE" data-nav="dark">
      <div className={styles.frame} data-frame>
        <Film film={HERO_FILM} poster={HERO_POSTER} transitionHero />
        <div className={styles.scrim} aria-hidden="true" />
      </div>
      <div className={`container ${styles.copy}`} data-copy>
        <p className={`t-label ${styles.eyebrow}`} data-rise>Bali · Thailand · Cape Town · Rio</p>
        <h1 className={`t-hero ${styles.title}`}>
          {LINES.map((l, i) => (
            <span key={l} className={styles.mask}>
              <span data-line className={`${styles.line} ${i === LINES.length - 1 ? "t-sun" : ""}`}>{l}</span>
            </span>
          ))}
        </h1>
        <div className={styles.actions}>
          <div data-rise>
            <Magnetic>
              <TransitionLink href="/trips" kind="dissolve" className="btn btn--light btn--lg">Apply now</TransitionLink>
            </Magnetic>
          </div>
          <div data-rise>
            <Link href="/#how" className={`btn btn--lg ${styles.ghost}`}>How it works</Link>
          </div>
        </div>
      </div>
      <div className={styles.cue} aria-hidden="true">
        <span className={styles.cueLine} />
      </div>
    </section>
  );
}
