/**
 * Motion tokens. Mirrored as CSS custom properties in globals.css.
 * Every GSAP timeline in the app should pull from here so the whole site
 * shares one physical "feel": heavy, deliberate, never bouncy.
 */

/** Name registered with CustomEase in gsapSetup.ts — an expo-style settle. */
export const EASE_FABLE = "fable";
/** Name registered with CustomEase — symmetric cinematic in/out for curtains and transitions. */
export const EASE_CINEMATIC = "cinematic";

export const EASE_FABLE_CSS = "cubic-bezier(0.16, 1, 0.3, 1)";
export const EASE_CINEMATIC_CSS = "cubic-bezier(0.76, 0, 0.24, 1)";

export const DUR = {
  /** Hover / magnetic / image zoom — the brief's 0.3s. */
  tactile: 0.3,
  /** Line unmask per line. */
  line: 1.1,
  /** Stagger between lines. */
  lineStagger: 0.085,
  /** Image shutter / parallax reveal. */
  reveal: 1.4,
  /** WebGL page transition, click → new page visible. */
  transition: 1.5,
  /** Booking drawer slide. */
  drawer: 0.9,
} as const;

/** Lenis physics: heavy inertia, deliberate settle. */
export const LENIS = {
  lerp: 0.075,
  duration: 1.5,
  wheelMultiplier: 0.9,
  touchMultiplier: 1.4,
  easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
} as const;
