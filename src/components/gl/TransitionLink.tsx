"use client";

/**
 * next/link with the WebGL transition in front of it. Next only fires
 * `onNavigate` for same-origin client-side navigations (modifier and middle
 * clicks, downloads and external URLs never reach it), so intercepting there
 * keeps every browser affordance intact.
 */

import Link, { type LinkProps } from "next/link";
import {
  useRef,
  type AnchorHTMLAttributes,
  type FocusEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from "react";
import type { UrlObject } from "url";
import type { TransitionKind } from "@/lib/types";
import { transitions } from "./transitionController";
import type { TransitionOrigin } from "./TransitionLayer";

export type TransitionLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    kind?: TransitionKind;
    /** Texture for the destination page (its hero image). */
    to?: string;
    children: ReactNode;
    ref?: Ref<HTMLAnchorElement>;
    "data-cursor"?: string;
  };

type NavigateEvent = { preventDefault: () => void };

function formatHref(href: LinkProps["href"]): string {
  if (typeof href === "string") return href;
  const url = href as UrlObject;
  let out = url.pathname ?? "";
  if (url.search) {
    out += url.search.startsWith("?") ? url.search : `?${url.search}`;
  } else if (url.query && typeof url.query === "object") {
    const params = new URLSearchParams();
    Object.entries(url.query).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) value.forEach((v) => params.append(key, String(v)));
      else params.set(key, String(value));
    });
    const qs = params.toString();
    if (qs) out += `?${qs}`;
  } else if (typeof url.query === "string" && url.query) {
    out += `?${url.query}`;
  }
  if (url.hash) out += url.hash.startsWith("#") ? url.hash : `#${url.hash}`;
  return out || "/";
}

// Viewport position → shader space (0..1, y up).
function toOrigin(clientX: number, clientY: number): TransitionOrigin {
  const w = Math.max(1, window.innerWidth);
  const h = Math.max(1, window.innerHeight);
  return {
    x: Math.min(1, Math.max(0, clientX / w)),
    y: Math.min(1, Math.max(0, 1 - clientY / h)),
  };
}

export function TransitionLink({
  kind = "dissolve",
  to,
  href,
  children,
  onNavigate,
  onPointerDown,
  onPointerEnter,
  onFocus,
  onClick,
  "data-cursor": dataCursor = "link",
  ...rest
}: TransitionLinkProps) {
  const originRef = useRef<TransitionOrigin | null>(null);

  const handlePointerDown = (event: PointerEvent<HTMLAnchorElement>) => {
    originRef.current = toOrigin(event.clientX, event.clientY);
    onPointerDown?.(event);
  };

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // Keyboard activation carries no pointer position: ripple from the link itself.
    if (event.detail === 0 || (event.clientX === 0 && event.clientY === 0)) {
      const rect = event.currentTarget.getBoundingClientRect();
      originRef.current = toOrigin(rect.left + rect.width / 2, rect.top + rect.height / 2);
    } else {
      originRef.current = toOrigin(event.clientX, event.clientY);
    }
    onClick?.(event);
  };

  const handleNavigate = (event: NavigateEvent) => {
    if (transitions.active) {
      event.preventDefault();
      return;
    }
    let blocked = false;
    onNavigate?.({
      preventDefault: () => {
        blocked = true;
      },
    });
    event.preventDefault();
    if (blocked) return;
    void transitions.navigate(formatHref(href), {
      kind,
      to,
      origin: originRef.current ?? undefined,
    });
  };

  const handlePointerEnter = (event: PointerEvent<HTMLAnchorElement>) => {
    if (to) transitions.preload(to);
    onPointerEnter?.(event);
  };

  const handleFocus = (event: FocusEvent<HTMLAnchorElement>) => {
    if (to) transitions.preload(to);
    onFocus?.(event);
  };

  return (
    <Link
      href={href}
      {...rest}
      data-cursor={dataCursor}
      onPointerDown={handlePointerDown}
      onPointerEnter={handlePointerEnter}
      onFocus={handleFocus}
      onClick={handleClick}
      onNavigate={handleNavigate}
    >
      {children}
    </Link>
  );
}
