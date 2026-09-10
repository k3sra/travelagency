"use client";

/**
 * The opening frame. Video, one line, one door. The intro waits for the
 * picture to move (or 900 ms, whichever comes first), then the eyebrow, the
 * tagline lines, the door and the scroll cue arrive in that order. Coming
 * back to the home page replays it faster, right as the curtain lifts.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, setupGsap } from "@/components/motion/gsapSetup";
import { TextReveal, type TextRevealHandle } from "@/components/motion/TextReveal";
import { transitions, usePageEnter } from "@/components/gl/transitionController";
import { EASE_FABLE } from "@/lib/easing";
import { getState } from "@/lib/store";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import { PillLink } from "@/components/ui/PillLink";
import { HeroVideo } from "./HeroVideo";
import styles from "./Hero.module.css";

const VIDEO_WAIT = 900;

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const eyebrow = useRef<HTMLParagraphElement>(null);
  const cta = useRef<HTMLDivElement>(null);
  const cue = useRef<HTMLDivElement>(null);
  const tagline = useRef<TextRevealHandle>(null);
  const played = useRef(false);
  // A deferred the video resolves once it is really moving (or has given up).
  const [videoReady] = useState(() => {
    let resolve: () => void = () => {};
    const promise = new Promise<void>((r) => {
      resolve = r;
    });
    return { promise, resolve };
  });

  const onVideoReady = useCallback(() => {
    videoReady.resolve();
  }, [videoReady]);

  const play = useCallback((fast: boolean) => {
    const els = [eyebrow.current, cta.current, cue.current];
    if (els.some((el) => !el)) return;
    setupGsap();
    if (prefersReducedMotion()) {
      gsap.set(els, { autoAlpha: 1, y: 0 });
      tagline.current?.play();
      transitions.markIntroDone();
      return;
    }
    const k = fast ? 0.6 : 1;
    const tl = gsap.timeline({
      defaults: { ease: EASE_FABLE },
      onComplete: () => transitions.markIntroDone(),
    });
    tl.fromTo(eyebrow.current, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 1.1 * k }, 0);
    tl.call(() => tagline.current?.play(), undefined, 0.15 * k);
    tl.fromTo(cta.current, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 1.2 * k }, 1.05 * k);
    tl.fromTo(cue.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.4 * k }, 1.7 * k);
  }, []);

  // First load: wait for the picture. Later entries: play as the curtain lifts.
  usePageEnter(() => {
    if (played.current) {
      play(true);
      return;
    }
    played.current = true;
    let done = false;
    const start = () => {
      if (done) return;
      done = true;
      play(false);
    };
    const timer = window.setTimeout(start, VIDEO_WAIT);
    videoReady.promise.then(() => {
      window.clearTimeout(timer);
      start();
    });
    // The intro may already have run in a previous visit this session.
    if (getState().introDone) {
      window.clearTimeout(timer);
      start();
    }
  });

  // Scroll: the copy drifts up and fades, the picture pushes in.
  useEffect(() => {
    const section = root.current;
    const copyEl = copy.current;
    if (!section || !copyEl) return;
    setupGsap();
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const media = section.querySelector<HTMLElement>("[data-hero-media]");
      gsap.to(copyEl, {
        yPercent: -30,
        autoAlpha: 0,
        ease: "none",
        scrollTrigger: { trigger: section, start: "top top", end: "70% top", scrub: true },
      });
      if (media) {
        gsap.fromTo(
          media,
          { scale: 1 },
          {
            scale: 1.08,
            ease: "none",
            scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: true },
          },
        );
      }
      ScrollTrigger.refresh();
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className={styles.hero} aria-label="Fable Travels" data-nav="dark">
      <div className={styles.media} data-hero-media>
        <HeroVideo onReady={onVideoReady} />
      </div>
      <div className={styles.scrimTop} aria-hidden="true" />
      <div className={styles.scrimBottom} aria-hidden="true" />

      <div ref={copy} className={`container ${styles.copy}`}>
        <p ref={eyebrow} className={`t-caps ${styles.eyebrow}`}>
          Fable Travels · Small-group journeys for grown-ups
        </p>
        <TextReveal as="h1" ref={tagline} trigger="manual" className={`t-display ${styles.tagline}`}>
          Write your own <em>legend.</em>
        </TextReveal>
        <div ref={cta} className={styles.cta}>
          <PillLink href="/journeys" kind="dissolve" variant="ghost" size="lg" label="Curate Your Journey" />
        </div>
      </div>

      <div ref={cue} className={styles.cue} aria-hidden="true">
        <span className={`t-caps ${styles.cueLabel}`}>Scroll</span>
        <span className={styles.cueLine} />
      </div>
    </section>
  );
}
