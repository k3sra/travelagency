"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

const daysUntil = (startDate: string) => {
  const start = new Date(startDate + "T00:00:00Z").getTime();
  return Math.max(0, Math.ceil((start - Date.now()) / 86400000));
};

/** "Departs in 274 days", computed on the client so the static HTML never lies. */
export function Countdown({ startDate, className = "" }: { startDate: string; className?: string }) {
  const days = useSyncExternalStore(subscribe, () => daysUntil(startDate), () => null);
  if (days === null) return <span className={className} aria-hidden="true">Departs soon</span>;
  return <span className={className}>{days === 0 ? "Departs today" : `Departs in ${days} ${days === 1 ? "day" : "days"}`}</span>;
}
