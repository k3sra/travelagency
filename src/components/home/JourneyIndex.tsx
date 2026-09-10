import { Magnetic } from "@/components/motion/Magnetic";
import { ShutterImage } from "@/components/motion/ShutterImage";
import { TextReveal } from "@/components/motion/TextReveal";
import { TransitionLink } from "@/components/gl/TransitionLink";
import { formatPrice, getJourneys } from "@/lib/journeys";
import { SpotsTag } from "./SpotsTag";
import { Title } from "./Title";
import styles from "./JourneyIndex.module.css";

export function JourneyIndex() {
  const journeys = getJourneys();
  return (
    <section className={`section ${styles.section}`} aria-labelledby="index-title">
      <div className={`container ${styles.head}`}>
        <div>
          <p className={`t-caps ${styles.eyebrow}`}>All departures · 2026 – 2027</p>
          <TextReveal as="h2" id="index-title" className={`t-display ${styles.title}`}>
            Four doors. <em>Ten seats</em> behind each.
          </TextReveal>
        </div>
        <TransitionLink href="/journeys" kind="dissolve" className={`t-caps ${styles.all}`}>
          See every journey
        </TransitionLink>
      </div>

      <ul className={styles.row} data-lenis-prevent>
        {journeys.map((j, i) => (
          <li key={j.slug} className={styles.card} style={{ "--offset": i % 2 ? "1" : "0" } as React.CSSProperties}>
            <Magnetic strength={0.1} radius={40}>
              <TransitionLink
                href={`/journeys/${j.slug}`}
                kind={j.transition}
                to={j.hero.src}
                className={styles.cardLink}
                data-cursor="view"
                data-cursor-label="View journey"
                aria-label={`${j.title} — view the journey`}
              >
                <div className={styles.frame} data-magnetic-media>
                  <ShutterImage
                    image={j.card}
                    ratio="4 / 5"
                    sizes="(max-width: 600px) 78vw, (max-width: 1100px) 44vw, 24vw"
                    plate="vellum"
                    slats={5}
                    start="top 88%"
                  />
                </div>
                <p className={`t-caps ${styles.meta}`}>
                  {j.country} · {j.dates}
                </p>
                <h3 className={`t-display ${styles.name}`}>
                  <Title title={j.title} em={j.titleEm} />
                </h3>
                <p className={`t-caps t-muted ${styles.price}`}>From {formatPrice(j.price.amount)}</p>
                <SpotsTag n={j.spotsRemaining} className={styles.spots} />
              </TransitionLink>
            </Magnetic>
          </li>
        ))}
      </ul>
    </section>
  );
}
