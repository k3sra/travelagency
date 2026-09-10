"use client";

/**
 * Single place where GSAP plugins are registered and the house eases are
 * defined. Import `gsap` from here (or call `setupGsap()` once) before
 * building any timeline so `ease: "fable"` resolves everywhere.
 */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import { EASE_CINEMATIC, EASE_FABLE } from "@/lib/easing";

let ready = false;

export function setupGsap() {
  if (ready || typeof window === "undefined") return gsap;
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);

  // Expo-style settle: fast start, long deliberate landing.
  CustomEase.create(EASE_FABLE, "M0,0 C0.16,1 0.3,1 1,1");
  // Symmetric cinematic curve for curtains, drawers and the GL transition.
  CustomEase.create(EASE_CINEMATIC, "M0,0 C0.76,0 0.24,1 1,1");

  gsap.defaults({ ease: EASE_FABLE, duration: 1 });
  ScrollTrigger.config({ ignoreMobileResize: true });
  // Lenis drives the ticker; never let GSAP try to "catch up" after tab switches.
  gsap.ticker.lagSmoothing(0);

  ready = true;
  return gsap;
}

export { gsap, ScrollTrigger, SplitText, CustomEase };
