import type { Metadata } from "next";
import credits from "../../../public/media/credits.json";
import { TransitionLink } from "@/components/gl/TransitionLink";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Photography credits" };

interface Credit {
  provider?: "openverse" | "pexels";
  photographer?: string;
  photographerUrl?: string;
  url: string;
  alt?: string;
  license?: string;
  licenseUrl?: string;
}

const licenseLabel = (c: Credit) =>
  c.provider === "openverse" ? `${c.license ?? "CC"} via Openverse` : "Pexels licence";

export default function CreditsPage() {
  const entries = Object.entries(credits as Record<string, Credit>);
  return (
    <main className={`container ${styles.main}`}>
      <p className="t-caps t-muted">Fable Travels</p>
      <h1 className={`t-display ${styles.title}`}>
        Photography and <em>film.</em>
      </h1>
      <p className={`t-lead t-muted ${styles.copy}`}>
        The photographs on this site are Creative Commons pictures by travellers, found through
        Openverse, and licensed stills and films from Pexels. Each one is cropped and graded.
        The people pictured are not Fable travellers; they stand in for a real, private collective.
      </p>
      <ul className={styles.list}>
        {entries.map(([rel, c]) => (
          <li key={rel} className={styles.item}>
            <span className={`t-caps ${styles.rel}`}>{rel}</span>
            <a href={c.url} className={styles.link} target="_blank" rel="noreferrer" data-cursor="link">
              {c.photographer ?? "Unknown"}
            </a>
            <span className={`t-caps t-muted ${styles.rel}`}>
              {c.licenseUrl ? (
                <a href={c.licenseUrl} target="_blank" rel="noreferrer" data-cursor="link">
                  {licenseLabel(c)}
                </a>
              ) : (
                licenseLabel(c)
              )}
            </span>
          </li>
        ))}
      </ul>
      <TransitionLink href="/" kind="dissolve" className={`t-caps ${styles.back}`}>
        Back to the beginning
      </TransitionLink>
    </main>
  );
}
