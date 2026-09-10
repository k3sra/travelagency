"use client";

/**
 * One full-width editorial row on the journey index: the hero image inside a
 * magnetic transition link, and a copy column that alternates sides. Client
 * because <Magnetic> reads its element child, which must be created inside
 * the client boundary.
 */

import { TransitionLink } from "@/components/gl/TransitionLink";
import { Magnetic } from "@/components/motion/Magnetic";
import { ShutterImage } from "@/components/motion/ShutterImage";
import { TextReveal } from "@/components/motion/TextReveal";
import { formatPrice } from "@/lib/journeys";
import type { Journey } from "@/lib/types";
import { Scarcity } from "./Scarcity";
import { VibeTags } from "./VibeTags";
import styles from "./JourneyCard.module.css";

/** The title with its `titleEm` phrase in italic gold (styled by .t-display em). */
export function JourneyTitle({ title, titleEm }: Pick<Journey, "title" | "titleEm">) {
  const at = titleEm ? title.indexOf(titleEm) : -1;
  if (!titleEm || at < 0) return <>{title}</>;
  return (
    <>
      {title.slice(0, at)}
      <em>{titleEm}</em>
      {title.slice(at + titleEm.length)}
    </>
  );
}

export interface JourneyCardProps {
  journey: Journey;
  /** Position in the catalogue, for the "01" mark. */
  index: number;
  /** Image on the right, copy on the left. */
  flip?: boolean;
}

export function JourneyCard({ journey, index, flip = false }: JourneyCardProps) {
  const href = `/journeys/${journey.slug}`;
  const price = formatPrice(journey.price.amount, journey.price.currency);
  const titleId = `journey-${journey.slug}-title`;

  return (
    <article className={`${styles.card} ${flip ? styles.flip : ""}`} aria-labelledby={titleId}>
      <div className={`container ${styles.grid}`}>
        <Magnetic strength={0.08} radius={60}>
          <TransitionLink
            href={href}
            kind={journey.transition}
            to={journey.hero.src}
            className={styles.imageLink}
            data-cursor="view"
            data-cursor-label="View journey"
            aria-hidden="true"
            tabIndex={-1}
          >
            <span className={styles.media} data-magnetic-media>
              <ShutterImage
                image={journey.hero}
                ratio="var(--card-ratio)"
                sizes="(max-width: 900px) 100vw, 58vw"
                parallax={0.1}
                plate="vellum"
              />
            </span>
          </TransitionLink>
        </Magnetic>

        <div className={styles.copy}>
          <p className={`t-caps t-muted ${styles.eyebrow}`}>
            <span className={styles.index}>{String(index + 1).padStart(2, "0")}</span>
            {journey.country} · {journey.season} · {journey.dates}
          </p>
          <TextReveal as="h2" id={titleId} className={`t-display ${styles.title}`}>
            <JourneyTitle title={journey.title} titleEm={journey.titleEm} />
          </TextReveal>
          <p className={`t-lead ${styles.subtitle}`}>{journey.subtitle}</p>
          <VibeTags tags={journey.vibe} className={styles.vibes} />
          <p className={`t-caps t-muted ${styles.meta}`}>
            {journey.durationDays} days · group of {journey.groupMax} · from {price}
          </p>
          <div className={styles.foot}>
            <Scarcity n={journey.spotsRemaining} />
            <TransitionLink
              href={href}
              kind={journey.transition}
              to={journey.hero.src}
              className={`t-caps ${styles.link}`}
            >
              Read the itinerary
            </TransitionLink>
          </div>
        </div>
      </div>
    </article>
  );
}
