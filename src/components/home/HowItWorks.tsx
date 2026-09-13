"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { TransitionLink } from "@/components/gl/TransitionLink";
import { gsap, ScrollTrigger, setupGsap } from "@/components/motion/gsapSetup";
import { TILES } from "@/lib/media";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import styles from "./HowItWorks.module.css";

const STEPS = [
  { n: "01", title: "Apply", line: "Two minutes. Tell us how you like a day to go.", tile: TILES[1], cls: "night" },
  { n: "02", title: "We match you", line: "Twelve people who move like you. A host who runs it.", tile: TILES[4], cls: "sun" },
  { n: "03", title: "Show up", line: "Land. Drop the bags. Straight into the pool.", tile: TILES[7], cls: "sea" },
];

export function HowItWorks() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    setupGsap();
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 900px)", () => {
        const stage = el.querySelector<HTMLElement>("[data-stage]");
        const cards = el.querySelectorAll<HTMLElement>("[data-card]");
        if (!stage) return;
        ScrollTrigger.create({ trigger: el, start: "top top", end: "bottom bottom", pin: stage, pinSpacing: false });
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: 0.6 } });
        cards.forEach((card, i) => {
          if (i === 0) return;
          tl.fromTo(card, { yPercent: 110 }, { yPercent: 0, ease: "none", duration: 1 }, (i - 1) * 1);
          tl.to(cards[i - 1], { scale: 0.94, ease: "none", duration: 1 }, (i - 1) * 1);
        });
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="how" className={styles.how} aria-labelledby="how-title">
      <div className={styles.stage} data-stage>
        <div className={`container ${styles.head}`}>
          <p className="t-label t-sun">How it works</p>
          <h2 id="how-title" className="visually-hidden">How it works</h2>
        </div>
        <div className={styles.deck}>
          {STEPS.map((s, i) => (
            <article key={s.n} className={`${styles.card} ${styles[s.cls]}`} data-card style={{ "--i": String(i) } as React.CSSProperties}>
              <span className={`t-hero ${styles.index}`} aria-hidden="true">{s.n}</span>
              <div className={styles.body}>
                <h3 className={`t-display ${styles.title}`}>{s.title}</h3>
                <p className={`t-lead ${styles.line}`}>{s.line}</p>
                {i === STEPS.length - 1 ? (
                  <TransitionLink href="/trips" kind="dissolve" className="btn btn--light btn--lg">Apply now</TransitionLink>
                ) : null}
              </div>
              <div className={styles.tile}>
                <Image src={s.tile.src} alt="" width={s.tile.width} height={s.tile.height} sizes="(max-width: 899px) 60vw, 26vw" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
