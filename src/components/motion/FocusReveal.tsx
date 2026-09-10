"use client";

/**
 * Blur-to-focus. A pre-blurred copy of the image sits on top of the sharp
 * one; as the section approaches, the blurred layer fades away and the frame
 * settles from `scale` to 1, with a whisper of extra scale on the blur layer
 * so it reads as a focus pull rather than a crossfade. Opacity and transform
 * only — never a live filter: blur() on a large image (60 fps rule 2).
 */

import Image from "next/image";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { gsap, ScrollTrigger, setupGsap } from "./gsapSetup";
import { EASE_FABLE } from "@/lib/easing";
import { useReducedMotion } from "@/lib/useReducedMotion";
import type { MediaImage } from "@/lib/types";
import styles from "./FocusReveal.module.css";

export interface FocusRevealProps {
  image: MediaImage;
  className?: string;
  sizes?: string;
  /** Overlay content (caption, link) rendered above the image. */
  children?: ReactNode;
  /** true: scrubbed over the approach; a number adds smoothing (s); false: play once on enter. @default true */
  scrub?: boolean | number;
  /** Starting scale of the frame. @default 1.08 */
  scale?: number;
  /** CSS aspect-ratio. Defaults to the image's intrinsic ratio. */
  ratio?: string;
  transitionHero?: boolean;
}

/** Extra scale on the blurred layer: the out-of-focus plate looks larger. */
const BLUR_SCALE = 1.03;
const ONCE_DURATION = 1.6;
/** Intrinsic width handed to next/image for the blurred layer (tiny srcset). */
const BLUR_WIDTH = 160;

export function FocusReveal({
  image,
  className,
  sizes = "100vw",
  children,
  scrub = true,
  scale = 1.08,
  ratio,
  transitionHero = false,
}: FocusRevealProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const blurRef = useRef<HTMLImageElement | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const blur = blurRef.current;
    if (!root || !stage || !blur || reduced) return;

    setupGsap();
    const once = scrub === false;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true });
      tl.fromTo(stage, { scale }, { scale: 1, duration: 1, ease: once ? EASE_FABLE : "none" }, 0)
        // Sharpness arrives late in the travel, the way a lens finds focus.
        .fromTo(
          blur,
          { scale: BLUR_SCALE, opacity: 1 },
          { scale: 1, opacity: 0, duration: 1, ease: once ? EASE_FABLE : "power1.in" },
          0,
        );

      if (once) {
        tl.duration(ONCE_DURATION);
        ScrollTrigger.create({
          trigger: root,
          start: "top 80%",
          once: true,
          onEnter: () => tl.play(),
        });
      } else {
        ScrollTrigger.create({
          trigger: root,
          start: "top 90%",
          end: "center 55%",
          scrub,
          animation: tl,
        });
      }
    }, root);

    return () => ctx.revert();
  }, [reduced, scrub, scale]);

  const style = {
    "--focus-ratio": ratio ?? `${image.width} / ${image.height}`,
    "--focus-scale": scale,
    "--focus-blur-scale": BLUR_SCALE,
  } as CSSProperties;

  const classes = [styles.root, className ?? ""].filter(Boolean).join(" ");
  const blurHeight = Math.max(1, Math.round((BLUR_WIDTH * image.height) / image.width));

  return (
    <div
      ref={rootRef}
      className={classes}
      style={style}
      data-transition-hero={transitionHero ? image.src : undefined}
    >
      <div className={styles.frame}>
        <div ref={stageRef} className={styles.stage}>
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes={sizes}
            quality={75}
            className={styles.img}
            draggable={false}
          />
          <Image
            ref={blurRef}
            src={image.blur}
            alt=""
            width={BLUR_WIDTH}
            height={blurHeight}
            quality={60}
            aria-hidden="true"
            className={styles.blur}
            draggable={false}
          />
        </div>
        {children != null && <div className={styles.overlay}>{children}</div>}
      </div>
    </div>
  );
}
