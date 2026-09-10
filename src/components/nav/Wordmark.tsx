import styles from "./Wordmark.module.css";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`${styles.wordmark} ${className}`} aria-label="Fable Travels">
      <span className={styles.fable}>Fable</span>
      <span className={styles.travels}>Travels</span>
    </span>
  );
}
