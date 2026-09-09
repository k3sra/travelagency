import type { Metadata } from "next";
import { TransitionLink } from "@/components/gl/TransitionLink";
import styles from "./not-found.module.css";

export const metadata: Metadata = { title: "Not on the map" };

export default function NotFound() {
  return (
    <main className={`${styles.main} container`}>
      <p className="t-caps t-muted">Four hundred and four</p>
      <h1 className={`t-display ${styles.title}`}>
        This page is not <em>on the map.</em>
      </h1>
      <p className={`t-lead t-muted ${styles.copy}`}>
        Which is, admittedly, how the best places start. The departures are this way.
      </p>
      <TransitionLink href="/journeys" kind="dissolve" className={`t-caps ${styles.link}`} data-cursor="link">
        See the journeys
      </TransitionLink>
    </main>
  );
}
