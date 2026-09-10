"use client";

/**
 * The sticky booking bar. Fixed to the bottom edge beneath the nav, it rises
 * once the header has scrolled away (one ScrollTrigger toggling a class;
 * transform and opacity only) and steps aside while the drawer is open or
 * when the footer arrives.
 */

import { useEffect, useState } from "react";
import { useBooking } from "@/components/booking/BookingProvider";
import { gsap, ScrollTrigger, setupGsap } from "@/components/motion/gsapSetup";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { useStore } from "@/lib/store";
import type { Journey } from "@/lib/types";
import { JOURNEY_HEADER_ID } from "./JourneyHeader";
import { Scarcity } from "./Scarcity";
import styles from "./SecureSpot.module.css";

export interface SecureSpotProps {
  journey: Pick<Journey, "slug" | "title" | "dates" | "spotsRemaining">;
  /** Id of the header whose exit reveals the bar. */
  headerId?: string;
}

export function SecureSpot({ journey, headerId = JOURNEY_HEADER_ID }: SecureSpotProps) {
  const { open } = useBooking();
  const drawerOpen = useStore((s) => s.drawerOpen);
  const [pastHeader, setPastHeader] = useState(false);

  useEffect(() => {
    setupGsap();
    const header = document.getElementById(headerId);
    const footer = document.querySelector("footer");

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: header ?? document.body,
        start: header ? "bottom 30%" : () => window.innerHeight * 0.7,
        endTrigger: footer ?? undefined,
        end: footer ? "top 92%" : "max",
        onToggle: (self) => setPastHeader(self.isActive),
      });
    });

    return () => ctx.revert();
  }, [headerId]);

  const shown = pastHeader && !drawerOpen;

  return (
    <aside className={`${styles.bar} ${shown ? styles.shown : ""}`} aria-label="Secure your spot">
      <div className={styles.inner}>
        <p className={`t-caps ${styles.label}`}>
          <span className={styles.title}>{journey.title}</span>
          <span className={styles.dates}> · {journey.dates}</span>
        </p>
        <Scarcity n={journey.spotsRemaining} className={styles.scarcity} />
        <MagneticButton
          variant="gold"
          label="Secure Your Spot"
          className={styles.button}
          onClick={() => open(journey.slug)}
        />
      </div>
    </aside>
  );
}
