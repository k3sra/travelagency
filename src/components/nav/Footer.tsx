"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { TransitionLink } from "@/components/gl/TransitionLink";
import { gsap, setupGsap } from "@/components/motion/gsapSetup";
import { CONTACT } from "@/lib/content";
import { getTrips } from "@/lib/journeys";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import styles from "./Footer.module.css";

export function Footer() {
  const root = useRef<HTMLElement>(null);
  const trips = getTrips();

  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    setupGsap();
    const ctx = gsap.context(() => {
      gsap.fromTo(el.querySelector("[data-mark]"), { yPercent: 60 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "top 30%", scrub: true } });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <footer ref={root} className={`on-night ${styles.footer}`} data-nav="dark">
      <div className={styles.markMask} aria-hidden="true">
        <p className={styles.mark} data-mark>FABLE</p>
      </div>
      <div className={`container ${styles.grid}`}>
        <div>
          <p className={`t-label ${styles.head}`}>Trips</p>
          <ul className={styles.list}>
            {trips.map((t) => (
              <li key={t.slug}>
                <TransitionLink href={`/trips/${t.slug}`} kind={t.transition} to={t.hero.src} toNarrow={t.heroTall.src} className={styles.link}>{t.title}</TransitionLink>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className={`t-label ${styles.head}`}>FABLE</p>
          <ul className={styles.list}>
            <li><Link href="/#how" className={styles.link}>How it works</Link></li>
            <li><Link href="/#faces" className={styles.link}>Who comes</Link></li>
            <li><TransitionLink href="/credits" kind="dissolve" className={styles.link}>Photo credits</TransitionLink></li>
          </ul>
        </div>
        <div>
          <p className={`t-label ${styles.head}`}>Talk to a person</p>
          <ul className={styles.list}>
            <li><a href={`mailto:${CONTACT.email}`} className={styles.link}>{CONTACT.email}</a></li>
            <li><a href={`https://wa.me/${CONTACT.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" className={styles.link}>WhatsApp {CONTACT.whatsapp}</a></li>
            <li><a href={CONTACT.instagram} target="_blank" rel="noreferrer" className={styles.link}>Instagram</a></li>
            <li><a href={CONTACT.tiktok} target="_blank" rel="noreferrer" className={styles.link}>TikTok</a></li>
          </ul>
        </div>
      </div>
      <div className={`container ${styles.foot}`}>
        <hr className="rule" />
        <div className={styles.footRow}>
          <span className={`t-label ${styles.muted}`}>FABLE · Hosted group weeks for 25 to 40 year olds</span>
          <span className={`t-label ${styles.muted}`}>Deposits refundable for 14 days · Balance due 60 days before departure</span>
        </div>
      </div>
    </footer>
  );
}
