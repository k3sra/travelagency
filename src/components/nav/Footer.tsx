"use client";

import { useState, type FormEvent } from "react";
import { TransitionLink } from "@/components/gl/TransitionLink";
import { TextReveal } from "@/components/motion/TextReveal";
import { getJourneys } from "@/lib/journeys";
import { Wordmark } from "./Wordmark";
import styles from "./Footer.module.css";

export function Footer() {
  const journeys = getJourneys();
  const [sent, setSent] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <footer className={`${styles.footer} on-forest grain`} aria-labelledby="footer-title" data-nav="dark">
      <div className={`container ${styles.inner}`}>
        <div className={styles.legend}>
          <p className="t-caps t-muted">Fable Travels</p>
          <TextReveal as="h2" className={`t-display ${styles.title}`} split="lines">
            Write your own <em>legend.</em>
          </TextReveal>
          <span id="footer-title" className="visually-hidden">
            Fable Travels
          </span>
        </div>

        <div className={styles.columns}>
          <div className={styles.col}>
            <h3 className={`t-caps ${styles.colTitle}`}>Departures</h3>
            <ul className={styles.list}>
              {journeys.map((j) => (
                <li key={j.slug}>
                  <TransitionLink
                    href={`/journeys/${j.slug}`}
                    kind={j.transition}
                    to={j.hero.src}
                    className={styles.link}
                    data-cursor="link"
                  >
                    <span>{j.title}</span>
                    <span className={`t-caps ${styles.linkMeta}`}>{j.dates}</span>
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.col}>
            <h3 className={`t-caps ${styles.colTitle}`}>The House</h3>
            <ul className={styles.list}>
              <li>
                <TransitionLink href="/journeys" kind="dissolve" className={styles.link} data-cursor="link">
                  <span>All journeys</span>
                </TransitionLink>
              </li>
              <li>
                <TransitionLink href="/#collective" kind="dissolve" className={styles.link} data-cursor="link">
                  <span>The Collective</span>
                </TransitionLink>
              </li>
              <li>
                <TransitionLink href="/#manifesto" kind="dissolve" className={styles.link} data-cursor="link">
                  <span>How we travel</span>
                </TransitionLink>
              </li>
            </ul>
          </div>

          <div className={`${styles.col} ${styles.letters}`}>
            <h3 className={`t-caps ${styles.colTitle}`}>Letters from the road</h3>
            <p className={`t-body t-muted ${styles.lettersCopy}`}>
              One letter a month. A place, a person, a reason to go. Nothing else.
            </p>
            {sent ? (
              <p className={`t-caps ${styles.sent}`} role="status">
                Thank you. The first letter is on its way.
              </p>
            ) : (
              <form className={styles.form} onSubmit={onSubmit}>
                <label className="visually-hidden" htmlFor="letters-email">
                  Email address
                </label>
                <input
                  id="letters-email"
                  className={styles.input}
                  type="email"
                  name="email"
                  placeholder="Your email"
                  autoComplete="email"
                  required
                />
                <button type="submit" className={`t-caps ${styles.submit}`} data-cursor="link">
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

        <div className={styles.legal}>
          <Wordmark className={styles.legalMark} />
          <p className={`t-caps ${styles.legalCopy}`}>
            Small groups. Grown-up travel. © {new Date().getFullYear()} Fable Travels
          </p>
        </div>
      </div>
    </footer>
  );
}
