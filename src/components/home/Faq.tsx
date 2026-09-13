"use client";

import { useState } from "react";
import { FAQ } from "@/lib/content";
import styles from "./Faq.module.css";

export function Faq() {
  const [open, setOpen] = useState<number>(0);
  return (
    <section id="faq" className={`section ${styles.faq}`} aria-labelledby="faq-title">
      <div className={`container ${styles.inner}`}>
        <div className={styles.head}>
          <p className="t-label t-sun">Before you ask</p>
          <h2 id="faq-title" className={`t-h2 ${styles.title}`}>Straight answers.</h2>
          <p className={`t-body ${styles.lead}`}>Anything else, message us. A person replies within a day, usually within the hour.</p>
        </div>
        <ul className={styles.list}>
          {FAQ.map((item, i) => {
            const isOpen = open === i;
            return (
              <li key={item.q} className={styles.item} data-open={isOpen}>
                <button type="button" className={styles.q} aria-expanded={isOpen} aria-controls={`faq-${i}`} onClick={() => setOpen(isOpen ? -1 : i)}>
                  <span className={`t-h3 ${styles.qText}`}>{item.q}</span>
                  <span className={styles.plus} aria-hidden="true" />
                </button>
                <div id={`faq-${i}`} className={styles.a} role="region">
                  <div className={styles.aInner}>
                    <p className="t-body">{item.a}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
