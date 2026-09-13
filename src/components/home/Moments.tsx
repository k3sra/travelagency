"use client";

/**
 * Moments: candid stills of travellers mid-trip. On wide screens the strip is
 * pinned and scrubbed sideways by the scroll (transform only); on phones it is
 * a native swipe row with snap points, so the same photographs stay a thumb
 * away. A proof band underneath does the quiet selling.
 */

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, setupGsap } from "@/components/motion/gsapSetup";
import { FocusReveal } from "@/components/motion/FocusReveal";
import { TextReveal } from "@/components/motion/TextReveal";
import { moment } from "@/lib/media";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import styles from "./Moments.module.css";

const MOMENTS = [
  { n: 1, wide: false, day: "Day 2", line: "Off the back of the boat, in that order." },
  { n: 2, wide: true, day: "Day 3", line: "The rooftop nobody wanted to leave." },
  { n: 3, wide: false, day: "Day 4", line: "Windows down. Playlist argued over." },
  { n: 4, wide: true, day: "Day 5", line: "Somebody's birthday. Nobody's plan." },
  { n: 5, wide: false, day: "Day 6", line: "The fire went on until it didn't." },
  { n: 6, wide: true, day: "Day 7", line: "Top of the world, on foot, before ten." },
  { n: 7, wide: false, day: "Day 8", line: "The pool at the hour it turns gold." },
  { n: 8, wide: true, day: "Last night", line: "One long table. Next trip already named." },
];

const PROOF = [
  { value: "32", label: "Average age, last season" },
  { value: "10", label: "Seats per departure" },
  { value: "1 in 3", label: "Book again within a year" },
  { value: "0", label: "Name badges, ever" },
];

export function Moments() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = root.current;
    if (!section) return;
    setupGsap();
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 900px)", () => {
        const stage = section.querySelector<HTMLElement>("[data-moments-stage]");
        const track = section.querySelector<HTMLElement>("[data-moments-track]");
        if (!stage || !track) return;
        const distance = () => Math.max(0, track.scrollWidth - stage.clientWidth);
        gsap.fromTo(track, { x: 0 }, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: 0.8, invalidateOnRefresh: true },
        });
        ScrollTrigger.create({ trigger: section, start: "top top", end: "bottom bottom", pin: stage, pinSpacing: false });
      });
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="moments" className={`${styles.section} grain`} aria-labelledby="moments-title" data-nav="dark">
      <div className={styles.stage} data-moments-stage>
        <div className={`container ${styles.head}`}>
          <p className={`t-caps ${styles.eyebrow}`}>Proof of life</p>
          <TextReveal as="h2" id="moments-title" className={`t-display ${styles.title}`}>
            This is what <em>day four</em> looks like.
          </TextReveal>
        </div>

        <div className={styles.viewport} data-lenis-prevent-touch>
          <ul className={styles.track} data-moments-track>
            {MOMENTS.map((m, i) => (
              <li key={m.n} className={`${styles.cell} ${m.wide ? styles.cellWide : styles.cellTall}`} style={{ "--i": String(i) } as React.CSSProperties}>
                <FocusReveal
                  image={moment(m.n, m.line, m.wide)}
                  ratio={m.wide ? "8 / 5" : "4 / 5"}
                  sizes={m.wide ? "(max-width: 899px) 82vw, 44vw" : "(max-width: 899px) 68vw, 28vw"}
                  scrub={false}
                  className={styles.frame}
                />
                <p className={styles.cap}>
                  <span className={`t-caps ${styles.day}`}>{m.day}</span>
                  <span className={styles.line}>{m.line}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>

        <dl className={`container ${styles.proof}`}>
          {PROOF.map((p) => (
            <div key={p.label} className={styles.stat}>
              <dd className={`t-display ${styles.value}`}>{p.value}</dd>
              <dt className={`t-caps ${styles.label}`}>{p.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
