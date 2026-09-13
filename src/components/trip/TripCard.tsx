"use client";

import Image from "next/image";
import { TransitionLink } from "@/components/gl/TransitionLink";
import { LiveFilm } from "@/components/motion/LiveFilm";
import { Parallax } from "@/components/motion/Parallax";
import { TextReveal } from "@/components/motion/TextReveal";
import { formatPrice } from "@/lib/journeys";
import { getFilm } from "@/lib/media";
import type { Journey } from "@/lib/types";
import styles from "./TripCard.module.css";

export function TripCard({ trip, index }: { trip: Journey; index: number }) {
  const flip = index % 2 === 1;
  const link = { href: `/trips/${trip.slug}`, kind: trip.transition, to: trip.hero.src, toNarrow: trip.heroTall.src } as const;
  return (
    <article className={`container ${styles.row} ${flip ? styles.flip : ""}`}>
      <TransitionLink {...link} className={styles.media} data-cursor="view" data-cursor-label="See the week" aria-label={`${trip.title}: see the week`}>
        <Parallax speed={0.12} className={styles.parallax}>
          <span className={styles.frame}>
            <Image src={trip.hero.src} alt={trip.hero.alt} fill sizes="(max-width: 900px) 100vw, 60vw" className={styles.img} data-transition-hero={trip.hero.src} />
            <LiveFilm film={getFilm(trip.slug)} />
            <span className={styles.scrim} aria-hidden="true" />
            <span className={`t-label ${styles.index}`}>0{index + 1}</span>
          </span>
        </Parallax>
      </TransitionLink>
      <div className={styles.copy}>
        <p className={`t-label ${styles.meta}`}>{trip.country} · {trip.season} · {trip.dates}</p>
        <TextReveal as="h2" className={`t-display ${styles.title}`}>{trip.title}</TextReveal>
        <TextReveal as="p" className={`t-lead ${styles.sub}`}>{trip.subtitle}</TextReveal>
        <ul className={styles.highlights}>
          {trip.highlights.map((h) => (
            <li key={h} className={styles.highlight}>{h}</li>
          ))}
        </ul>
        <ul className={styles.chips} aria-label="Vibe">
          <li className={`${styles.chip} ${styles.intent}`}>{trip.intent}</li>
          {trip.vibe.map((v) => (
            <li key={v.label} className={styles.chip}>{v.label} {v.pct}%</li>
          ))}
        </ul>
        <p className={`t-label ${styles.facts}`}>{trip.durationDays} days · 12 people · from {formatPrice(trip.price.amount)}</p>
        <p className={`t-label ${styles.spots} ${trip.spotsRemaining <= 2 ? styles.pulse : ""}`}>[ {trip.spotsRemaining} {trip.spotsRemaining === 1 ? "spot" : "spots"} left ]</p>
        <TransitionLink {...link} className="btn">See the full week</TransitionLink>
      </div>
    </article>
  );
}
