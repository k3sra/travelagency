"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Parallax } from "@/components/motion/Parallax";
import { ScrollTrigger, setupGsap } from "@/components/motion/gsapSetup";
import type { Journey } from "@/lib/types";
import styles from "./Itinerary.module.css";

export function Itinerary({ trip }: { trip: Journey }) {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    setupGsap();
    const triggers = Array.from(el.querySelectorAll<HTMLElement>("[data-block]")).map((block, i) =>
      ScrollTrigger.create({ trigger: block, start: "top center", end: "bottom center", onToggle: (self) => { if (self.isActive) setActive(i); } }),
    );
    return () => triggers.forEach((t) => t.kill());
  }, []);

  return (
    <section ref={root} className={`section ${styles.itin}`} aria-labelledby="itin-title">
      <div className={`container ${styles.grid}`}>
        <div className={styles.side}>
          <div className={styles.sticky}>
            <p className="t-label t-sun">The week</p>
            <h2 id="itin-title" className={`t-h2 ${styles.title}`}>Five days you will talk about.</h2>
            <ol className={styles.list}>
              {trip.chapters.map((c, i) => (
                <li key={c.numeral} className={`${styles.item} ${i === active ? styles.active : ""}`}>
                  <span className={styles.dotWrap}><span className={styles.dot} /></span>
                  <span className={`t-label ${styles.num}`}>{c.numeral}</span>
                  <span className={styles.itemTitle}>{c.title}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className={styles.blocks}>
          {trip.chapters.map((c) => (
            <article key={c.numeral} className={styles.block} data-block>
              <Parallax speed={0.14} className={styles.parallax}>
                <div className={styles.frame}>
                  <Image src={c.image.src} alt={c.image.alt} fill sizes="(max-width: 900px) 100vw, 58vw" className={styles.img} />
                  <span className={styles.scrim} aria-hidden="true" />
                  <span className={styles.day}>{c.days}</span>
                </div>
              </Parallax>
              <h3 className={`t-h3 ${styles.blockTitle}`}>{c.title}</h3>
              <p className={`t-lead ${styles.body}`}>{c.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
