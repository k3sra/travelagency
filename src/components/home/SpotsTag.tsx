import styles from "./SpotsTag.module.css";

/** "[ 2 Spots Remaining ]" — quiet, true to the data, pulsing only when it matters. */
export function SpotsTag({ n, className = "" }: { n: number; className?: string }) {
  const urgent = n <= 2;
  return (
    <span className={`t-caps ${styles.tag} ${urgent ? styles.urgent : ""} ${className}`}>
      [ {n} {n === 1 ? "Spot" : "Spots"} Remaining ]
    </span>
  );
}
