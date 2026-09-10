"use client";

/**
 * SplitText unmask — lines (or words / chars) rise from a clipped mask,
 * staggered top to bottom with the heavy "fable" settle. SplitText rebuilds
 * the split on font load and resize (autoSplit) and re-creates the tween in
 * `onSplit`, preserving the playhead, so line breaks are always true to the
 * layout.
 *
 * Accessibility: the animated copy is aria-hidden; an identical, visually
 * hidden copy carries the text for assistive tech, so `<em>` and `<br/>`
 * survive and no aria-label lands on a paragraph. Children must be static
 * (change the `key` to re-split with new copy).
 */

import {
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type ElementType,
  type ReactNode,
  type Ref,
} from "react";
import { gsap, ScrollTrigger, SplitText, setupGsap } from "./gsapSetup";
import { DUR, EASE_FABLE } from "@/lib/easing";
import { useReducedMotion } from "@/lib/useReducedMotion";
import styles from "./TextReveal.module.css";

export interface TextRevealHandle {
  play(): void;
  reset(): void;
}

type SplitMode = "lines" | "words" | "chars";
type TriggerMode = "scroll" | "mount" | "manual";

export interface TextRevealProps {
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  /** Plain text, <em> and <br/> allowed. Must be static. */
  children: ReactNode;
  className?: string;
  /** Forwarded to the rendered element (e.g. for aria-labelledby). */
  id?: string;
  /** @default "lines" */
  split?: SplitMode;
  /** @default "scroll" */
  trigger?: TriggerMode;
  /** ScrollTrigger start. @default "top 85%" */
  start?: string;
  delay?: number;
  stagger?: number;
  duration?: number;
  /** Imperative handle for trigger="manual". */
  ref?: Ref<TextRevealHandle>;
}

// Words stay whole when splitting chars; lines re-split on resize/font load.
const SPLIT_TYPE: Record<SplitMode, string> = {
  lines: "lines",
  words: "words",
  chars: "words,chars",
};

const DEFAULT_STAGGER: Record<SplitMode, number> = {
  lines: DUR.lineStagger,
  words: 0.035,
  chars: 0.014,
};

// Display type sits at line-height 0.98, so glyphs overflow their line box.
// The mask clips with a clip-path that reaches past the box (compositor-only)
// instead of SplitText's overflow: clip, which would shear descenders at rest.
// The bottom reach (0.19em) clears Playfair's descenders yet stays short of
// the ascender tops of a fragment parked at yPercent 110, so nothing peeks
// before the rise.
const MASK_CLIP = "inset(-0.12em -0.06em -0.19em -0.06em)";

export function TextReveal({
  as = "p",
  children,
  className,
  id,
  split = "lines",
  trigger = "scroll",
  start = "top 85%",
  delay = 0,
  stagger,
  duration,
  ref,
}: TextRevealProps) {
  const visualRef = useRef<HTMLSpanElement | null>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const playedRef = useRef(false);
  const reduced = useReducedMotion();

  useImperativeHandle(
    ref,
    () => ({
      play() {
        playedRef.current = true;
        tweenRef.current?.play();
      },
      reset() {
        playedRef.current = false;
        tweenRef.current?.pause(0);
      },
    }),
    [],
  );

  useLayoutEffect(() => {
    const visual = visualRef.current;
    if (!visual) return;

    // The CSS `pending` state keeps the unsplit copy invisible until the
    // (synchronous) split has pushed every fragment below its mask, so there
    // is never a painted frame of unmasked text. The inline style survives
    // React re-applying className on later renders.
    const show = () => {
      visual.classList.remove(styles.pending);
      visual.style.visibility = "visible";
    };

    if (reduced) {
      show();
      return;
    }

    setupGsap();
    const each = stagger ?? DEFAULT_STAGGER[split];
    const dur = duration ?? DUR.line;

    // The visual span is a block filling the root, so it doubles as the
    // ScrollTrigger element and the context scope.
    const ctx = gsap.context(() => {
      if (trigger === "scroll") {
        ScrollTrigger.create({
          trigger: visual,
          start,
          once: true,
          onEnter: () => {
            playedRef.current = true;
            tweenRef.current?.play();
          },
        });
      }

      SplitText.create(visual, {
        type: SPLIT_TYPE[split],
        mask: split,
        autoSplit: split === "lines",
        tag: "span",
        aria: "none",
        linesClass: "line",
        wordsClass: "word",
        charsClass: "char",
        onSplit: (self) => {
          gsap.set(self.masks, { overflow: "visible", clipPath: MASK_CLIP });
          const tween = gsap.from(self[split], {
            yPercent: 110,
            duration: dur,
            stagger: each,
            ease: EASE_FABLE,
            delay,
            // "mount" plays at once; after play, a re-split resumes from the
            // preserved time because the tween is returned to SplitText.
            paused: trigger !== "mount" && !playedRef.current,
          });
          if (trigger === "mount") playedRef.current = true;
          tweenRef.current = tween;
          return tween;
        },
      });
    }, visual);

    show();

    return () => {
      ctx.revert();
      tweenRef.current = null;
    };
  }, [split, trigger, start, delay, stagger, duration, reduced]);

  const Tag: ElementType = as;
  const classes = [styles.root, as === "span" ? styles.inline : "", className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag className={classes} id={id}>
      <span className={styles.srOnly}>{children}</span>
      <span
        ref={visualRef}
        className={`${styles.visual} ${styles.pending}`}
        aria-hidden="true"
      >
        {children}
      </span>
    </Tag>
  );
}
