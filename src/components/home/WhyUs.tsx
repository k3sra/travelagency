"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, setupGsap } from "@/components/motion/gsapSetup";
import { PILLARS } from "@/lib/content";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import styles from "./WhyUs.module.css";

export function WhyUs() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    setupGsap();
    const ctx = gsap.context(() => {
      const cards = el.querySelectorAll<HTMLElement>("[data-pillar]");
      gsap.set(cards, { opacity: 0, y: 30 });
      ScrollTrigger.batch(cards, { start: "top 88%", once: true, onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, duration: 0.9, ease: "fable", stagger: 0.1 }) });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="why" className={`section ${styles.why}`} aria-labelledby="why-title">
      <div className={`container ${styles.inner}`}>
        <div className={styles.head}>
          <p className="t-label t-sun">Why FABLE</p>
          <h2 id="why-title" className={`t-h2 ${styles.title}`}>Four things we will not compromise on.</h2>
          <p className={`t-lead ${styles.lead}`}>We built the trip we could not find: small, hosted, honest about the price, and easy to walk away from if it is not for you.</p>
        </div>
        <ol className={styles.grid}>
          {PILLARS.map((p, i) => (
            <li key={p.title} className={`card ${styles.pillar}`} data-pillar>
              <span className={`t-label ${styles.num}`}>0{i + 1}</span>
              <h3 className={`t-h3 ${styles.pillarTitle}`}>{p.title}</h3>
              <p className={`t-body ${styles.pillarBody}`}>{p.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
