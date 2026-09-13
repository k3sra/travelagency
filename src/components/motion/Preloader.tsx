"use client";

/**
 * Once per session: the wordmark rises, a counter runs to 100, the plate
 * leaves upward. Sets introDone so the hero can start its own entrance.
 */

import { useEffect, useRef, useState } from "react";
import { gsap, setupGsap } from "@/components/motion/gsapSetup";
import { scrollControl } from "@/components/motion/SmoothScroll";
import { setState } from "@/lib/store";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import styles from "./Preloader.module.css";

const KEY = "fable-intro";

export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(KEY) === "1";
    } catch {}
    const el = root.current;
    if (seen || prefersReducedMotion() || !el) {
      setGone(true);
      setState({ introDone: true });
      return;
    }
    setupGsap();
    scrollControl.stop();
    const letters = el.querySelectorAll<HTMLElement>("[data-letter]");
    const counter = el.querySelector<HTMLElement>("[data-counter]");
    const n = { v: 0 };
    const tl = gsap.timeline({
      onComplete: () => {
        try {
          sessionStorage.setItem(KEY, "1");
        } catch {}
        scrollControl.start();
        setState({ introDone: true });
        setGone(true);
      },
    });
    tl.fromTo(letters, { yPercent: 110, y: 0 }, { yPercent: 0, y: 0, duration: 0.9, ease: "fable", stagger: 0.06 }, 0)
      .to(n, { v: 100, duration: 1.1, ease: "power2.out", onUpdate: () => { if (counter) counter.textContent = String(Math.round(n.v)).padStart(3, "0"); } }, 0.2)
      .to(letters, { yPercent: -110, duration: 0.6, ease: "power3.in", stagger: 0.03 }, 1.25)
      .to(el, { clipPath: "inset(0 0 100% 0)", duration: 0.9, ease: "cinematic" }, 1.35);
    return () => {
      tl.kill();
      scrollControl.start();
    };
  }, []);

  if (gone) return null;
  return (
    <div ref={root} className={styles.plate} aria-hidden="true">
      <p className={`t-hero ${styles.word}`}>
        {"FABLE".split("").map((c, i) => (
          <span key={i} className={styles.mask}>
            <span data-letter className={styles.letter}>{c}</span>
          </span>
        ))}
      </p>
      <p className={`t-label ${styles.count}`}>
        <span data-counter>000</span>
      </p>
    </div>
  );
}
