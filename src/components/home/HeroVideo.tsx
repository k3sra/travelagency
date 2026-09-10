"use client";

/**
 * The slow-motion background. A pre-blurred poster is the ground; the video
 * fades up over it once it is actually playing, so the first thing anyone
 * sees is a soft frame resolving into motion, never a black box. Reduced
 * motion and data-saver keep the still.
 */

import { useEffect, useRef } from "react";
import { HERO_VIDEO } from "@/lib/media";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import styles from "./HeroVideo.module.css";

export interface HeroVideoProps {
  /** Resolves when the video is playing, or when it will not play. */
  onReady?: () => void;
  className?: string;
}

type SaveDataNavigator = Navigator & { connection?: { saveData?: boolean } };

export function HeroVideo({ onReady, className = "" }: HeroVideoProps) {
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
    const settle = (state: "video" | "still") => {
      if (settled) return;
      settled = true;
      el.dataset.state = state;
      readyRef.current?.();
    };

    const saveData = Boolean((navigator as SaveDataNavigator).connection?.saveData);
    if (prefersReducedMotion() || saveData) {
      v.removeAttribute("autoplay");
      v.pause();
      settle("still");
      return;
    }

    const onPlaying = () => settle("video");
    const onError = () => settle("still");
    v.addEventListener("playing", onPlaying);
    v.addEventListener("error", onError, true);
    // If the browser refuses autoplay or the file is missing, show the still
    // rather than waiting forever.
    const timeout = window.setTimeout(() => settle("still"), 3500);
    const attempt = v.play();
    if (attempt && typeof attempt.catch === "function") attempt.catch(() => {});

    return () => {
      window.clearTimeout(timeout);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("error", onError, true);
    };
  }, []);

  return (
    <div
      ref={root}
      className={`${styles.root} ${className}`}
      data-state="loading"
      data-transition-hero={HERO_VIDEO.poster}
      aria-hidden="true"
    >
      {/* Ground: the blurred still, then the sharp still, then the moving picture. */}
      <div className={styles.blur} style={{ backgroundImage: `url(${HERO_VIDEO.posterBlur})` }} />
      <div className={styles.still} style={{ backgroundImage: `url(${HERO_VIDEO.poster})` }} />
      <video
        ref={video}
        className={styles.video}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={HERO_VIDEO.poster}
        disablePictureInPicture
        tabIndex={-1}
      >
        <source src={HERO_VIDEO.webm} type="video/webm" />
        <source src={HERO_VIDEO.mp4} type="video/mp4" />
      </video>
    </div>
  );
}
