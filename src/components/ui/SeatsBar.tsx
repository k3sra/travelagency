import styles from "./SeatsBar.module.css";

/**
 * "8 of 10 seats taken" with a thin gold bar. The same inventory as the
 * spots tag, framed as a race already most of the way run.
 */
export function SeatsBar({ taken, total, className = "" }: { taken: number; total: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round((taken / total) * 100)));
  return (
    <span className={`${styles.root} ${className}`} role="img" aria-label={`${taken} of ${total} seats taken`}>
      <span className={`t-caps ${styles.label}`}>
        {taken} of {total} seats taken
      </span>
      <span className={styles.track} aria-hidden="true">
        <span className={styles.fill} style={{ width: `${pct}%` }} />
      </span>
    </span>
  );
}
