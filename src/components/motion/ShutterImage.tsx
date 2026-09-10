"use client";

/**
 * Geometric slat reveal + parallax scale.
 * Slats in the plate colour cover the image and retract (scaleY/scaleX 1 → 0,
 * stagger 0.06, ease "cinematic") once the box enters, while the image settles
 * from `scale` to 1 (DUR.reveal, ease "fable"). The reveal waits for the image
 * to have loaded so the slats never open onto an empty plate. A scrubbed
 * yPercent parallax rides the box's travel through the viewport.
 * Transform/opacity only; the initial state is pure CSS (no flash).
 */

import Image from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";
import { gsap, ScrollTrigger, setupGsap } from "./gsapSetup";
import { DUR, EASE_CINEMATIC, EASE_FABLE } from "@/lib/easing";
import { useReducedMotion } from "@/lib/useReducedMotion";
import type { MediaImage } from "@/lib/types";
import styles from "./ShutterImage.module.css";

export interface ShutterImageProps {
  image: MediaImage;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** @default 6 */
  slats?: number;
  /** Slat orientation. @default "vertical" */
  direction?: "vertical" | "horizontal";
  /** 0–1, fraction of height travelled over the scroll. @default 0.12 */
  parallax?: number;
  /** Starting scale. @default 1.18 */
  scale?: number;
  /** ScrollTrigger start. @default "top 80%" */
  start?: string;
  /** Slat colour. Defaults to the section plate (`.on-forest` → forest). */
  plate?: "forest" | "vellum";
  /** CSS aspect-ratio. Defaults to the image's intrinsic ratio. */
  ratio?: string;
  transitionHero?: boolean;
}

const SLAT_DURATION = 0.9;
const SLAT_STAGGER = 0.06;
/** Seconds to wait for the image before opening the slats regardless. */
const LOAD_TIMEOUT = 3;

export function ShutterImage({
  image,
  className,
  sizes = "100vw",
  priority = false,
  slats = 6,
  direction = "vertical",
  parallax = 0.12,
  scale = 1.18,
  start = "top 80%",
  plate,
  ratio,
  transitionHero = false,
}: ShutterImageProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const mediaRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const slatsRef = useRef<HTMLDivElement | null>(null);
  const loadedRef = useRef(false);
  const revealRef = useRef<(() => void) | null>(null);
  const reduced = useReducedMotion();

  const travel = Math.min(Math.max(parallax, 0), 0.6);
  // Oversize the media wrapper so a ±travel/2 yPercent move never shows an
  // edge: solve (t/2)(1 + 2x) <= x for x, plus a hair for rounding.
  const overscan = travel > 0 ? (travel / (2 * (1 - travel))) * 100 + 0.5 : 0;
  const count = Math.max(1, Math.min(24, Math.round(slats)));

  useEffect(() => {
    const root = rootRef.current;
    const media = mediaRef.current;
    const img = imgRef.current;
    const slatsEl = slatsRef.current;
    if (!root || !media || !img || !slatsEl || reduced) return;

    setupGsap();
    let fallback: gsap.core.Tween | null = null;

    const ctx = gsap.context(() => {
      const bars = Array.from(slatsEl.children);
      const axis = direction === "vertical" ? "scaleY" : "scaleX";

      const reveal = gsap.timeline({ paused: true });
      reveal
        .to(
          bars,
          { [axis]: 0, duration: SLAT_DURATION, ease: EASE_CINEMATIC, stagger: SLAT_STAGGER },
          0,
        )
        .fromTo(img, { scale }, { scale: 1, duration: DUR.reveal, ease: EASE_FABLE }, 0);

      let entered = false;
      const play = () => {
        if (!entered || !loadedRef.current) return;
        revealRef.current = null;
        fallback?.kill();
        reveal.play();
      };
      revealRef.current = play;

      ScrollTrigger.create({
        trigger: root,
        start,
        once: true,
        onEnter: () => {
          entered = true;
          play();
          if (!loadedRef.current) {
            fallback = gsap.delayedCall(LOAD_TIMEOUT, () => {
              loadedRef.current = true;
              play();
            });
          }
        },
      });

      if (travel > 0) {
        gsap.fromTo(
          media,
          { yPercent: -travel * 50 },
          {
            yPercent: travel * 50,
            ease: "none",
            scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      }
    }, root);

    return () => {
      revealRef.current = null;
      fallback?.kill();
      ctx.revert();
    };
  }, [reduced, direction, scale, start, travel, count]);

  const onLoad = () => {
    loadedRef.current = true;
    revealRef.current?.();
  };

  const style = {
    "--shutter-ratio": ratio ?? `${image.width} / ${image.height}`,
    "--shutter-scale": scale,
    "--shutter-over": `${overscan}%`,
    "--shutter-n": count,
  } as CSSProperties;

  const classes = [
    styles.root,
    plate === "forest" ? styles.plateForest : "",
    plate === "vellum" ? styles.plateVellum : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={rootRef}
      className={classes}
      style={style}
      data-transition-hero={transitionHero ? image.src : undefined}
    >
      <div className={styles.frame}>
        <div ref={mediaRef} className={styles.media}>
          <Image
            ref={imgRef}
            src={image.src}
            alt={image.alt}
            fill
            sizes={sizes}
            quality={priority ? 90 : 75}
            preload={priority}
            fetchPriority={priority ? "high" : undefined}
            className={styles.img}
            onLoad={onLoad}
            onError={onLoad}
            draggable={false}
          />
        </div>
        <div
          ref={slatsRef}
          className={`${styles.slats} ${direction === "vertical" ? styles.vertical : styles.horizontal}`}
          aria-hidden="true"
        >
          {Array.from({ length: count }, (_, i) => (
            <span key={i} className={styles.slat} style={{ "--i": i } as CSSProperties} />
          ))}
        </div>
      </div>
    </div>
  );
}
