"use client";

import { TextReveal } from "@/components/motion/TextReveal";
import { useEffect, useRef } from "react";
import Image from "next/image";
import { TransitionLink } from "@/components/gl/TransitionLink";
import { LiveFilm } from "@/components/motion/LiveFilm";
import { Countdown } from "@/components/motion/Countdown";
import { useTilt } from "@/components/motion/useTilt";
import { gsap, ScrollTrigger, setupGsap } from "@/components/motion/gsapSetup";
import { formatPrice, getTrips } from "@/lib/journeys";
import { getFilm } from "@/lib/media";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import styles from "./TripsRail.module.css";

function RailCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLLIElement>(null);
  useTilt(ref, 4);
  return <li ref={ref} className={styles.card}>{children}</li>;
}

export function TripsRail() {
  const root = useRef<HTMLElement>(null);
  const trips = getTrips();

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    setupGsap();
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 900px)", () => {
        const stage = el.querySelector<HTMLElement>("[data-stage]");
        const track = el.querySelector<HTMLElement>("[data-track]");
        const bar = el.querySelector<HTMLElement>("[data-bar]");
        if (!stage || !track) return;
        const dist = () => Math.max(0, track.scrollWidth - stage.clientWidth + parseFloat(getComputedStyle(stage).paddingLeft) * 2);
        ScrollTrigger.create({ trigger: el, start: "top top", end: "bottom bottom", pin: stage, pinSpacing: false });
        gsap.fromTo(track, { x: 0 }, { x: () => -dist(), ease: "none", scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: 0.8, invalidateOnRefresh: true } });
        if (bar) gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: 0.8 } });
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="trips" className={styles.rail} aria-labelledby="trips-title" data-mood="white">
      <div className={styles.stage} data-stage>
        <div className={`container ${styles.head}`}>
          <p className="t-label t-sun">Four weeks a year</p>
          <TextReveal as="h2" id="trips-title" className={`t-h2 ${styles.title}`}>Pick your week.</TextReveal>
          <p className={`t-body ${styles.lead}`}>Eight days, twelve travellers, one host. Everything at the table is included. Tap a week for the full day by day.</p>
          <div className={styles.progress} aria-hidden="true"><span className={styles.bar} data-bar /></div>
          <p className={`t-label ${styles.hint}`}>Swipe</p>
        </div>
        <div className={styles.viewport} data-lenis-prevent-touch>
        <ul className={styles.track} data-track>
          {trips.map((t) => (
            <RailCard key={t.slug}>
              <TransitionLink
                href={`/trips/${t.slug}`}
                kind={t.transition}
                to={t.hero.src}
                toNarrow={t.heroTall.src}
                className={styles.link}
                data-cursor="view"
                data-cursor-label="See the week"
                aria-label={`${t.title}: ${t.subtitle}`}
              >
                <span className={styles.media}>
                  <Image src={t.card.src} alt={t.card.alt} fill sizes="(max-width: 899px) 82vw, 62vw" className={styles.img} data-transition-hero={t.hero.src} />
                  <LiveFilm film={getFilm(t.slug)} />
                  <span className={styles.scrim} aria-hidden="true" />
                </span>
                <span className={`${styles.chip} ${styles.intent}`}>{t.intent}</span>
                <span className={`t-label ${styles.spots} ${t.spotsRemaining <= 2 ? styles.pulse : ""}`}>[ {t.spotsRemaining} {t.spotsRemaining === 1 ? "spot" : "spots"} left ]</span>
                <span className={styles.copy}>
                  <span className={`t-display ${styles.name}`}>{t.title}</span>
                  <span className={styles.sub}>{t.subtitle}</span>
                  <span className={`t-label ${styles.meta}`}>{t.dates} · {t.durationDays} days · from {formatPrice(t.price.amount)}</span>
                  <Countdown startDate={t.startDate} className={`t-label ${styles.count}`} />
                  <span className={styles.more}>See the full week</span>
                </span>
              </TransitionLink>
            </RailCard>
          ))}
        </ul>
        </div>
      </div>
    </section>
  );
}
