"use client";

import { useEffect, useRef } from "react";
import { TransitionLink } from "@/components/gl/TransitionLink";
import { ScrollTrigger, setupGsap } from "@/components/motion/gsapSetup";
import { getTrips } from "@/lib/journeys";
import styles from "./MobileCta.module.css";

/** Phones only: a pill that rises once the hero is gone and hides at the footer. */
export function MobileCta() {
  const root = useRef<HTMLDivElement>(null);
  const next = getTrips().reduce((a, b) => (a.spotsRemaining <= b.spotsRemaining ? a : b));

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    setupGsap();
    let past = false;
    let atFooter = false;
    const apply = () => { el.dataset.shown = String(past && !atFooter); };
    const a = ScrollTrigger.create({ start: "80% top", end: "max", trigger: "main > section:first-of-type", onToggle: (s) => { past = s.isActive; apply(); } });
    const footer = document.querySelector("footer");
    const b = footer ? ScrollTrigger.create({ trigger: footer, start: "top bottom", end: "max", onToggle: (s) => { atFooter = s.isActive; apply(); } }) : null;
    return () => { a.kill(); b?.kill(); };
  }, []);

  return (
    <div ref={root} className={styles.bar} data-shown="false">
      <TransitionLink href="/trips" kind="dissolve" className={styles.pill}>
        <span className={styles.text}>
          <span className={styles.main}>See the four weeks</span>
          <span className={styles.sub}>{next.title} · {next.spotsRemaining} {next.spotsRemaining === 1 ? "spot" : "spots"} left</span>
        </span>
        <span className={styles.arrow} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </span>
      </TransitionLink>
    </div>
  );
}
