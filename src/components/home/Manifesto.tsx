import { TextReveal } from "@/components/motion/TextReveal";
import styles from "./Manifesto.module.css";

const LINES = [
  "Twelve strangers. A group chat by dinner.",
  "One host who knows where the night goes.",
  "Mornings start when the pool does.",
  "Every seat is someone we would travel with.",
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
            Fable is a week with people who move the way you do. Villas, boats, rooftops,
            deserts. A host who knows the back door, and days shaped around the light rather
            than a spreadsheet. You come home with photographs you will actually post and
            people you will actually keep.
          </TextReveal>
          <hr className="rule" />
          <p className={`t-caps t-muted ${styles.note}`}>Ages 25 to 42 last season. Four departures a year. Twelve seats each.</p>
        </div>
      </div>
    </section>
  );
}
