"use client";

/**
 * The booking drawer: a forest panel that slides in from the right over a
 * heavily blurred page, holds a place with one click, and clicks a padlock
 * shut when it is done.
 *
 * Lifecycle. The store's `drawerOpen` flag is the request; the drawer keeps
 * its own `lifecycle` ("closed" → "open" → "closing" → "closed") so the
 * content stays mounted while the close choreography plays. The switch from
 * the store flag to the lifecycle happens during render (React's
 * "adjust state when a prop changes" pattern), never inside an effect, and
 * the close timeline's onComplete releases the content.
 *
 * Motion. One GSAP timeline per phase, built in a layout effect (so from
 * states are applied before paint) inside gsap.context(), kept in a ref and
 * reverted on cleanup. Reduced motion: no timelines, everything lands.
 *
 * Scroll lock is SmoothScroll's job: it watches `drawerOpen` itself.
 */

import {
  useId,
  useLayoutEffect,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { gsap, setupGsap } from "@/components/motion/gsapSetup";
import { Magnetic } from "@/components/motion/Magnetic";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { DUR, EASE_CINEMATIC, EASE_FABLE } from "@/lib/easing";
import { formatPrice, getJourney } from "@/lib/journeys";
import { processDeposit, type DepositResult, type PaymentMethod } from "@/lib/payments";
import { getState, setState, useStore } from "@/lib/store";
import { prefersReducedMotion, useReducedMotion } from "@/lib/useReducedMotion";
import { Padlock } from "./Padlock";
import { PaymentButtons } from "./PaymentButtons";
import { TrustMarkers } from "./TrustMarkers";
import styles from "./BookingDrawer.module.css";

type Lifecycle = "closed" | "open" | "closing";
type Step = "details" | "processing" | "held";

interface Traveller {
  name: string;
  email: string;
}

/** Close plays at 0.7 of the open's duration: leaving should feel lighter than arriving. */
const CLOSE_SCALE = 0.7;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const closeDrawer = () => setState({ drawerOpen: false });

const heldUntilFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long" });

/** "Kyoto, in Silence" with `titleEm` = "Silence" → Kyoto, in <em>Silence</em>. */
function Title({ title, em }: { title: string; em?: string }): ReactNode {
  if (!em) return title;
  const at = title.indexOf(em);
  if (at < 0) return title;
  return (
    <>
      {title.slice(0, at)}
      <em>{em}</em>
      {title.slice(at + em.length)}
    </>
  );
}

function CloseGlyph() {
  return (
    <svg
      className={styles.closeGlyph}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  );
}

export function BookingDrawer() {
  const open = useStore((s) => s.drawerOpen);
  const slug = useStore((s) => s.drawerJourney);
  const reduced = useReducedMotion();

  const [lifecycle, setLifecycle] = useState<Lifecycle>("closed");
  const [prevOpen, setPrevOpen] = useState(open);
  const [step, setStep] = useState<Step>("details");
  const [locked, setLocked] = useState(false);
  const [result, setResult] = useState<DepositResult | null>(null);
  const [traveller, setTraveller] = useState<Traveller>({ name: "", email: "" });

  // Store flag → lifecycle. Reduced motion skips the "closing" phase entirely.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setLifecycle("open");
      setStep("details");
      setLocked(false);
      setResult(null);
    } else {
      setLifecycle(reduced ? "closed" : "closing");
    }
  }

  const rootRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  // Bumped on every open so a deposit resolving after a close (or a re-open
  // for another journey) is ignored.
  const session = useRef(0);

  const ids = useId();
  const titleId = `${ids}-title`;
  const nameId = `${ids}-name`;
  const emailId = `${ids}-email`;

  const journey = slug ? getJourney(slug) : undefined;
  const shown = lifecycle !== "closed" && journey !== undefined;
  const busy = step === "processing";

  /* ---------------------------------------------------------------------
     Open / close choreography
     --------------------------------------------------------------------- */
  useLayoutEffect(() => {
    if (lifecycle === "closed") return;
    const backdrop = backdropRef.current;
    const panel = panelRef.current;
    const body = bodyRef.current;
    if (!backdrop || !panel || !body) return;
    setupGsap();

    const ctx = gsap.context(() => {
      if (lifecycle === "open") {
        session.current += 1;
        body.scrollTop = 0;
        const blocks = gsap.utils.toArray<HTMLElement>("[data-rise]", body);
        const pay = body.querySelector<HTMLElement>("[data-rise-pay]");

        if (reduced) {
          gsap.set([backdrop, panel, ...blocks, pay ?? []], { clearProps: "all" });
          gsap.delayedCall(0, () => setLocked(true));
          return;
        }

        const tl = gsap.timeline({ defaults: { ease: EASE_CINEMATIC } });
        timeline.current = tl;
        tl.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0)
          .fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: DUR.drawer }, 0)
          .fromTo(
            blocks,
            { y: 24, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.9, stagger: 0.06, ease: EASE_FABLE },
            DUR.drawer - 0.3,
          )
          // The padlock clicks shut once the last line has settled.
          .call(() => setLocked(true), [], "-=0.55");
        if (pay) {
          tl.fromTo(
            pay,
            { y: 24, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.9, ease: EASE_FABLE },
            "-=0.3",
          );
        }
        return;
      }

      // "closing": content dims as one layer, the panel leaves, the blur lifts.
      const tl = gsap.timeline({
        defaults: { ease: EASE_CINEMATIC },
        onComplete: () => {
          setLifecycle("closed");
          setStep("details");
          setLocked(false);
        },
      });
      timeline.current = tl;
      tl.to(body, { opacity: 0, duration: 0.3 * CLOSE_SCALE + 0.1, ease: "power1.out" }, 0)
        .to(panel, { xPercent: 100, duration: DUR.drawer * CLOSE_SCALE }, 0.05)
        .to(backdrop, { opacity: 0, duration: 0.5 * CLOSE_SCALE }, 0.2);
    });

    return () => {
      ctx.revert();
      timeline.current = null;
    };
  }, [lifecycle, reduced]);

  /* ---------------------------------------------------------------------
     Confirmation choreography
     --------------------------------------------------------------------- */
  useLayoutEffect(() => {
    if (step !== "held") return;
    const confirm = confirmRef.current;
    const body = bodyRef.current;
    if (!confirm || !body) return;
    setupGsap();
    body.scrollTop = 0;
    confirm.focus({ preventScroll: true });

    const ctx = gsap.context(() => {
      const blocks = gsap.utils.toArray<HTMLElement>("[data-rise]", confirm);
      if (reduced) {
        gsap.delayedCall(0, () => setLocked(true));
        return;
      }
      const tl = gsap.timeline();
      tl.fromTo(
        blocks,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, stagger: 0.07, ease: EASE_FABLE },
        0.05,
      ).call(() => setLocked(true), [], 0.6);
    });

    return () => ctx.revert();
  }, [step, reduced]);

  /* ---------------------------------------------------------------------
     Focus: move in, trap, Escape, make the page behind inert, restore.
     --------------------------------------------------------------------- */
  useEffect(() => {
    if (lifecycle !== "open") return;
    const panel = panelRef.current;
    if (!panel) return;

    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const madeInert: HTMLElement[] = [];
    for (const sibling of Array.from(document.body.children)) {
      if (!(sibling instanceof HTMLElement) || sibling.contains(panel) || sibling.inert) continue;
      sibling.inert = true;
      madeInert.push(sibling);
    }
    panel.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDrawer();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0,
      );
      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus({ preventScroll: true });
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const inside = active instanceof HTMLElement && panel.contains(active);
      if (!inside) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      madeInert.forEach((el) => {
        el.inert = false;
      });
      if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, [lifecycle]);

  /* ---------------------------------------------------------------------
     Payment
     --------------------------------------------------------------------- */
  const handlePay = async (method: PaymentMethod) => {
    const form = formRef.current;
    if (!form || !journey || step !== "details") return;
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const ticket = session.current;

    setTraveller({ name, email });
    // The lock lifts while the deposit is in flight and clicks shut on success.
    setLocked(false);
    setStep("processing");

    let outcome: DepositResult;
    try {
      outcome = await processDeposit({
        journeySlug: journey.slug,
        method,
        amount: journey.price.deposit,
        currency: journey.price.currency,
        traveller: { name, email },
      });
    } catch {
      if (session.current === ticket && getState().drawerOpen) {
        setStep("details");
        setLocked(true);
      }
      return;
    }
    if (session.current !== ticket || !getState().drawerOpen) return;

    const details = detailsRef.current;
    if (details && !prefersReducedMotion()) {
      await gsap.to(details, { opacity: 0, y: -12, duration: 0.45, ease: EASE_CINEMATIC });
      if (session.current !== ticket || !getState().drawerOpen) return;
    }
    setResult(outcome);
    setStep("held");
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handlePay("card");
  };

  const status =
    step === "processing"
      ? "Processing your deposit."
      : step === "held"
        ? "Your place is held."
        : "";

  return (
    <div ref={rootRef} className={styles.root} hidden={!shown} data-lifecycle={lifecycle}>
      <div ref={backdropRef} className={styles.backdrop} onClick={closeDrawer} aria-hidden="true" />

      <div
        ref={panelRef}
        className={`${styles.panel} grain`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={busy || undefined}
        tabIndex={-1}
      >
        <div className={styles.progress} data-active={busy || undefined} aria-hidden="true">
          <span className={styles.progressBar} />
        </div>

        <header className={styles.head}>
          <Magnetic strength={0.25} radius={60}>
            <button
              type="button"
              className={styles.close}
              onClick={closeDrawer}
              data-cursor="link"
              aria-label="Close booking"
            >
              <CloseGlyph />
              <span className={`t-caps ${styles.closeLabel}`}>Close</span>
            </button>
          </Magnetic>
        </header>

        <p className="visually-hidden" role="status" aria-live="polite">
          {status}
        </p>

        {/* Distinct keys: the details block is faded out by GSAP before the swap, and
            React must not reuse that node (with its inline opacity) for the confirmation. */}
        <div ref={bodyRef} className={styles.body} data-lenis-prevent>
          {journey && step === "held" && result ? (
            <div key="held" ref={confirmRef} className={styles.confirm} tabIndex={-1}>
              <h2 id={titleId} className={`t-caps ${styles.eyebrow}`} data-rise>
                Your place is held
              </h2>
              <p className={`t-display ${styles.title}`} data-rise>
                Your legend begins <em>{journey.dates}</em>.
              </p>
              <p className={styles.meta} data-rise>
                You are traveller {journey.groupMax - journey.spotsRemaining + 1} of{" "}
                {journey.groupMax}.
              </p>
              <div className={styles.lock} data-rise>
                <Padlock state={locked ? "closed" : "open"} size={96} />
              </div>
              <p className={styles.reference} data-rise>
                Hold reference {result.id}
                <span className={styles.dot} aria-hidden="true">
                  {" · "}
                </span>
                refundable until {heldUntilFormat.format(new Date(result.heldUntil))}
              </p>
              <div className={styles.actions} data-rise>
                <MagneticButton variant="ghost" label="Back to the journey" onClick={closeDrawer} />
              </div>
              <hr className={styles.rule} data-rise />
              <div data-rise>
                <TrustMarkers locked={locked} />
              </div>
              <p className={styles.fine} data-rise>
                A confirmation is on its way to {traveller.email}. Your deposit stays fully
                refundable for 14 days.
              </p>
            </div>
          ) : journey ? (
            <div key="details" ref={detailsRef} className={styles.details}>
              <p className={`t-caps ${styles.eyebrow}`} data-rise>
                Secure your place
              </p>
              <h2 id={titleId} className={`t-display ${styles.title}`} data-rise>
                <Title title={journey.title} em={journey.titleEm} />
              </h2>
              <p className={styles.meta} data-rise>
                {journey.dates}
                <span className={styles.dot} aria-hidden="true">
                  {" · "}
                </span>
                {journey.durationDays} days
                <span className={styles.dot} aria-hidden="true">
                  {" · "}
                </span>
                Group of {journey.groupMax}
              </p>
              <p className={`t-caps ${styles.scarcity}`} data-rise>
                [ {journey.spotsRemaining} {journey.spotsRemaining === 1 ? "Spot" : "Spots"}{" "}
                Remaining ]
              </p>

              <dl className={styles.terms} data-rise>
                <div className={styles.term}>
                  <dt>Price per traveller</dt>
                  <dd>{formatPrice(journey.price.amount, journey.price.currency)}</dd>
                </div>
                <div className={`${styles.term} ${styles.termDeposit}`}>
                  <dt>Deposit today</dt>
                  <dd>{formatPrice(journey.price.deposit, journey.price.currency)}</dd>
                </div>
                <div className={styles.term}>
                  <dt>Balance due 60 days before departure</dt>
                  <dd>
                    {formatPrice(journey.price.amount - journey.price.deposit, journey.price.currency)}
                  </dd>
                </div>
              </dl>

              <form ref={formRef} className={styles.form} onSubmit={onSubmit}>
                <div className={styles.fields} data-rise>
                  <div className={styles.field}>
                    <label htmlFor={nameId} className={`t-caps ${styles.label}`}>
                      Full name
                    </label>
                    <input
                      id={nameId}
                      name="name"
                      type="text"
                      className={styles.input}
                      autoComplete="name"
                      required
                      minLength={2}
                      readOnly={busy}
                      data-cursor="hidden"
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor={emailId} className={`t-caps ${styles.label}`}>
                      Email
                    </label>
                    <input
                      id={emailId}
                      name="email"
                      type="email"
                      className={styles.input}
                      autoComplete="email"
                      inputMode="email"
                      required
                      readOnly={busy}
                      data-cursor="hidden"
                    />
                  </div>
                </div>

                <div className={styles.pay} data-rise-pay>
                  <PaymentButtons
                    amount={journey.price.deposit}
                    currency={journey.price.currency}
                    journeyTitle={journey.title}
                    disabled={busy}
                    onPay={(method) => void handlePay(method)}
                  />
                </div>
              </form>

              <hr className={styles.rule} data-rise />
              <div data-rise>
                <TrustMarkers locked={locked} />
              </div>
              <p className={styles.fine} data-rise>
                Your deposit holds one of the remaining places. Fully refundable for 14 days.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
