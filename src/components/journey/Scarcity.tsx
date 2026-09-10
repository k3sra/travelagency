import styles from "./Scarcity.module.css";

export interface ScarcityProps {
  /** Seats still open. */
  n: number;
  /** @default "sm" */
  size?: "sm" | "lg";
  className?: string;
}

/**
 * "[ 2 Spots Remaining ]" — the count exactly as it stands in the data.
 * Static text (no live region). The gold pulse runs only for the last two
 * seats, and never under reduced motion.
 */
export function Scarcity({ n, size = "sm", className }: ScarcityProps) {
  const count = Math.max(0, Math.floor(n));
  const label =
    count === 0 ? "Fully Booked" : `${count} ${count === 1 ? "Spot" : "Spots"} Remaining`;
  const classes = [
    styles.tag,
    styles[size],
    count > 0 && count <= 2 ? styles.pulse : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={classes}>{`[ ${label} ]`}</span>;
}
