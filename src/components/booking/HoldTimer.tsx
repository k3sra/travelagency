"use client";

/**
 * A quiet ten-minute hold on the seat while the traveller decides. Counts
 * down once a second from the moment it mounts; when it runs out the seat is
 * simply no longer promised, nothing is lost.
 */

import { useEffect, useState } from "react";
import styles from "./HoldTimer.module.css";

const HOLD_SECONDS = 10 * 60;

/** Mount it when the hold starts (key it on the drawer opening) and it counts from then. */
export function HoldTimer() {
  const [left, setLeft] = useState(HOLD_SECONDS);

  useEffect(() => {
    const started = Date.now();
    const id = window.setInterval(() => {
      setLeft(Math.max(0, HOLD_SECONDS - Math.floor((Date.now() - started) / 1000)));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const m = Math.floor(left / 60);
  const s = String(left % 60).padStart(2, "0");
  return (
    <p className={`t-caps ${styles.root}`} aria-live="off">
      {left > 0 ? (
        <>
          This seat is held for you for <span className={styles.time}>{m}:{s}</span>
        </>
      ) : (
        "The hold has lapsed. The seat is still open if nobody has taken it."
      )}
    </p>
  );
}
