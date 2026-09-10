import type { Metadata } from "next";
import { JourneyCard } from "@/components/journey/JourneyCard";
import { EnterText } from "@/components/journey/JourneyHeader";
import { getJourneys } from "@/lib/journeys";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Journeys",
  description:
    "Four small-group departures for 2026 and 2027: Kyoto, Patagonia, the Sahara and Iceland. One host, one table, never more than twelve.",
};

export default function JourneysPage() {
  const journeys = getJourneys();

  return (
    <main className={styles.main}>
      <header className={`container ${styles.header}`}>
        <p className="t-caps t-muted">Departures · 2026 – 2027</p>
        <EnterText as="h1" className={`t-display ${styles.title}`} delay={0.15}>
          Four doors. <em>Forty seats</em> behind them.
        </EnterText>
        <p className={`t-lead t-muted ${styles.intro}`}>
          One departure each. One host. A group small enough to sit at one table.
        </p>
      </header>

      <div className={styles.list}>
        {journeys.map((journey, i) => (
          <JourneyCard key={journey.slug} journey={journey} index={i} flip={i % 2 === 1} />
        ))}
      </div>
    </main>
  );
}
