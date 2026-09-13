import { TextReveal } from "@/components/motion/TextReveal";
import styles from "./StraightAnswers.module.css";

/**
 * The questions people actually ask before they pay, answered in plain words.
 * No hedging: every line here is a promise the booking page repeats.
 */

const ANSWERS = [
  {
    q: "Is it really all-inclusive?",
    a: "Yes. Every night, every meal, every drink at the table, every transfer, every guide. The only thing you pay for on the ground is a souvenir.",
  },
  {
    q: "Who actually comes?",
    a: "Last season: twenty-five to forty-two, half solo, half in twos, from nineteen cities. Nobody arrives knowing everyone. Everybody leaves knowing everyone.",
  },
  {
    q: "What is the house like?",
    a: "We stay in places we have slept in ourselves. If a photo on this site is not of the actual house, the caption says so.",
  },
  {
    q: "How rushed is a day?",
    a: "One thing before lunch, one thing after, and one long evening. If a day needs a 6am alarm, it is because the light is worth it, and it is the only one.",
  },
  {
    q: "What if I change my mind?",
    a: "Your deposit is refundable for fourteen days, in full, no reason required. After that it moves to any other departure within a year.",
  },
];

export function StraightAnswers() {
  return (
    <section id="answers" className={`section ${styles.section}`} aria-labelledby="answers-title">
      <div className={`container ${styles.inner}`}>
        <div className={styles.head}>
          <p className={`t-caps ${styles.eyebrow}`}>Before you ask</p>
          <TextReveal as="h2" id="answers-title" className={`t-display ${styles.title}`}>
            Straight answers, <em>in writing.</em>
          </TextReveal>
        </div>
        <dl className={styles.list}>
          {ANSWERS.map((item, i) => (
            <div key={item.q} className={styles.row}>
              <dt>
                <TextReveal as="span" className={`t-display ${styles.q}`} delay={i * 0.04}>
                  {item.q}
                </TextReveal>
              </dt>
              <dd className={styles.dd}>
                <TextReveal as="p" className={`t-lead ${styles.a}`} split="lines" delay={i * 0.04 + 0.1}>
                  {item.a}
                </TextReveal>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
