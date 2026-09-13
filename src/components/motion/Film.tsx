"use client";

/**
 * A full-bleed film with a still ground. The pre-blurred still is painted
 * first, the sharp still resolves over it, and the film fades up once it is
 * really playing. Phones get the portrait cut and the lighter encode; reduced
 * motion and data-saver keep the still. The visible still carries
 * `data-transition-hero` so the WebGL transition can leave from, and land on,
 * exactly this frame.
 */

import { useEffect, useRef } from "react";
import type { Film as FilmSource } from "@/lib/media";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import styles from "./Film.module.css";

export interface FilmProps {
  film: FilmSource | null;
  poster: { wide: string; wideBlur: string; tall?: string; tallBlur?: string };
  /** Below this width the portrait cut and poster are used. @default 700 */
  narrowBelow?: number;
  className?: string;
  /** Called once the film plays, or once it is decided that it will not. */
  onReady?: () => void;
  transitionHero?: boolean;
  /** Extra zoom over the still so the film's slight crop never shows an edge. */
  children?: React.ReactNode;
}

type SaveDataNavigator = Navigator & { connection?: { saveData?: boolean } };

export function Film({ film, poster, narrowBelow = 700, className = "", onReady, transitionHero = false, children }: FilmProps) {
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const readyRef = useRef(onReady);

  useEffect(() => {
    readyRef.current = onReady;
  });

  useEffect(() => {
    const el = root.current;
    const v = video.current;
    if (!el || !v) return;
    let settled = false;
    const settle = (state: "film" | "still") => {
      if (settled) return;
      settled = true;
      el.dataset.state = state;
      readyRef.current?.();
    };

    const narrow = window.innerWidth < narrowBelow;
    el.dataset.cut = narrow && poster.tall ? "tall" : "wide";

    // The sharp still resolves the moment it has loaded, whatever the film
    // does: a slow or dropped stream must never leave the frame out of focus.
    const stillUrl = narrow && poster.tall ? poster.tall : poster.wide;
    const still = new Image();
    const onStill = () => { el.dataset.still = "ready"; };
    still.addEventListener("load", onStill);
    still.addEventListener("error", onStill);
    still.src = stillUrl;
    if (still.complete) onStill();
    const source = narrow && film?.tall ? film.tall : film?.wide;
    const saveData = Boolean((navigator as SaveDataNavigator).connection?.saveData);
    if (!source || prefersReducedMotion() || saveData) {
      settle("still");
      return () => {
        still.removeEventListener("load", onStill);
        still.removeEventListener("error", onStill);
      };
    }

    const onPlaying = () => settle("film");
    const onError = () => settle("still");
    v.addEventListener("playing", onPlaying);
    v.addEventListener("error", onError, true);
    v.addEventListener("stalled", onError);
    v.addEventListener("abort", onError);
    v.src = narrow || window.innerWidth < 1100 ? source.sd : source.hd;
    v.load();
    const attempt = v.play();
    if (attempt && typeof attempt.catch === "function") attempt.catch(() => {});
    const timeout = window.setTimeout(() => settle("still"), 4500);

    return () => {
      window.clearTimeout(timeout);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("error", onError, true);
      v.removeEventListener("stalled", onError);
      v.removeEventListener("abort", onError);
      still.removeEventListener("load", onStill);
      still.removeEventListener("error", onStill);
      v.pause();
      v.removeAttribute("src");
      v.load();
    };
  }, [film, poster.wide, poster.tall, narrowBelow]);

  return (
    <div ref={root} className={`${styles.root} ${className}`} data-state="loading" data-cut="wide" aria-hidden="true">
      <div className={`${styles.layer} ${styles.wide}`} data-transition-hero={transitionHero ? poster.wide : undefined}>
        <div className={styles.blur} style={{ backgroundImage: `url(${poster.wideBlur})` }} />
        <div className={styles.still} style={{ backgroundImage: `url(${poster.wide})` }} />
      </div>
      {poster.tall ? (
        <div className={`${styles.layer} ${styles.tall}`} data-transition-hero={transitionHero ? poster.tall : undefined}>
          <div className={styles.blur} style={{ backgroundImage: `url(${poster.tallBlur ?? poster.tall})` }} />
          <div className={styles.still} style={{ backgroundImage: `url(${poster.tall})` }} />
        </div>
      ) : null}
      <video ref={video} className={styles.video} muted loop playsInline preload="metadata" disablePictureInPicture tabIndex={-1} />
      {children}
    </div>
  );
}
