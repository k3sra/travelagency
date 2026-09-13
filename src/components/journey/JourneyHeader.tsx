"use client";

/**
 * The package hero: the journey's film over its own first frame, with the
 * title unmasking bottom-left when the page enters. The WebGL transition
 * lands on that frame, then the film fades up over it.
 */

import { useRef, useState } from "react";
import { usePageEnter } from "@/components/gl/transitionController";
import { Film } from "@/components/motion/Film";
import { getFilm } from "@/lib/media";
import {
  TextReveal,
  type TextRevealHandle,
  type TextRevealProps,
} from "@/components/motion/TextReveal";
import { formatPrice } from "@/lib/journeys";
import type { Journey } from "@/lib/types";
import { JourneyTitle } from "./JourneyCard";
import { Scarcity } from "./Scarcity";
import styles from "./JourneyHeader.module.css";

export const JOURNEY_HEADER_ID = "journey-header";

/** A TextReveal that plays when the page enters (curtain up, or next frame on a cold load). */
export function EnterText({ children, ...props }: Omit<TextRevealProps, "trigger" | "ref">) {
  const handle = useRef<TextRevealHandle | null>(null);
  usePageEnter(() => {
    handle.current?.play();
  });
  return (
    <TextReveal {...props} trigger="manual" ref={handle}>
      {children}
    </TextReveal>
  );
}

export interface JourneyHeaderProps {
  journey: Journey;
  /** Element id, used by <SecureSpot> as its scroll trigger. */
  id?: string;
}

export function JourneyHeader({ journey, id = JOURNEY_HEADER_ID }: JourneyHeaderProps) {
  const [entered, setEntered] = useState(false);
  usePageEnter(() => {
    setEntered(true);
  });

  const lead = 0.25;
  const price = formatPrice(journey.price.amount, journey.price.currency);

  return (
    <header id={id} className={styles.header} data-entered={entered ? "" : undefined}>
      <div className={styles.media}>
        <Film
          film={getFilm(journey.slug)}
          poster={{ wide: journey.hero.src, wideBlur: journey.hero.blur, tall: journey.heroTall.src, tallBlur: journey.heroTall.blur }}
          transitionHero
        />
      </div>
      <div className={styles.scrim} aria-hidden="true" />

      <div className={`container ${styles.content}`}>
        <div className={styles.copy}>
          <EnterText as="p" className={`t-caps ${styles.eyebrow}`} delay={lead}>
            {journey.country} · {journey.region} · {journey.season}
          </EnterText>
          <EnterText as="h1" className={`t-display ${styles.title}`} delay={lead + 0.1}>
            <JourneyTitle title={journey.title} titleEm={journey.titleEm} />
          </EnterText>
          <EnterText as="p" className={`t-lead ${styles.subtitle}`} delay={lead + 0.4}>
            {journey.subtitle}
          </EnterText>
          <EnterText as="p" className={`t-caps ${styles.meta}`} delay={lead + 0.55}>
            {journey.dates} · {journey.durationDays} days · group of {journey.groupMax} · from{" "}
            {price}
          </EnterText>
        </div>
        <div className={styles.scarcity}>
          <Scarcity n={journey.spotsRemaining} />
        </div>
      </div>
    </header>
  );
}
