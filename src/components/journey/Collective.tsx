"use client";

/**
 * The Collective — who is already going, and how closely they match.
 * Left: the confirmed count, the vibe bars, the seats left and the CTA.
 * Right: the travellers' portraits drifting upward in a continuous marquee.
 *
 * The marquee is pure CSS: each column's track is rendered twice and a
 * translateY(0 → -50%) keyframe loops it seamlessly (cards carry their gap as
 * margin so half the track is exactly one set). A gradient mask dissolves the
 * ends into the forest; hover pauses it; reduced motion shows a still grid.
 */

import Image from "next/image";
import { useBooking } from "@/components/booking/BookingProvider";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { TextReveal } from "@/components/motion/TextReveal";
import type { Journey, Traveller } from "@/lib/types";
import { Scarcity } from "./Scarcity";
import { VibeTags } from "./VibeTags";
import styles from "./Collective.module.css";

export interface CollectiveProps {
  journey: Journey;
}

function Portrait({ traveller }: { traveller: Traveller }) {
  return (
    <figure className={styles.figure}>
      <Image
        src={traveller.portrait}
        alt={`Portrait of ${traveller.firstName}`}
        width={600}
        height={800}
        sizes="(max-width: 900px) 280px, 17vw"
        className={styles.img}
      />
      <figcaption className={styles.caption}>
        <span className={styles.name}>
          {traveller.firstName} · {traveller.from}
        </span>
        <span className={styles.match}>{traveller.match}% aligned</span>
        {traveller.note ? <span className={styles.note}>{traveller.note}</span> : null}
      </figcaption>
    </figure>
  );
}

function Track({ travellers, hidden = false }: { travellers: Traveller[]; hidden?: boolean }) {
  return (
    <ul className={styles.track} aria-hidden={hidden || undefined}>
      {travellers.map((t) => (
        <li key={t.id} className={styles.card}>
          <Portrait traveller={t} />
        </li>
      ))}
      {travellers.map((t) => (
        <li key={`again-${t.id}`} className={`${styles.card} ${styles.again}`} aria-hidden="true">
          <Portrait traveller={t} />
        </li>
      ))}
    </ul>
  );
}

export function Collective({ journey }: CollectiveProps) {
  const { open } = useBooking();
  const booked = Math.max(0, journey.groupMax - journey.spotsRemaining);
  const half = Math.ceil(journey.travellers.length / 2);
  const offset = [...journey.travellers.slice(half), ...journey.travellers.slice(0, half)];

  return (
    <section
      id="collective"
      className={`${styles.section} on-forest grain`}
      aria-labelledby="collective-title"
    >
      <div className={`container ${styles.grid}`}>
        <div className={styles.copy}>
          <p className="t-caps t-muted">
            The Collective · {booked} of {journey.groupMax} confirmed
          </p>
          <TextReveal as="h2" id="collective-title" className={`t-display ${styles.title}`}>
            Who is already going
          </TextReveal>
          <VibeTags tags={journey.vibe} animate className={styles.vibes} />
          <TextReveal as="p" className={`t-lead ${styles.body}`}>
            Everyone here answered the same questions before we said yes. The figures are how
            closely their answers match this journey. Yours would sit beside them.
          </TextReveal>
          <div className={styles.cta}>
            <Scarcity n={journey.spotsRemaining} size="lg" />
            <MagneticButton
              variant="gold"
              size="lg"
              label="Secure Your Spot"
              onClick={() => open(journey.slug)}
            />
          </div>
        </div>

        <div className={styles.marquee} role="group" aria-label="Confirmed travellers">
          <div className={styles.column}>
            <Track travellers={journey.travellers} />
          </div>
          <div className={`${styles.column} ${styles.slow}`} aria-hidden="true">
            <Track travellers={offset} hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
