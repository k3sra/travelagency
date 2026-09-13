"use client";

import { TextReveal } from "@/components/motion/TextReveal";
import { useEffect, useRef } from "react";
import { useBooking } from "@/components/booking/BookingProvider";
import { Magnetic } from "@/components/motion/Magnetic";
import { gsap, ScrollTrigger, setupGsap } from "@/components/motion/gsapSetup";
import { formatPrice } from "@/lib/journeys";
import type { Journey } from "@/lib/types";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import styles from "./Details.module.css";

export function Details({ trip }: { trip: Journey }) {
  const root = useRef<HTMLElement>(null);
  const booking = useBooking();

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    setupGsap();
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const items = el.querySelectorAll<HTMLElement>("[data-item]");
      gsap.set(items, { opacity: 0, y: 16 });
      gsap.set(el.querySelectorAll("[data-check]"), { strokeDashoffset: 24 });
      ScrollTrigger.batch(items, {
        start: "top 88%",
        once: true,
        onEnter: (batch) => {
          gsap.to(batch, { opacity: 1, y: 0, duration: 0.7, ease: "fable", stagger: 0.08 });
          const checks = batch.map((b) => (b as HTMLElement).querySelector("[data-check]")).filter(Boolean);
          if (checks.length) gsap.to(checks, { strokeDashoffset: 0, duration: 0.6, ease: "fable", stagger: 0.08, delay: 0.15 });
        },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  const spots = trip.spotsRemaining;
  return (
    <section ref={root} id="details" className={`section ${styles.details}`} aria-labelledby="details-title">
      <div className={`container ${styles.grid}`}>
        <div className={styles.lists}>
          <div>
            <p className="t-label t-sun">The short version</p>
            <TextReveal as="h2" id="details-title" className={`t-h2 ${styles.title}`}>Three things you will actually do.</TextReveal>
            <ul className={styles.list}>
              {trip.highlights.map((line) => (
                <li key={line} className={styles.item} data-item>
                  <svg className={styles.check} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 12.5l5 5L20 6.5" strokeDasharray={24} data-check />
                  </svg>
                  <span className="t-lead">{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.cols}>
            <div>
              <h3 className={`t-h3 ${styles.subhead}`}>What is included</h3>
              <ul className={styles.plain}>
                {trip.inclusions.map((line) => (
                  <li key={line} className={styles.plainItem} data-item>
                    <span className={styles.tick} aria-hidden="true" />
                    <span className="t-body">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className={`t-h3 ${styles.subhead}`}>What is not</h3>
              <ul className={styles.plain}>
                {trip.notIncluded.map((line) => (
                  <li key={line} className={styles.plainItem} data-item>
                    <span className={`${styles.tick} ${styles.cross}`} aria-hidden="true" />
                    <span className={`t-body ${styles.muted}`}>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <aside className={styles.panel} aria-label="Price">
          <p className={`t-label ${styles.panelMuted}`}>{trip.dates} · {trip.durationDays} days</p>
          <p className={`t-display ${styles.price}`}>{formatPrice(trip.price.amount)}</p>
          <p className={styles.line}>per person, own room, everything at the table included</p>
          <hr className={styles.rule} />
          <p className={styles.line}>Deposit {formatPrice(trip.price.deposit)} to hold your seat</p>
          <p className={styles.line}>Balance {formatPrice(trip.price.amount - trip.price.deposit)} due 60 days before departure</p>
          <p className={styles.line}>Group of {trip.groupMax} · ages 25 to 40 · hosted by {trip.curator.name}</p>
          <p className={`t-label ${styles.risk}`}>Free cancellation for 14 days · No booking fees</p>
          <Magnetic>
            <button type="button" className={`btn btn--sun btn--lg ${styles.cta}`} onClick={() => booking.open(trip.slug)}>Secure your seat</button>
          </Magnetic>
          <p className={`t-label ${styles.spots} ${spots <= 2 ? styles.pulse : ""}`}>[ {spots} {spots === 1 ? "spot" : "spots"} left ]</p>
        </aside>
      </div>
    </section>
  );
}
