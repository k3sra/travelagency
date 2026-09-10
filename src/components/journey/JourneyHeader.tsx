"use client";

/**
 * The package hero: a full-bleed 100svh image with the title unmasking
 * bottom-left when the page enters.
 *
 * Two ways in. On a cold load the image arrives through <ShutterImage> (slats
 * from the forest plate, scale settle, parallax) and the copy rises a beat
 * later. Via a WebGL transition the incoming displacement already ends on this
 * exact image, so the hero mounts still — a plain image with the same parallax
 * and `data-transition-hero` — and the copy unmasks the moment the canvas
 * fades (usePageEnter). Which branch applies is read once from the store at
 * mount: the transition phase is never "idle" while a navigation is in flight.
 */

import Image from "next/image";
import { useRef, useState } from "react";
import { usePageEnter } from "@/components/gl/transitionController";
import { Parallax } from "@/components/motion/Parallax";
import { ShutterImage } from "@/components/motion/ShutterImage";
import {
  TextReveal,
  type TextRevealHandle,
  type TextRevealProps,
} from "@/components/motion/TextReveal";
import { formatPrice } from "@/lib/journeys";
import { getState } from "@/lib/store";
import type { Journey, MediaImage } from "@/lib/types";
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

/** Image travel over the scroll; the drift box is oversized so no edge shows. */
const HERO_PARALLAX = 0.15;

function StillHero({ image }: { image: MediaImage }) {
  return (
    <div className={styles.still} data-transition-hero={image.src}>
      <Parallax speed={HERO_PARALLAX} className={styles.stillDrift}>
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="100vw"
          preload
          fetchPriority="high"
          className={styles.stillImg}
          draggable={false}
        />
      </Parallax>
    </div>
  );
}

export interface JourneyHeaderProps {
  journey: Journey;
  /** Element id, used by <SecureSpot> as its scroll trigger. */
  id?: string;
}

export function JourneyHeader({ journey, id = JOURNEY_HEADER_ID }: JourneyHeaderProps) {
  const [viaTransition] = useState(() => getState().transition !== "idle");
  const [entered, setEntered] = useState(false);
  usePageEnter(() => {
    setEntered(true);
  });

  // Cold load: let the slats begin before the type rises. Transition: at once.
  const lead = viaTransition ? 0.05 : 0.45;
  const price = formatPrice(journey.price.amount, journey.price.currency);

  return (
    <header id={id} className={styles.header} data-entered={entered ? "" : undefined}>
      <div className={styles.media}>
        {viaTransition ? (
          <StillHero image={journey.hero} />
        ) : (
          <ShutterImage
            image={journey.hero}
            className={styles.shutter}
            priority
            sizes="100vw"
            plate="forest"
            parallax={HERO_PARALLAX}
            slats={7}
            transitionHero
          />
        )}
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
