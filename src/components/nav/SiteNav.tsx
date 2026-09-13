"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TransitionLink } from "@/components/gl/TransitionLink";
import { gsap, ScrollTrigger, setupGsap } from "@/components/motion/gsapSetup";
import { HERO_POSTER } from "@/lib/media";
import { getTrips } from "@/lib/journeys";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import styles from "./SiteNav.module.css";

export function SiteNav() {
  const root = useRef<HTMLElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const trips = getTrips();

  // Dark plates invert the bar; scrolling down hides it, up shows it.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    setupGsap();
    let dark = 0;
    const ctx = gsap.context(() => {
      const timer = window.setTimeout(() => {
        dark = 0;
        document.querySelectorAll<HTMLElement>('[data-nav="dark"]').forEach((plate) => {
          ScrollTrigger.create({
            trigger: plate,
            start: "top 4.5rem",
            end: "bottom 4.5rem",
            onToggle: (self) => {
              dark += self.isActive ? 1 : -1;
              el.dataset.theme = dark > 0 ? "dark" : "light";
            },
          });
        });
        ScrollTrigger.refresh();
      }, 400);
      let last = 0;
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => {
          const y = self.scroll();
          const hide = y > last + 4 && y > 120;
          const show = y < last - 4 || y < 120;
          if (hide) el.dataset.hidden = "true";
          else if (show) el.dataset.hidden = "false";
          last = y;
        },
      });
      return () => window.clearTimeout(timer);
    });
    return () => ctx.revert();
  }, [pathname]);

  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const el = overlay.current;
    if (!el) return;
    document.documentElement.classList.toggle("nav-open", open);
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    if (!prefersReducedMotion()) {
      setupGsap();
      gsap.fromTo(el.querySelectorAll("[data-menu-line]"), { yPercent: 110, y: 0 }, { yPercent: 0, y: 0, duration: 0.8, ease: "fable", stagger: 0.06, delay: 0.1 });
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("nav-open");
    };
  }, [open]);

  return (
    <>
      <header ref={root} className={styles.bar} data-theme="light" data-hidden="false">
        <TransitionLink href="/" kind="dissolve" to={HERO_POSTER.wide} toNarrow={HERO_POSTER.tall} className={styles.wordmark} aria-label="FABLE home">
          FABLE
        </TransitionLink>
        <nav className={styles.links} aria-label="Primary">
          <TransitionLink href="/trips" kind="dissolve" className={styles.link}>Trips</TransitionLink>
          <Link href="/#how" className={styles.link}>How it works</Link>
          <Link href="/#faces" className={styles.link}>Who comes</Link>
        </nav>
        <div className={styles.right}>
          <TransitionLink href="/trips" kind="dissolve" className={`btn ${styles.cta}`}>Apply now</TransitionLink>
          <button type="button" className={styles.menu} aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen((v) => !v)}>
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </header>

      <div ref={overlay} id="site-menu" className={styles.overlay} data-open={open} data-lenis-prevent aria-hidden={!open} inert={!open}>
        <div className={styles.overlayInner}>
          <ul className={styles.tripList}>
            {trips.map((t) => (
              <li key={t.slug} className={styles.mask}>
                <TransitionLink href={`/trips/${t.slug}`} kind={t.transition} to={t.hero.src} toNarrow={t.heroTall.src} className={`t-display ${styles.tripLink}`} data-menu-line onClick={() => setOpen(false)}>
                  {t.title}
                </TransitionLink>
              </li>
            ))}
          </ul>
          <div className={styles.overlayFoot}>
            <Link href="/#how" className={`t-label ${styles.small}`} onClick={() => setOpen(false)}>How it works</Link>
            <Link href="/#faces" className={`t-label ${styles.small}`} onClick={() => setOpen(false)}>Who comes</Link>
            <TransitionLink href="/trips" kind="dissolve" className="btn btn--light" onClick={() => setOpen(false)}>Apply now</TransitionLink>
          </div>
        </div>
      </div>
    </>
  );
}
