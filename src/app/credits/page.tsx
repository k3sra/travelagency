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
      <p className="t-label t-sun">Photo credits</p>
      <h1 className={`t-h2 ${styles.title}`}>The people in the pictures.</h1>
      <p className={`t-lead ${styles.copy}`}>Pictures are licensed from Pexels and from Creative Commons photographers via Openverse. The people shown are not FABLE travellers.</p>
      <ul className={styles.list}>
        {entries.map(([rel, c]) => (
          <li key={rel} className={styles.item}>
            <span className={`t-label ${styles.rel}`}>{rel}</span>
            <a href={c.url} className={styles.link} target="_blank" rel="noreferrer" data-cursor="link">
              {c.photographer ?? "Unknown"}
            </a>
            <span className={`t-label ${styles.rel}`}>
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
      <TransitionLink href="/" kind="dissolve" className={`btn btn--ghost ${styles.back}`}>
        Back
      </TransitionLink>
    </main>
  );
}
