import styles from "./RiskLine.module.css";

/** The three words that lower the barrier, kept next to every price. */
export function RiskLine({ className = "" }: { className?: string }) {
  return (
    <p className={`t-caps ${styles.root} ${className}`}>
      Free cancellation for 14 days · No booking fees
    </p>
  );
}
