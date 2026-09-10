import Image from "next/image";
import { TextReveal } from "@/components/motion/TextReveal";
import { TransitionLink } from "@/components/gl/TransitionLink";
import { getJourney } from "@/lib/journeys";
import { PillLink } from "@/components/ui/PillLink";
import styles from "./CollectiveTeaser.module.css";

export function CollectiveTeaser() {
  const kyoto = getJourney("kyoto-in-silence");
  if (!kyoto) return null;
  const people = kyoto.travellers.slice(0, 6);
  return (
    <section id="collective" className={`section on-forest grain ${styles.section}`} aria-labelledby="collective-title" data-nav="dark">
      <div className={`container ${styles.inner}`}>
        <div className={styles.copy}>
          <p className={`t-caps ${styles.eyebrow}`}>The Collective</p>
          <TextReveal as="h2" id="collective-title" className={`t-display ${styles.title}`}>
            You will travel with people you <em>would have chosen.</em>
          </TextReveal>
          <TextReveal as="p" className={`t-lead ${styles.lead}`}>
            Before a seat is confirmed, every traveller answers twelve questions about how they
            like a day to go. The group forms around alignment, not age. Your host reads the
            answers before dinner on the first night.
          </TextReveal>
          <dl className={styles.facts}>
            <div>
              <dt className="t-caps t-muted">Group size</dt>
              <dd className="t-display">8 – 12</dd>
            </div>
            <div>
              <dt className="t-caps t-muted">Average alignment</dt>
              <dd className="t-display">86%</dd>
            </div>
            <div>
              <dt className="t-caps t-muted">Return travellers</dt>
              <dd className="t-display">1 in 3</dd>
            </div>
          </dl>
          <PillLink
            href={`/journeys/${kyoto.slug}#collective`}
            kind={kyoto.transition}
            to={kyoto.hero.src}
            variant="ghost"
            label="Meet the Kyoto ten"
          />
        </div>

        <ul className={styles.grid} aria-label="Travellers already confirmed for Kyoto">
          {people.map((p, i) => (
            <li key={p.id} className={styles.cell} style={{ "--i": String(i) } as React.CSSProperties}>
              <TransitionLink
                href={`/journeys/${kyoto.slug}#collective`}
                kind={kyoto.transition}
                to={kyoto.hero.src}
                className={styles.person}
                data-cursor="view"
                data-cursor-label="The Collective"
              >
                <span className={styles.portrait}>
                  <Image src={p.portrait} alt="" width={600} height={800} sizes="(max-width: 900px) 45vw, 18vw" />
                </span>
                <span className={`t-caps ${styles.name}`}>
                  {p.firstName} · {p.from}
                </span>
                <span className={`t-caps ${styles.match}`}>{p.match}% aligned</span>
              </TransitionLink>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
