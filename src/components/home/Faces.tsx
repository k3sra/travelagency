"use client";

import { TextReveal } from "@/components/motion/TextReveal";
import { useEffect, useRef } from "react";
import Image from "next/image";
import { TransitionLink } from "@/components/gl/TransitionLink";
import { Magnetic } from "@/components/motion/Magnetic";
import { gsap, ScrollTrigger, setupGsap } from "@/components/motion/gsapSetup";
import { getTrips } from "@/lib/journeys";
import { portrait } from "@/lib/media";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import styles from "./Faces.module.css";

const STATS = [
  { value: 32, label: "Average age", prefix: "" },
  { value: 12, label: "Seats a week", prefix: "" },
  { value: 3, label: "Book again", prefix: "1 in " },
  { value: 0, label: "Name badges", prefix: "" },
];

export function Faces() {
  const root = useRef<HTMLElement>(null);
  const people = Array.from(new Map(getTrips().flatMap((t) => t.travellers).map((p) => [p.firstName, p])).values());

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    setupGsap();
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      el.querySelectorAll<HTMLElement>("[data-count]").forEach((node) => {
        const to = Number(node.dataset.count);
        const n = { v: 0 };
        ScrollTrigger.create({
          trigger: node,
          start: "top 85%",
          once: true,
          onEnter: () => {
            if (to === 0) {
              gsap.fromTo(node, { scale: 0.6 }, { scale: 1, duration: 0.8, ease: "elastic.out(1, 0.5)" });
              return;
            }
            gsap.to(n, { v: to, duration: 1.4, ease: "fable", onUpdate: () => { node.textContent = String(Math.round(n.v)); } });
          },
        });
      });
      const cells = el.querySelectorAll<HTMLElement>("[data-cell]");
      gsap.set(cells, { opacity: 0, y: 24 });
      ScrollTrigger.batch(cells, { start: "top 90%", once: true, onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, duration: 0.8, ease: "fable", stagger: 0.05 }) });
    }, el);
    return () => ctx.revert();
  }, []);

  const names = [...people, ...people];
  return (
    <section ref={root} id="faces" className={`section ${styles.faces}`} aria-labelledby="faces-title" data-mood="sea">
      <div className={`container ${styles.head}`}>
        <p className="t-label t-sun">Who comes</p>
        <TextReveal as="h2" id="faces-title" className={`t-h2 ${styles.title}`}>Twelve people who move like you.</TextReveal>
        <p className={`t-body ${styles.lead}`}>Every application is read by a person. We build each group around energy and pace, not age or job title, and we say no when a week is not the right fit.</p>
      </div>
      <dl className={`container ${styles.stats}`}>
        {STATS.map((s) => (
          <div key={s.label} className={styles.stat}>
            <dd className={`t-display ${styles.value}`}>
              {s.prefix}
              <span data-count={s.value}>{s.value === 0 ? "0" : "0"}</span>
            </dd>
            <dt className={`t-label ${styles.label}`}>{s.label}</dt>
          </div>
        ))}
      </dl>
      <ul className={`container ${styles.grid}`} aria-label="Some of the people on recent weeks">
        {Array.from({ length: 16 }, (_, i) => (
          <li key={i} className={styles.cell} data-cell>
            <Image src={portrait(i + 1)} alt="" width={600} height={800} sizes="(max-width: 899px) 25vw, 12vw" className={styles.img} />
            <span className={styles.tint} aria-hidden="true" />
          </li>
        ))}
      </ul>
      <div className={styles.marquee} aria-hidden="true">
        <div className={styles.track}>
          {names.map((p, i) => (
            <span key={i} className={`t-label ${styles.name}`}>{p.firstName}, {p.from}<span className={styles.dot} /></span>
          ))}
        </div>
      </div>
      <div className={`container ${styles.cta}`}>
        <Magnetic>
          <TransitionLink href="/trips" kind="dissolve" className="btn btn--lg">Apply now</TransitionLink>
        </Magnetic>
      </div>
    </section>
  );
}
