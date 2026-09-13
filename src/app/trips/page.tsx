import type { Metadata } from "next";
import { TripCard } from "@/components/trip/TripCard";
import { getTrips } from "@/lib/journeys";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Trips",
  description: "Four hosted weeks: Bali, Thailand, Cape Town and Rio. Twelve people, one villa, one host.",
};

export default function TripsPage() {
  const trips = getTrips();
  return (
    <main className={styles.main}>
      <header className={`container ${styles.head}`}>
        <p className="t-label t-sun">Four weeks a year</p>
        <h1 className={`t-display ${styles.title}`}>Pick your week.</h1>
      </header>
      <div className={styles.list}>
        {trips.map((t, i) => (
          <TripCard key={t.slug} trip={t} index={i} />
        ))}
      </div>
    </main>
  );
}
