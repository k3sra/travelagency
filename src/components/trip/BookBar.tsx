"use client";

import { useEffect, useRef } from "react";
import { useBooking } from "@/components/booking/BookingProvider";
import { ScrollTrigger, setupGsap } from "@/components/motion/gsapSetup";
import type { Journey } from "@/lib/types";
import styles from "./BookBar.module.css";

export function BookBar({ trip }: { trip: Journey }) {
  const root = useRef<HTMLDivElement>(null);
  const booking = useBooking();

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    setupGsap();
    let pastHero = false;
    let atFooter = false;
    const apply = () => { el.dataset.shown = String(pastHero && !atFooter); };
    const a = ScrollTrigger.create({ trigger: "#trip-hero", start: "bottom top", end: "max", onToggle: (s) => { pastHero = s.isActive; apply(); } });
    const footer = document.querySelector("footer");
    const b = footer ? ScrollTrigger.create({ trigger: footer, start: "top bottom", end: "max", onToggle: (s) => { atFooter = s.isActive; apply(); } }) : null;
    return () => { a.kill(); b?.kill(); };
  }, []);

  const spots = trip.spotsRemaining;
  return (
    <div ref={root} className={styles.bar} data-shown="false">
      <div className={styles.pill}>
        <span className={styles.title}>{trip.title}</span>
        <span className={`t-label ${styles.spots}`}>[ {spots} {spots === 1 ? "spot" : "spots"} left ]</span>
        <button type="button" className={`btn ${styles.btn}`} onClick={() => booking.open(trip.slug)}>Secure your seat</button>
      </div>
    </div>
  );
}
