import type { Metadata } from "next";
import credits from "../../../public/media/credits.json";
import { TransitionLink } from "@/components/gl/TransitionLink";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Photography credits" };

interface Credit {
  photographer?: string;
  photographerUrl?: string;
  url: string;
  alt?: string;
}

export default function CreditsPage() {
  const entries = Object.entries(credits as Record<string, Credit>);
  return (
    <main className={`container ${styles.main}`}>
      <p className="t-caps t-muted">Fable Travels</p>
      <h1 className={`t-display ${styles.title}`}>
        Photography and <em>film.</em>
      </h1>
      <p className={`t-lead t-muted ${styles.copy}`}>
        Every image and film on this site is licensed from Pexels. The travellers and hosts
        pictured are stock photographs standing in for a real, private collective.
      </p>
      <ul className={styles.list}>
        {entries.map(([rel, c]) => (
          <li key={rel} className={styles.item}>
            <span className={`t-caps ${styles.rel}`}>{rel}</span>
            <a href={c.url} className={styles.link} target="_blank" rel="noreferrer" data-cursor="link">
              {c.photographer ? `${c.photographer} on Pexels` : "Pexels"}
            </a>
          </li>
        ))}
      </ul>
      <TransitionLink href="/" kind="dissolve" className={`t-caps ${styles.back}`}>
        Back to the beginning
      </TransitionLink>
    </main>
  );
}
