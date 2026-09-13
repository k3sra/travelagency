"use client";

/**
 * A film that wakes on hover (fine pointers) or when most of it is on screen
 * (coarse pointers), and sleeps again when it leaves. Lays over a still; the
 * still stays underneath so nothing flashes while the stream buffers. The
 * lighter encode is always used here: these are glimpses, not the feature.
 */

import { useEffect, useRef } from "react";
import type { Film } from "@/lib/media";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import styles from "./LiveFilm.module.css";

export function LiveFilm({ film, className = "" }: { film: Film | null; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = root.current;
    const v = video.current;
    if (!el || !v || !film) return;
    if (prefersReducedMotion()) return;
    const src = film.wide.sd;
    const host = el.parentElement ?? el;
    let armed = false;

    const wake = () => {
      if (!armed) {
        armed = true;
        v.src = src;
        v.load();
      }
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };
    const sleep = () => {
      v.pause();
      el.dataset.live = "off";
    };
    const onPlaying = () => { el.dataset.live = "on"; };
    v.addEventListener("playing", onPlaying);

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let io: IntersectionObserver | null = null;
    if (fine) {
      host.addEventListener("pointerenter", wake);
      host.addEventListener("pointerleave", sleep);
    } else {
      io = new IntersectionObserver(
        (entries) => entries.forEach((e) => (e.intersectionRatio >= 0.6 ? wake() : sleep())),
        { threshold: [0, 0.6] },
      );
      io.observe(host);
    }
    return () => {
      v.removeEventListener("playing", onPlaying);
      host.removeEventListener("pointerenter", wake);
      host.removeEventListener("pointerleave", sleep);
      io?.disconnect();
      v.pause();
      v.removeAttribute("src");
      v.load();
    };
  }, [film]);

  if (!film) return null;
  return (
    <div ref={root} className={`${styles.root} ${className}`} data-live="off" aria-hidden="true">
      <video ref={video} className={styles.video} muted loop playsInline preload="none" disablePictureInPicture tabIndex={-1} />
    </div>
  );
}
