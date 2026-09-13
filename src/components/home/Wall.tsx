"use client";

import { TextReveal } from "@/components/motion/TextReveal";
import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap, ScrollTrigger, setupGsap } from "@/components/motion/gsapSetup";
import { TILES } from "@/lib/media";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import styles from "./Wall.module.css";

function Row({ tiles, idx }: { tiles: typeof TILES; idx: number }) {
  return (
    <div className={styles.rowMask}>
      <div className={styles.row} data-row>
        {[...tiles, ...tiles].map((t, i) => (
          <div key={`${idx}-${i}`} className={styles.tile} style={{ "--ar": `${t.width} / ${t.height}` } as React.CSSProperties}>
            <Image src={t.src} alt="" width={t.width} height={t.height} sizes="(max-width: 899px) 40vw, 24vw" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Wall() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    setupGsap();
    const ctx = gsap.context(() => {
      const rows = el.querySelectorAll<HTMLElement>("[data-row]");
      const tweens = Array.from(rows).map((row, i) => gsap.fromTo(row, { xPercent: i === 0 ? 0 : -50 }, { xPercent: i === 0 ? -50 : 0, ease: "none", duration: i === 0 ? 40 : 46, repeat: -1 }));
      let speed = 1;
      ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const target = 1 + Math.min(Math.abs(self.getVelocity()) / 1500, 3);
          speed = target;
          tweens.forEach((t) => t.timeScale(speed));
        },
      });
      const decay = gsap.ticker.add(() => {
        if (speed > 1) {
          speed = Math.max(1, speed - 0.02);
          tweens.forEach((t) => t.timeScale(speed));
        }
      });
      return () => {
        gsap.ticker.remove(decay as unknown as () => void);
      };
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className={styles.wall} aria-label="Real weeks">
      <div className={`container ${styles.head}`}>
        <p className="t-label t-sun">Real weeks, real people</p>
        <TextReveal as="h2" className={`t-h2 ${styles.title}`}>This is what day four looks like.</TextReveal>
        <p className={`t-body ${styles.lead}`}>Shot on phones by people on the trip, not by an agency. Nobody was asked to pose.</p>
      </div>
      <div className={styles.rows}>
        <Row tiles={TILES.slice(0, 6)} idx={0} />
        <Row tiles={TILES.slice(6, 12)} idx={1} />
      </div>
    </section>
  );
}
