"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap, ScrollTrigger, setupGsap } from "@/components/motion/gsapSetup";
import { TILES } from "@/lib/media";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import styles from "./Hook.module.css";

const WORDS = "Group travel for people who do not do group travel. No name badges, no coach, no forced fun. One good house, one host who knows the place, and a week that runs at your speed.".split(" ");
const FLOATS = [
  { tile: TILES[0], cls: "a", y: 30, r: -6 },
  { tile: TILES[3], cls: "b", y: -40, r: 4 },
  { tile: TILES[6], cls: "c", y: 20, r: -3 },
];

export function Hook() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    setupGsap();
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const stage = el.querySelector<HTMLElement>("[data-stage]");
      const words = el.querySelectorAll<HTMLElement>("[data-word]");
      ScrollTrigger.create({ trigger: el, start: "top top", end: "bottom bottom", pin: stage, pinSpacing: false });
      gsap.to(words, { color: "var(--ink)", opacity: 1, ease: "none", stagger: 0.03, scrollTrigger: { trigger: el, start: "top top", end: "85% bottom", scrub: 0.4 } });
      el.querySelectorAll<HTMLElement>("[data-float]").forEach((f) => {
        gsap.fromTo(f, { yPercent: Number(f.dataset.y) * -1 }, { yPercent: Number(f.dataset.y), ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className={styles.hook} aria-label="What FABLE is">
      <div className={styles.stage} data-stage>
        {FLOATS.map((f) => (
          <div key={f.cls} className={`${styles.float} ${styles[f.cls]}`} data-float data-y={f.y} style={{ "--r": `${f.r}deg` } as React.CSSProperties} aria-hidden="true">
            <Image src={f.tile.src} alt="" width={f.tile.width} height={f.tile.height} sizes="20vw" />
          </div>
        ))}
        <div className={styles.inner}>
          <p className={`t-label t-sun ${styles.eyebrow}`}>What this is</p>
          <p className={`t-display ${styles.text}`}>
            {WORDS.map((w, i) => (
              <span key={i} data-word className={styles.word}>{w} </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
