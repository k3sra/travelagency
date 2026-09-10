"use client";

/**
 * Booking entry point. Mount once inside the root layout (under SmoothScroll
 * so the drawer's scroll lock — driven purely by the store's `drawerOpen`
 * flag — is picked up). The drawer itself is portalled into document.body
 * after hydration so it sits above every page layer regardless of where the
 * provider lives in the tree.
 *
 *   const { open } = useBooking();     // inside React
 *   booking.open("kyoto-in-silence");   // anywhere else (transition controller, tests)
 */

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { getJourney } from "@/lib/journeys";
import { setState, useStore } from "@/lib/store";
import { BookingDrawer } from "./BookingDrawer";

export interface BookingApi {
  open(slug: string): void;
  close(): void;
  isOpen: boolean;
}

/** Store-backed controls usable outside React. */
export const booking = {
  open(slug: string) {
    if (!getJourney(slug)) return;
    setState({ drawerOpen: true, drawerJourney: slug });
  },
  close() {
    // `drawerJourney` is deliberately left in place so the drawer can keep
    // rendering the journey while it slides out.
    setState({ drawerOpen: false });
  },
};

const BookingContext = createContext<Pick<BookingApi, "open" | "close">>(booking);

// Client-only gate for the portal: false on the server and during hydration,
// true once the tree is live, without a setState-in-effect round trip.
const subscribeNoop = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function BookingProvider({ children }: { children: ReactNode }) {
  const hydrated = useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot);
  return (
    <BookingContext value={booking}>
      {children}
      {hydrated ? createPortal(<BookingDrawer />, document.body) : null}
    </BookingContext>
  );
}

export function useBooking(): BookingApi {
  const controls = useContext(BookingContext);
  const isOpen = useStore((s) => s.drawerOpen);
  return useMemo(
    () => ({ open: controls.open, close: controls.close, isOpen }),
    [controls, isOpen],
  );
}
