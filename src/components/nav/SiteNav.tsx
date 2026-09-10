"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap, ScrollTrigger, setupGsap } from "@/components/motion/gsapSetup";
import { TransitionLink } from "@/components/gl/TransitionLink";
import { usePageEnter } from "@/components/gl/transitionController";
import { getState, subscribe, useStore } from "@/lib/store";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import { EASE_FABLE } from "@/lib/easing";
import { Wordmark } from "./Wordmark";
import styles from "./SiteNav.module.css";

/**
 * Minimal top chrome. Blends with whatever is beneath it (difference), hides
 * on scroll-down, returns on scroll-up, and stays out of the way of the hero
 * until the page has entered.
 */
export function SiteNav() {
  const root = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const drawerOpen = useStore((s) => s.drawerOpen);

  // Reveal after the page enters. On the home page the hero owns the first
  // moments: the chrome waits for the intro (store.introDone) before it appears.
  usePageEnter(() => {
    const el = root.current;
    if (!el) return;
    setupGsap();
    const reveal = () => {
      if (prefersReducedMotion()) {
        gsap.set(el, { autoAlpha: 1, yPercent: 0 });
        return;
      }
      gsap.to(el, { autoAlpha: 1, yPercent: 0, duration: 1.2, ease: EASE_FABLE, overwrite: true });
    };
    // usePathname is base-path-free; the static export adds a trailing slash.
    const onHome = pathname.replace(/\/$/, "") === "";
    if (!onHome || getState().introDone) {
      reveal();
      return;
    }
    const unsubscribe = subscribe(() => {
      if (!getState().introDone) return;
      unsubscribe();
      reveal();
    });
    // Never strand the chrome if the intro never reports (video stalls, tab hidden).
    window.setTimeout(() => {
      unsubscribe();
      reveal();
    }, 4500);
  });

  // Hide on scroll-down, show on scroll-up.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    setupGsap();
    const ctx = gsap.context(() => {
      let hidden = false;
      const show = () => {
        if (!hidden) return;
        hidden = false;
        gsap.to(el, { yPercent: 0, duration: 0.8, ease: EASE_FABLE, overwrite: true });
      };
      const hide = () => {
        if (hidden) return;
        hidden = true;
        gsap.to(el, { yPercent: -110, duration: 0.6, ease: "power3.in", overwrite: true });
      };
      // Dark plates (hero, forest sections, footer) declare data-nav="dark";
      // the chrome flips to vellum while any of them sits under the bar.
      let darkCount = 0;
      const setTheme = () => {
        el.dataset.theme = darkCount > 0 ? "dark" : "light";
      };
      const plates = Array.from(document.querySelectorAll<HTMLElement>('[data-nav="dark"]'));
      plates.forEach((plate) => {
        ScrollTrigger.create({
          trigger: plate,
          start: "top 48px",
          end: "bottom 48px",
          onToggle: (self) => {
            darkCount += self.isActive ? 1 : -1;
            setTheme();
          },
        });
      });
      setTheme();
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => {
          const y = self.scroll();
          if (y < 80) return show();
          if (self.direction === 1) hide();
          else show();
        },
      });
      const onScrollTop = () => {
        if (window.scrollY < 80) show();
      };
      window.addEventListener("scroll", onScrollTop, { passive: true });
      return () => window.removeEventListener("scroll", onScrollTop);
    });
    return () => ctx.revert();
  }, [pathname]);

  return (
    <header
      ref={root}
      className={styles.nav}
      data-drawer-open={drawerOpen ? "true" : undefined}
      aria-label="Site"
    >
      <div className={styles.inner}>
        <TransitionLink href="/" kind="dissolve" className={styles.brand} aria-label="Fable Travels — home">
          <Wordmark />
        </TransitionLink>

        <nav className={styles.links} aria-label="Primary">
          <TransitionLink href="/journeys" kind="dissolve" className={styles.link} data-cursor="link">
            <span className={styles.linkLabel}>Journeys</span>
          </TransitionLink>
          <TransitionLink href="/#collective" kind="dissolve" className={styles.link} data-cursor="link">
            <span className={styles.linkLabel}>The Collective</span>
          </TransitionLink>
          <TransitionLink href="/journeys" kind="dissolve" className={styles.cta} data-cursor="link">
            <span className={styles.linkLabel}>Curate Your Journey</span>
          </TransitionLink>
        </nav>
      </div>
    </header>
  );
}
