import { TextReveal } from "@/components/motion/TextReveal";
import { PillLink } from "@/components/ui/PillLink";
import styles from "./Closing.module.css";

export function Closing() {
  return (
    <section className={`section ${styles.section}`} aria-labelledby="closing-title">
      <div className={`container ${styles.inner}`}>
        <TextReveal as="h2" id="closing-title" className={`t-display ${styles.title}`}>
          Write your own <em>legend.</em>
        </TextReveal>
        <TextReveal as="p" className={`t-lead ${styles.copy}`}>
          A deposit holds your place. It is refundable for fourteen days, which is longer than it
          takes to know.
        </TextReveal>
        <div className={styles.cta}>
          <PillLink href="/journeys" kind="dissolve" variant="forest" size="lg" label="Curate Your Journey" />
        </div>
      </div>
    </section>
  );
}
