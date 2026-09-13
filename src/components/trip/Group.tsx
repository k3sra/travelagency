"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap, ScrollTrigger, setupGsap } from "@/components/motion/gsapSetup";
import type { Journey } from "@/lib/types";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import styles from "./Group.module.css";

export function Group({ trip }: { trip: Journey }) {
  const root = useRef<HTMLElement>(null);
  const taken = trip.groupMax - trip.spotsRemaining;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    setupGsap();
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const fills = el.querySelectorAll<HTMLElement>("[data-fill]");
      ScrollTrigger.create({
        trigger: el,
        start: "top 70%",
        once: true,
        onEnter: () => fills.forEach((f) => gsap.fromTo(f, { scaleX: 0 }, { scaleX: Number(f.dataset.fill) / 100, duration: 1.2, ease: "fable", delay: 0.1 })),
      });
    }, el);
    return () => ctx.revert();
  }, []);

  const people = [...trip.travellers, ...trip.travellers];
  return (
    <section ref={root} id="group" className={`section ${styles.group}`} aria-labelledby="group-title">
      <div className={`container ${styles.head}`}>
        <p className="t-label t-sun">Who is already in</p>
        <h2 id="group-title" className={`t-h2 ${styles.title}`}>{taken} of {trip.groupMax} confirmed.</h2>
      </div>
      <div className={`container ${styles.grid}`}>
        <div className={styles.marquee} aria-label="Confirmed travellers">
          <div className={styles.track}>
            {people.map((p, i) => (
              <div key={`${p.id}-${i}`} className={styles.person}>
                <Image src={p.portrait} alt="" width={112} height={112} className={styles.avatar} />
                <span className={styles.who}>
                  <span className={`t-lead ${styles.name}`}>{p.firstName} · {p.from}</span>
                  <span className={`t-label ${styles.match}`}>{p.match}% match</span>
                </span>
              </div>
            ))}
          </div>
          <span className={`${styles.fade} ${styles.fadeTop}`} aria-hidden="true" />
          <span className={`${styles.fade} ${styles.fadeBottom}`} aria-hidden="true" />
        </div>
        <div className={styles.side}>
          <ul className={styles.meters} aria-label="The vibe">
            {trip.vibe.map((v) => (
              <li key={v.label} className={styles.meter}>
                <span className={styles.meterHead}>
                  <span className="t-label">{v.label}</span>
                  <span className={`t-h3 ${styles.pct}`}>{v.pct}%</span>
                </span>
                <span className={styles.trackLine}><span className={styles.fill} data-fill={v.pct} /></span>
              </li>
            ))}
          </ul>
          <div className={styles.host}>
            <Image src={trip.curator.portrait} alt="" width={96} height={96} className={styles.hostAvatar} />
            <div className={styles.hostText}>
              <p className={`t-h3 ${styles.hostName}`}>{trip.curator.name}</p>
              <p className={`t-label ${styles.hostRole}`}>{trip.curator.role}</p>
              <p className={`t-body ${styles.hostBio}`}>{trip.curator.bio}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
