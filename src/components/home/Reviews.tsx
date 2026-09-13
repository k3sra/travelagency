"use client";

import { TextReveal } from "@/components/motion/TextReveal";
import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap, ScrollTrigger, setupGsap } from "@/components/motion/gsapSetup";
import { REVIEWS } from "@/lib/content";
import { portrait } from "@/lib/media";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import styles from "./Reviews.module.css";

const FACES = [1, 2, 3];

export function Reviews() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    setupGsap();
    const ctx = gsap.context(() => {
      const cards = el.querySelectorAll<HTMLElement>("[data-review]");
      gsap.set(cards, { opacity: 0, y: 30, rotate: (i: number) => (i % 2 ? 1.5 : -1.5) });
      ScrollTrigger.batch(cards, { start: "top 88%", once: true, onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, rotate: 0, duration: 0.9, ease: "fable", stagger: 0.12 }) });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="reviews" className={`section ${styles.reviews}`} aria-labelledby="reviews-title">
      <div className={`container ${styles.inner}`}>
        <div className={styles.head}>
          <p className="t-label t-sun">From the group chat</p>
          <TextReveal as="h2" id="reviews-title" className={`t-h2 ${styles.title}`}>What people say when they get home.</TextReveal>
        </div>
        <ul className={styles.rail} data-lenis-prevent-touch>
          {REVIEWS.map((r, i) => (
            <li key={r.name} className={`card ${styles.review}`} data-review>
              <p className={styles.stars} aria-label={`${r.stars} out of 5`}>
                {Array.from({ length: r.stars }, (_, k) => (
                  <svg key={k} viewBox="0 0 24 24" className={styles.star} aria-hidden="true"><path d="M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.8L12 17.7 6 21l1.3-6.8-5-4.7 6.8-.8z" /></svg>
                ))}
              </p>
              <blockquote className={`t-lead ${styles.quote}`}>{r.quote}</blockquote>
              <footer className={styles.who}>
                <Image src={portrait(FACES[i])} alt="" width={96} height={96} className={styles.avatar} />
                <span>
                  <span className={styles.name}>{r.name}, {r.from}</span>
                  <span className={`t-label ${styles.trip}`}>{r.trip}</span>
                </span>
              </footer>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
