"use client";

import { useEffect, useRef } from "react";
import { TransitionLink } from "@/components/gl/TransitionLink";
import { Magnetic } from "@/components/motion/Magnetic";
import { gsap, setupGsap } from "@/components/motion/gsapSetup";
import { getTrips } from "@/lib/journeys";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import styles from "./Closing.module.css";

export function Closing() {
  const root = useRef<HTMLElement>(null);
  const trips = getTrips();

  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    setupGsap();
    const ctx = gsap.context(() => {
      gsap.fromTo(el.querySelector("[data-big]"), { scale: 0.7, opacity: 0.4 }, { scale: 1, opacity: 1, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "center center", scrub: 0.5 } });
    }, el);
    return () => ctx.revert();
  }, []);

  const names = [...trips, ...trips];
  return (
    <section ref={root} className={styles.closing} aria-labelledby="closing-title">
      <div className={styles.marquee} aria-hidden="true">
        <div className={styles.track}>
          {names.map((t, i) => (
            <span key={i} className={`t-display t-outline ${styles.name}`}>{t.title}<span className={styles.dot} /></span>
          ))}
        </div>
      </div>
      <div className={`container ${styles.inner}`}>
        <h2 id="closing-title" className={`t-hero ${styles.big}`} data-big>Your week starts with a two-minute application.</h2>
        <p className={`t-lead ${styles.reassure}`}>No payment to apply. A deposit only once you are in, refundable for fourteen days.</p>
        <div className={styles.cta}>
          <Magnetic>
            <TransitionLink href="/trips" kind="dissolve" className="btn btn--lg">Pick a week</TransitionLink>
          </Magnetic>
          <p className={`t-label ${styles.next}`}>Next departure · {trips[0].title}, {trips[0].dates}</p>
        </div>
      </div>
    </section>
  );
}
