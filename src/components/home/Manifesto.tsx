import { TextReveal } from "@/components/motion/TextReveal";
import styles from "./Manifesto.module.css";

const LINES = [
  "Ten travellers. Never more.",
  "One host who lives there.",
  "No day begins before you are ready for it.",
  "Every seat is a person we chose.",
];

export function Manifesto() {
  return (
    <section id="manifesto" className={`section ${styles.section}`} aria-labelledby="manifesto-title">
      <div className={`container ${styles.inner}`}>
        <p className={`t-caps ${styles.eyebrow}`} id="manifesto-title">
          How we travel
        </p>
        <div className={styles.lines}>
          {LINES.map((line, i) => (
            <TextReveal key={line} as="p" className={`t-display ${styles.line}`} delay={i * 0.06}>
              {line}
            </TextReveal>
          ))}
        </div>
        <div className={styles.aside}>
          <TextReveal as="p" className={`t-lead ${styles.copy}`} split="lines">
            Fable is travel for adults who have done the coach tour and would rather not again.
            No name badges, no fixed menus, no forced fun. A small group, a host who knows the
            back door, and days shaped around the light rather than the schedule.
          </TextReveal>
          <hr className="rule" />
          <p className={`t-caps t-muted ${styles.note}`}>Four departures a year. Ten seats each.</p>
        </div>
      </div>
    </section>
  );
}
