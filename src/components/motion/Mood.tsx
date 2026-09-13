"use client";

import { useEffect } from "react";
import { gsap, ScrollTrigger, setupGsap } from "@/components/motion/gsapSetup";
import { prefersReducedMotion } from "@/lib/useReducedMotion";

const COLORS: Record<string, string> = { white: "#ffffff", soft: "#f4f1ec", tint: "#fff3ea", sea: "#eafafc" };

/** The page ground drifts between warm whites as sections with data-mood scroll into view. */
export function Mood() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    setupGsap();
    const body = document.body;
    const triggers = Array.from(document.querySelectorAll<HTMLElement>("[data-mood]")).map((el) =>
      ScrollTrigger.create({
        trigger: el,
        start: "top 60%",
        end: "bottom 40%",
        onToggle: (self) => {
          if (self.isActive) gsap.to(body, { backgroundColor: COLORS[el.dataset.mood ?? "white"] ?? COLORS.white, duration: 0.9, ease: "power2.out", overwrite: true });
        },
      }),
    );
    return () => {
      triggers.forEach((t) => t.kill());
      gsap.set(body, { clearProps: "backgroundColor" });
    };
  }, []);
  return null;
}
