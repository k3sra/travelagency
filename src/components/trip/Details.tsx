"use client";

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
          gsap.to(batch.map((b) => (b as HTMLElement).querySelector("[data-check]")), { strokeDashoffset: 0, duration: 0.6, ease: "fable", stagger: 0.08, delay: 0.15 });
        },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  const spots = trip.spotsRemaining;
  return (
    <section ref={root} id="details" className={`section ${styles.details}`} aria-labelledby="details-title">
      <div className={`container ${styles.grid}`}>
        <div>
          <p className="t-label t-sun">Included</p>
          <h2 id="details-title" className={`t-h2 ${styles.title}`}>What is in.</h2>
          <ul className={styles.list}>
            {trip.inclusions.map((line) => (
              <li key={line} className={styles.item} data-item>
                <svg className={styles.check} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 12.5l5 5L20 6.5" strokeDasharray={24} data-check />
                </svg>
                <span className="t-lead">{line}</span>
              </li>
            ))}
          </ul>
        </div>
        <aside className={styles.panel} aria-label="Price">
          <p className={`t-label ${styles.muted}`}>Per person</p>
          <p className={`t-display ${styles.price}`}>{formatPrice(trip.price.amount)}</p>
          <hr className={styles.rule} />
          <p className={styles.line}>Deposit {formatPrice(trip.price.deposit)} today</p>
          <p className={styles.line}>Balance 60 days before</p>
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
