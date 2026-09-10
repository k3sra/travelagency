import { formatPrice } from "@/lib/journeys";
import type { Journey } from "@/lib/types";
import styles from "./Inclusions.module.css";

export interface InclusionsProps {
  journey: Pick<Journey, "inclusions" | "price">;
}

/** What the price covers, and the price itself, stated plainly beside its deposit. */
export function Inclusions({ journey }: InclusionsProps) {
  const price = formatPrice(journey.price.amount, journey.price.currency);
  const deposit = formatPrice(journey.price.deposit, journey.price.currency);

  return (
    <section className={`container ${styles.section}`} aria-labelledby="inclusions-title">
      <div className={styles.grid}>
        <div className={styles.listCol}>
          <h2 id="inclusions-title" className={`t-caps t-muted ${styles.eyebrow}`}>
            Included
          </h2>
          <ul className={styles.list}>
            {journey.inclusions.map((item) => (
              <li key={item} className={styles.item}>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.price}>
          <p className="t-caps t-muted">The price</p>
          <p className={styles.amount}>
            <span className={styles.aside}>from </span>
            {price}
            <span className={styles.aside}> per traveller</span>
          </p>
          <p className={`t-body t-muted ${styles.deposit}`}>
            Deposit {deposit} holds your place · balance 60 days before departure
          </p>
        </div>
      </div>
    </section>
  );
}
