import { ShutterImage } from "@/components/motion/ShutterImage";
import { TextReveal } from "@/components/motion/TextReveal";
import type { Chapter } from "@/lib/types";
import styles from "./Chapters.module.css";

export interface ChaptersProps {
  chapters: Chapter[];
  durationDays: number;
}

const WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
];

const word = (n: number) => WORDS[n] ?? String(n);
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * The itinerary, a chapter at a time. Each chapter is its own two-column
 * block: the image sits sticky while its copy passes, the next block brings
 * the next image. On phones the image leads and the text follows.
 */
export function Chapters({ chapters, durationDays }: ChaptersProps) {
  return (
    <section className={styles.section} aria-labelledby="chapters-title">
      <div className={`container ${styles.head}`}>
        <p className="t-caps t-muted">The itinerary</p>
        <TextReveal as="h2" id="chapters-title" className={`t-display ${styles.heading}`}>
          {capital(word(durationDays))} days, {word(chapters.length)} chapters.
        </TextReveal>
      </div>

      <ol className={styles.list}>
        {chapters.map((chapter) => (
          <li key={chapter.numeral} className={styles.chapter}>
            <div className={`container ${styles.grid}`}>
              <div className={styles.imageCol}>
                <div className={styles.sticky}>
                  <ShutterImage
                    image={chapter.image}
                    ratio="var(--chapter-ratio)"
                    sizes="(max-width: 900px) 100vw, 46vw"
                    parallax={0.1}
                    slats={5}
                    plate="vellum"
                  />
                </div>
              </div>

              <div className={styles.text}>
                <span className={styles.numeral} aria-hidden="true">
                  {chapter.numeral}
                </span>
                <p className={`t-caps t-muted ${styles.days}`}>
                  <span className="visually-hidden">Chapter {chapter.numeral}, </span>
                  {chapter.days}
                </p>
                <TextReveal as="h3" className={`t-display ${styles.title}`}>
                  {chapter.title}
                </TextReveal>
                <TextReveal as="p" className={`t-lead ${styles.body}`}>
                  {chapter.body}
                </TextReveal>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
