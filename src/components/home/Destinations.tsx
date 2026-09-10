import { FocusReveal } from "@/components/motion/FocusReveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { TextReveal } from "@/components/motion/TextReveal";
import { TransitionLink } from "@/components/gl/TransitionLink";
import { featuredSlugs, formatPrice, getJourney } from "@/lib/journeys";
import { SpotsTag } from "./SpotsTag";
import { Title } from "./Title";
import styles from "./Destinations.module.css";

const NUMERALS = ["I", "II", "III"];

export function Destinations() {
  const journeys = featuredSlugs.map((slug) => getJourney(slug)).filter((j) => j !== undefined);
  return (
    <section className={`section ${styles.section}`} aria-labelledby="destinations-title">
      <div className={`container ${styles.head}`}>
        <p className={`t-caps ${styles.eyebrow}`}>Three doors</p>
        <TextReveal as="h2" id="destinations-title" className={`t-display ${styles.title}`}>
          Choose the one that <em>keeps you up at night.</em>
        </TextReveal>
      </div>

      <div className={styles.list}>
        {journeys.map((j, i) => {
          const tall = i % 2 === 1;
          return (
            <article key={j.slug} className={`${styles.row} ${tall ? styles.rowTall : ""}`}>
              <Magnetic strength={0.12} radius={40}>
                <TransitionLink
                  href={`/journeys/${j.slug}`}
                  kind={j.transition}
                  to={j.hero.src}
                  className={styles.media}
                  data-cursor="view"
                  data-cursor-label="View journey"
                  aria-label={`${j.title} — view the journey`}
                >
                  <div className={styles.frame} data-magnetic-media>
                    <FocusReveal
                      image={tall ? j.card : j.hero}
                      ratio={tall ? "4 / 5" : "16 / 10"}
                      sizes="(max-width: 900px) 100vw, 60vw"
                    />
                  </div>
                </TransitionLink>
              </Magnetic>

              <div className={styles.copy}>
                <p className={`t-caps ${styles.meta}`}>
                  Chapter {NUMERALS[i]} · {j.country} · {j.season}
                </p>
                <TextReveal as="h3" className={`t-display ${styles.name}`}>
                  <Title title={j.title} em={j.titleEm} />
                </TextReveal>
                <TextReveal as="p" className={`t-lead ${styles.promise}`}>
                  {j.promise}
                </TextReveal>
                <p className={`t-caps t-muted ${styles.facts}`}>
                  {j.durationDays} days · Group of {j.groupMax} · From {formatPrice(j.price.amount)}
                </p>
                <div className={styles.foot}>
                  <SpotsTag n={j.spotsRemaining} />
                  <TransitionLink
                    href={`/journeys/${j.slug}`}
                    kind={j.transition}
                    to={j.hero.src}
                    className={`t-caps ${styles.link}`}
                  >
                    View the journey
                  </TransitionLink>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
