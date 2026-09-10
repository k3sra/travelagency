"use client";

/**
 * Custom cursor: an 8 px gold dot with a glass ring that opens over
 * interactive targets. State comes from event delegation on document, so any
 * element opts in with data-cursor (see ARCHITECTURE.md) and interactive
 * elements without it count as "link". The current mode is mirrored into the
 * UI store for other components.
 *
 * Renders nothing on the server and on touch-only devices; on fine pointers
 * the OS cursor is hidden via html.has-cursor (globals.css).
 */

import { useEffect, useRef, useSyncExternalStore } from "react";
import { gsap, setupGsap } from "./gsapSetup";
import { EASE_FABLE } from "@/lib/easing";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import { setState, type CursorMode } from "@/lib/store";
import styles from "./Cursor.module.css";

const FINE_POINTER = "(hover: hover) and (pointer: fine)";

function subscribeFinePointer(callback: () => void) {
  const mq = window.matchMedia(FINE_POINTER);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}
const getFinePointer = () => window.matchMedia(FINE_POINTER).matches;
const getServerFinePointer = () => false;

/** Ring box in px: the "view" size. "link" scales it to 64 px. */
const RING = 88;
const LINK_SCALE = 64 / RING;
const MODES = new Set<string>(["link", "view", "drag", "hidden"]);
const IMPLICIT_LINK = "a, button, [role='button']";

function resolve(target: EventTarget | null): { mode: CursorMode; label: string } {
  if (!(target instanceof Element)) return { mode: "default", label: "" };
  // An explicit data-cursor wins over an implicit interactive ancestor, so a
  // card marked "view" or a gallery marked "drag" keeps its intent over the
  // links inside it.
  const explicit = target.closest<HTMLElement>("[data-cursor]");
  if (explicit) {
    const raw = explicit.dataset.cursor ?? "";
    return {
      mode: MODES.has(raw) ? (raw as CursorMode) : "link",
      label: explicit.dataset.cursorLabel ?? "",
    };
  }
  return { mode: target.closest(IMPLICIT_LINK) ? "link" : "default", label: "" };
}

export function Cursor() {
  const fine = useSyncExternalStore(subscribeFinePointer, getFinePointer, getServerFinePointer);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const glassRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const chevronsRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const glass = glassRef.current;
    const label = labelRef.current;
    const chevrons = chevronsRef.current;
    if (!root || !dot || !ring || !glass || !label || !chevrons) return;

    setupGsap();
    const html = document.documentElement;
    html.classList.add("has-cursor");

    const reduced = prefersReducedMotion();
    const dur = (seconds: number) => (reduced ? 0 : seconds);

    const dotX = gsap.quickTo(dot, "x", { duration: dur(0.12), ease: "power3.out" });
    const dotY = gsap.quickTo(dot, "y", { duration: dur(0.12), ease: "power3.out" });
    const ringX = gsap.quickTo(ring, "x", { duration: dur(0.35), ease: "power3.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: dur(0.35), ease: "power3.out" });

    let mode: CursorMode = "default";
    let currentLabel = "";
    let inWindow = false;
    let positioned = false;

    const syncVisibility = () => {
      gsap.to(root, {
        opacity: inWindow && mode !== "hidden" ? 1 : 0,
        duration: dur(0.25),
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    const setMode = (next: CursorMode, text: string) => {
      if (next === mode && text === currentLabel) return;
      mode = next;
      currentLabel = text;
      setState({ cursor: next, cursorLabel: text });

      const open = next === "link" || next === "view" || next === "drag";
      // Keep the previous label while it fades out; swap only when showing.
      if (next === "view") label.textContent = text || "View";

      gsap.to(glass, {
        scale: next === "view" ? 1 : open ? LINK_SCALE : 0,
        opacity: open ? 1 : 0,
        duration: dur(0.5),
        ease: EASE_FABLE,
        overwrite: "auto",
      });
      gsap.to(label, {
        opacity: next === "view" ? 1 : 0,
        duration: dur(0.3),
        ease: EASE_FABLE,
        overwrite: "auto",
      });
      gsap.to(chevrons, {
        opacity: next === "drag" ? 1 : 0,
        scale: next === "drag" ? 1 : 0.6,
        duration: dur(0.35),
        ease: EASE_FABLE,
        overwrite: "auto",
      });
      gsap.to(dot, {
        opacity: next === "view" ? 0 : 1,
        duration: dur(0.3),
        ease: EASE_FABLE,
        overwrite: "auto",
      });
      syncVisibility();
    };

    const leave = () => {
      if (!inWindow) return;
      inWindow = false;
      syncVisibility();
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") {
        leave();
        return;
      }
      if (positioned) {
        dotX(e.clientX);
        dotY(e.clientY);
        ringX(e.clientX);
        ringY(e.clientY);
      } else {
        positioned = true;
        gsap.set([dot, ring], { x: e.clientX, y: e.clientY });
      }
      if (!inWindow) {
        inWindow = true;
        syncVisibility();
      }
    };

    const onOver = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const next = resolve(e.target);
      setMode(next.mode, next.label);
    };

    const onOut = (e: PointerEvent) => {
      // relatedTarget null: the pointer left the document.
      if (e.relatedTarget === null) leave();
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      gsap.to(dot, { scale: 0.7, duration: dur(0.2), ease: "power3.out", overwrite: "auto" });
    };
    const onUp = () => {
      gsap.to(dot, { scale: 1, duration: dur(0.45), ease: EASE_FABLE, overwrite: "auto" });
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerout", onOut, { passive: true });
    document.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointercancel", onUp, { passive: true });
    document.addEventListener("mouseleave", leave);
    window.addEventListener("blur", leave);

    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      document.removeEventListener("mouseleave", leave);
      window.removeEventListener("blur", leave);
      gsap.killTweensOf([root, dot, ring, glass, label, chevrons]);
      html.classList.remove("has-cursor");
      setState({ cursor: "default", cursorLabel: "" });
    };
  }, [fine]);

  if (!fine) return null;

  return (
    <div ref={rootRef} className={styles.root} aria-hidden="true">
      <div ref={dotRef} className={styles.dot} />
      <div ref={ringRef} className={styles.ring}>
        <div ref={glassRef} className={styles.glass} />
        <span ref={labelRef} className={styles.label} />
        <span ref={chevronsRef} className={styles.chevrons}>
          <svg viewBox="0 0 8 12" focusable="false">
            <path d="M6.5 1 1.5 6l5 5" />
          </svg>
          <svg viewBox="0 0 8 12" focusable="false">
            <path d="M1.5 1l5 5-5 5" />
          </svg>
        </span>
      </div>
    </div>
  );
}
