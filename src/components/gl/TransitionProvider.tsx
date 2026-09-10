"use client";

/**
 * Binds next/navigation to the transition controller. Mount once inside the
 * root layout; the controller itself is framework-agnostic and only learns
 * about the router and the live pathname from here.
 */

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap, ScrollTrigger } from "@/components/motion/gsapSetup";
import { registerRouter, setCurrentPathname } from "./transitionController";

// gsap.core.globals() is untyped; it returns the registry of registered plugins.
function isScrollTriggerRegistered(): boolean {
  const core = (gsap as unknown as { core?: { globals?: () => Record<string, unknown> } }).core;
  const globals = core?.globals?.();
  return Boolean(globals && globals.ScrollTrigger);
}

export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const lastPathname = useRef<string | null>(null);

  useEffect(() => {
    registerRouter(router);
    return () => registerRouter(null);
  }, [router]);

  useEffect(() => {
    const changed = lastPathname.current !== null && lastPathname.current !== pathname;
    lastPathname.current = pathname;
    setCurrentPathname(pathname);
    if (!changed) return;

    // The new page's triggers are created in its own effects (children run
    // first); one frame later their layout is settled and can be measured.
    const frame = requestAnimationFrame(() => {
      if (isScrollTriggerRegistered()) ScrollTrigger.refresh();
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return <>{children}</>;
}
