"use client";

/**
 * Three reasons to trust the checkout, in a row. The first marker carries the
 * live Padlock: the drawer flips `locked` when its content has arrived and
 * again when the deposit is held, so the lock clicks at both moments.
 */

import { Padlock } from "./Padlock";
import styles from "./TrustMarkers.module.css";

export interface TrustMarkersProps {
  locked: boolean;
  className?: string;
}

function ShieldCheck() {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 3.25 5 6v5.25c0 4.4 2.9 7.9 7 9.5 4.1-1.6 7-5.1 7-9.5V6l-7-2.75Z" />
      <path d="m9 12.25 2.1 2.1L15.25 10" />
    </svg>
  );
}

function CalendarReturn() {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="3.75" y="5" width="16.5" height="15" rx="1.25" />
      <path d="M3.75 9.5h16.5M8 3v3.5M16 3v3.5" />
      <path d="M14.25 13.5H10.5a1.75 1.75 0 0 0 0 3.5h.5" />
      <path d="m12.75 11.75 1.75 1.75-1.75 1.75" />
    </svg>
  );
}

export function TrustMarkers({ locked, className }: TrustMarkersProps) {
  const classes = [styles.list, className].filter(Boolean).join(" ");
  return (
    <ul className={classes} aria-label="Why you can book with confidence">
      <li className={styles.marker}>
        <span className={styles.glyph}>
          <Padlock state={locked ? "closed" : "open"} size={22} />
        </span>
        <span className={styles.text}>
          <span className={`t-caps ${styles.label}`}>Encrypted checkout</span>
          <span className={styles.body}>256-bit TLS, card details never touch our servers</span>
        </span>
      </li>
      <li className={styles.marker}>
        <span className={styles.glyph}>
          <ShieldCheck />
        </span>
        <span className={styles.text}>
          <span className={`t-caps ${styles.label}`}>14-day refund</span>
          <span className={styles.body}>Change your mind, keep every cent</span>
        </span>
      </li>
      <li className={styles.marker}>
        <span className={styles.glyph}>
          <CalendarReturn />
        </span>
        <span className={styles.text}>
          <span className={`t-caps ${styles.label}`}>Small group, confirmed</span>
          <span className={styles.body}>Departures run at 6 travellers or more</span>
        </span>
      </li>
    </ul>
  );
}
