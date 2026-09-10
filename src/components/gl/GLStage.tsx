"use client";

/**
 * Mount once in the root layout. Owns the fixed full-viewport canvas the
 * transition renders into (opacity 0 while idle, tweened by the controller)
 * and the CSS curtain used when WebGL is unavailable or motion is reduced.
 */

import { useEffect, useRef } from "react";
import { acquireStage, releaseStage } from "./stage";
import { warmTransitionLayer } from "./TransitionLayer";
import styles from "./GLStage.module.css";
import "./transition.css";

export { getStage } from "./stage";
export type { Stage } from "./stage";

export function GLStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const stage = acquireStage(canvas);
    if (!stage) return;

    // Noise generation and the shader compile wait for an idle moment so
    // hydration and the hero intro keep the main thread.
    let idle = 0;
    let timer = 0;
    const warm = () => warmTransitionLayer(stage);
    // lib.dom declares requestIdleCallback unconditionally; Safari may still lack it.
    if (typeof window.requestIdleCallback === "function") {
      idle = window.requestIdleCallback(warm, { timeout: 1500 });
    } else {
      timer = window.setTimeout(warm, 600);
    }

    return () => {
      if (idle) window.cancelIdleCallback(idle);
      if (timer) window.clearTimeout(timer);
      releaseStage(stage);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <div className={styles.curtain} data-transition-curtain="" aria-hidden="true" />
    </>
  );
}
