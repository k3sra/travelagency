"use client";

import { useEffect, useRef } from "react";
import { useBooking } from "@/components/booking/BookingProvider";
import { Countdown } from "@/components/motion/Countdown";
import { Film } from "@/components/motion/Film";
import { Magnetic } from "@/components/motion/Magnetic";
import { gsap, setupGsap } from "@/components/motion/gsapSetup";
import { formatPrice } from "@/lib/journeys";
import { getFilm } from "@/lib/media";
import type { Journey } from "@/lib/types";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import styles from "./TripHero.module.css";

export function TripHero({ trip }: { trip: Journey }) {
  const root = useRef<HTMLElement>(null);
  const booking = useBooking();

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    setupGsap();
    const ctx = gsap.context(() => {
      const lines = el.querySelectorAll<HTMLElement>("[data-line]");
      const rest = el.querySelectorAll<HTMLElement>("[data-rise]");
      if (prefersReducedMotion()) {
        gsap.set([lines, rest], { yPercent: 0, y: 0, opacity: 1 });
        return;
      }
      gsap.timeline({ delay: 0.25 })
        .fromTo(lines, { yPercent: 110, y: 0 }, { yPercent: 0, y: 0, duration: 1, ease: "fable", stagger: 0.08 }, 0)
        .fromTo(rest, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8, ease: "fable", stagger: 0.06 }, 0.3);
      gsap.fromTo(el.querySelector("[data-frame]"), { scale: 1, borderRadius: 0 }, { scale: 0.9, borderRadius: 28, ease: "none", scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: 0.6 } });
      gsap.to(el.querySelector("[data-copy]"), { yPercent: -20, opacity: 0, ease: "none", scrollTrigger: { trigger: el, start: "top top", end: "70% top", scrub: 0.6 } });
    }, el);
    return () => ctx.revert();
  }, []);

  const spots = trip.spotsRemaining;
  return (
    <section ref={root} id="trip-hero" className={styles.hero} aria-labelledby="trip-title" data-nav="dark">
      <div className={styles.frame} data-frame>
        <Film film={getFilm(trip.slug)} poster={{ wide: trip.hero.src, wideBlur: trip.hero.blur, tall: trip.heroTall.src, tallBlur: trip.heroTall.blur }} transitionHero />
        <div className={styles.scrim} aria-hidden="true" />
      </div>
      <div className={`container ${styles.copy}`} data-copy>
        <div className={styles.text}>
          <p className={`t-label ${styles.eyebrow}`} data-rise>{trip.country} · {trip.region}</p>
          <h1 id="trip-title" className={`t-hero ${styles.title}`}>
            <span className={styles.mask}><span data-line className={styles.line}>{trip.title}</span></span>
          </h1>
          <p className={`t-lead ${styles.sub}`} data-rise>{trip.subtitle}</p>
          <p className={`t-body ${styles.who}`} data-rise>{trip.forWho}</p>
          <ul className={styles.chips} data-rise aria-label="Key facts">
            <li className={styles.chip}>{trip.dates}</li>
            <li className={styles.chip}>{trip.durationDays} days</li>
            <li className={styles.chip}>12 people</li>
            <li className={styles.chip}>from {formatPrice(trip.price.amount)}</li>
            <li className={`${styles.chip} ${styles.chipSun}`}><Countdown startDate={trip.startDate} /></li>
          </ul>
        </div>
        <div className={styles.cta} data-rise>
          <Magnetic>
            <button type="button" className="btn btn--light btn--lg" onClick={() => booking.open(trip.slug)}>Secure your seat</button>
          </Magnetic>
          <p className={`t-label ${styles.spots} ${spots <= 2 ? styles.pulse : ""}`}>[ {spots} {spots === 1 ? "spot" : "spots"} left ]</p>
        </div>
      </div>
    </section>
  );
}
