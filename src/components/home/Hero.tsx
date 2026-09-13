"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { TransitionLink } from "@/components/gl/TransitionLink";
import { Film } from "@/components/motion/Film";
import { Magnetic } from "@/components/motion/Magnetic";
import { gsap, setupGsap } from "@/components/motion/gsapSetup";
import { TRUST } from "@/lib/content";
import { HERO_FILM, HERO_POSTER } from "@/lib/media";
import { useStore } from "@/lib/store";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import styles from "./Hero.module.css";

const LINES = ["The best week of your year,", "with twelve people who get it."];

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
        .fromTo(lines, { yPercent: 110, y: 0 }, { yPercent: 0, y: 0, duration: 1.1, ease: "fable", stagger: 0.1 }, 0.1)
        .fromTo(rest, { yPercent: 30, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, ease: "fable", stagger: 0.07 }, 0.45);
      gsap.fromTo(el.querySelector("[data-frame]"), { scale: 1, borderRadius: 0 }, { scale: 0.9, borderRadius: 28, ease: "none", scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: 0.6 } });
      gsap.to(el.querySelector("[data-copy]"), { yPercent: -18, opacity: 0, ease: "none", scrollTrigger: { trigger: el, start: "top top", end: "70% top", scrub: 0.6 } });
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
        <p className={`t-label ${styles.eyebrow}`} data-rise>Hosted group weeks · Bali · Thailand · Cape Town · Rio</p>
        <h1 className={`t-hero ${styles.title}`}>
          {LINES.map((l) => (
            <span key={l} className={styles.mask}>
              <span data-line className={styles.line}>{l}</span>
            </span>
          ))}
        </h1>
        <p className={`t-lead ${styles.sub}`} data-rise>
          One villa, one host who lives there, and eleven other travellers aged 25 to 40. Boat days, beach clubs and the nights in between, with everything at the table included.
        </p>
        <div className={styles.actions} data-rise>
          <Magnetic>
            <TransitionLink href="/trips" kind="dissolve" className="btn btn--light btn--lg">See the four weeks</TransitionLink>
          </Magnetic>
          <Link href="/#how" className={`btn btn--lg ${styles.ghost}`}>How it works</Link>
        </div>
        <ul className={styles.trust} data-rise aria-label="Why people trust us">
          {TRUST.map((t) => (
            <li key={t.label} className={styles.trustItem}>
              <span className={styles.trustValue}>{t.value}</span>
              <span className={styles.trustLabel}>{t.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
