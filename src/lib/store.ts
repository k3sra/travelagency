"use client";

/**
 * Minimal external store (no dependency) for cross-cutting UI state:
 * transition phase, drawer visibility, cursor mode. Components subscribe
 * with `useStore(selector)` via useSyncExternalStore.
 */

import { useSyncExternalStore } from "react";

export type CursorMode = "default" | "link" | "view" | "drag" | "hidden";
export type TransitionPhase = "idle" | "out" | "swap" | "in";

export interface UIState {
  cursor: CursorMode;
  cursorLabel: string;
  transition: TransitionPhase;
  drawerOpen: boolean;
  /** Slug of the journey currently in the booking drawer. */
  drawerJourney: string | null;
  /** True once the intro (hero) sequence has played for this session. */
  introDone: boolean;
}

const state: UIState = {
  cursor: "default",
  cursorLabel: "",
  transition: "idle",
  drawerOpen: false,
  drawerJourney: null,
  introDone: false,
};

const listeners = new Set<() => void>();

export function getState(): UIState {
  return state;
}

export function setState(patch: Partial<UIState>) {
  let changed = false;
  const target = state as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(patch)) {
    if (target[key] !== value) {
      target[key] = value;
      changed = true;
    }
  }
  if (changed) listeners.forEach((l) => l());
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useStore<T>(selector: (s: UIState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  );
}
