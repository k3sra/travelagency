"use client";

/**
 * Gravity for a single element child. Within `radius` px of the element the
 * child drifts toward the pointer by `strength` of the offset (quickTo, 0.4 s)
 * and eases home over 0.9 s when the pointer leaves — no overshoot. Active
 * only on fine pointers with hover, never under reduced motion.
 *
 * The element's centre is cached in page space (mount, resize, ScrollTrigger
 * refresh, pointerenter) and converted with window.scrollX/Y on each move, so
 * pointer tracking never forces layout. [data-magnetic-media] descendants
 * zoom to scale(1.06) over 0.3 s while the element is hovered; put the
 * attribute on a wrapper, not on an element GSAP already transforms.
 *
 * React 19: the child must accept `ref`; its own ref still receives the node.
 */

import {
  useEffect,
  useImperativeHandle,
  useRef,
  type ElementType,
  type ReactElement,
  type Ref,
} from "react";
import { gsap, ScrollTrigger, setupGsap } from "./gsapSetup";

export interface MagneticProps {
  children: ReactElement<{ ref?: Ref<HTMLElement> }>;
  /** 0–1, share of the pointer offset the element follows. @default 0.35 */
  strength?: number;
  /** Reach of the field beyond the element's edges, px. @default 110 */
  radius?: number;
}

const MEDIA_SELECTOR = "[data-magnetic-media]";
const MEDIA_SCALE = 1.06;
const MEDIA_TRANSITION = "transform var(--dur-tactile, 0.3s) var(--ease-fable)";

export function Magnetic({ children, strength = 0.35, radius = 110 }: MagneticProps) {
  const elRef = useRef<HTMLElement | null>(null);

  // The child's own ref (object or callback, with cleanup) receives the same
  // node through React rather than by hand.
  useImperativeHandle(children.props.ref, () => elRef.current as HTMLElement);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    setupGsap();

    const mm = gsap.matchMedia();
    mm.add(
      {
        fine: "(hover: hover) and (pointer: fine)",
        reduce: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { fine, reduce } = context.conditions as { fine: boolean; reduce: boolean };
        if (!fine || reduce) return;

        const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
        const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });
        const media = Array.from(el.querySelectorAll<HTMLElement>(MEDIA_SELECTOR));
        media.forEach((m) => {
          m.style.transition = MEDIA_TRANSITION;
        });

        // Centre and half-extents in page space, read while at rest.
        let cx = 0;
        let cy = 0;
        let hw = 0;
        let hh = 0;
        let active = false;
        let homeTween: gsap.core.Tween | null = null;
        let frame = 0;

        const measure = () => {
          const rect = el.getBoundingClientRect();
          const dx = Number(gsap.getProperty(el, "x")) || 0;
          const dy = Number(gsap.getProperty(el, "y")) || 0;
          cx = rect.left + rect.width / 2 + window.scrollX - dx;
          cy = rect.top + rect.height / 2 + window.scrollY - dy;
          hw = rect.width / 2;
          hh = rect.height / 2;
        };
        const scheduleMeasure = () => {
          cancelAnimationFrame(frame);
          frame = requestAnimationFrame(measure);
        };

        const release = () => {
          if (!active) return;
          active = false;
          xTo.tween.pause();
          yTo.tween.pause();
          homeTween = gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "expo.out" });
        };

        const onMove = (e: PointerEvent) => {
          if (e.pointerType === "touch") return;
          const px = e.clientX - (cx - window.scrollX);
          const py = e.clientY - (cy - window.scrollY);
          // Distance from the element's box: 0 inside, growing outward.
          const outside = Math.hypot(Math.max(Math.abs(px) - hw, 0), Math.max(Math.abs(py) - hh, 0));
          if (outside > radius) {
            release();
            return;
          }
          // Full pull over the box, fading to nothing at the edge of the field
          // so entering the field never snaps.
          const pull = strength * (1 - outside / radius);
          const tx = px * pull;
          const ty = py * pull;
          if (active) {
            xTo(tx);
            yTo(ty);
            return;
          }
          active = true;
          homeTween?.kill();
          homeTween = null;
          // Resume from wherever the home tween left the element.
          xTo(tx, Number(gsap.getProperty(el, "x")) || 0);
          yTo(ty, Number(gsap.getProperty(el, "y")) || 0);
        };

        const onEnter = (e: PointerEvent) => {
          if (e.pointerType === "touch") return;
          measure();
          el.setAttribute("data-magnetic-hover", "");
          media.forEach((m) => {
            m.style.transform = `scale(${MEDIA_SCALE})`;
          });
        };
        const onLeave = () => {
          el.removeAttribute("data-magnetic-hover");
          media.forEach((m) => {
            m.style.transform = "scale(1)";
          });
        };

        measure();
        document.addEventListener("pointermove", onMove, { passive: true });
        el.addEventListener("pointerenter", onEnter);
        el.addEventListener("pointerleave", onLeave);
        window.addEventListener("resize", scheduleMeasure);
        ScrollTrigger.addEventListener("refresh", scheduleMeasure);

        return () => {
          cancelAnimationFrame(frame);
          document.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerenter", onEnter);
          el.removeEventListener("pointerleave", onLeave);
          window.removeEventListener("resize", scheduleMeasure);
          ScrollTrigger.removeEventListener("refresh", scheduleMeasure);
          homeTween?.kill();
          xTo.tween.kill();
          yTo.tween.kill();
          gsap.set(el, { clearProps: "transform" });
          el.removeAttribute("data-magnetic-hover");
          media.forEach((m) => {
            m.style.transform = "";
            m.style.transition = "";
          });
        };
      },
    );

    return () => mm.revert();
  }, [strength, radius]);

  // Re-render the child's element type with our ref as a JSX attribute; the
  // element's own props and key are preserved.
  const Child = children.type as ElementType;
  return <Child key={children.key} {...children.props} ref={elRef} />;
}
