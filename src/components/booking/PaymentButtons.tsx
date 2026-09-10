"use client";

/**
 * One-click deposit buttons. Wallets are feature-detected on mount and only
 * the ones this browser can actually present are rendered; the card button
 * is always there. Each button fires `onPay(method)` exactly once per click
 * and the drawer takes it from there (src/lib/payments.ts).
 *
 * Brand rules: Apple Pay is Safari's own mark (`-webkit-appearance`) with a
 * plain black pill fallback elsewhere; Google Pay is a black pill with the
 * four-colour "G" and "Pay" in the system face. No external images.
 */

import { useEffect, useState } from "react";
import { Magnetic } from "@/components/motion/Magnetic";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { formatPrice } from "@/lib/journeys";
import type { PaymentMethod } from "@/lib/payments";
import { detectWallets, supportsNativeApplePayButton } from "./wallets";
import styles from "./PaymentButtons.module.css";

export interface PaymentButtonsProps {
  /** Deposit amount in major units. */
  amount: number;
  currency: string;
  journeyTitle: string;
  disabled?: boolean;
  onPay: (method: PaymentMethod) => void;
}

interface Wallets {
  applePay: boolean;
  googlePay: boolean;
  nativeAppleButton: boolean;
}

function GoogleMark() {
  return (
    <svg className={styles.gMark} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export function PaymentButtons({
  amount,
  currency,
  journeyTitle,
  disabled = false,
  onPay,
}: PaymentButtonsProps) {
  const [wallets, setWallets] = useState<Wallets | null>(null);

  useEffect(() => {
    let alive = true;
    detectWallets().then((available) => {
      if (!alive) return;
      setWallets({
        applePay: available.applePay,
        googlePay: available.googlePay,
        nativeAppleButton: supportsNativeApplePayButton(),
      });
    });
    return () => {
      alive = false;
    };
  }, []);

  const deposit = formatPrice(amount, currency);
  const hasWallet = Boolean(wallets && (wallets.applePay || wallets.googlePay));

  return (
    <div className={styles.root} data-busy={disabled || undefined}>
      {hasWallet && wallets ? (
        <div className={styles.wallets}>
          {wallets.applePay ? (
            <Magnetic strength={0.2} radius={70}>
              <button
                type="button"
                className={
                  wallets.nativeAppleButton
                    ? `${styles.wallet} ${styles.appleNative}`
                    : `${styles.wallet} ${styles.appleFallback}`
                }
                onClick={() => onPay("apple")}
                disabled={disabled}
                aria-label={`Pay the ${deposit} deposit for ${journeyTitle} with Apple Pay`}
                data-cursor="link"
              >
                {wallets.nativeAppleButton ? null : <span>Pay with Apple Pay</span>}
              </button>
            </Magnetic>
          ) : null}
          {wallets.googlePay ? (
            <Magnetic strength={0.2} radius={70}>
              <button
                type="button"
                className={`${styles.wallet} ${styles.google}`}
                onClick={() => onPay("google")}
                disabled={disabled}
                aria-label={`Pay the ${deposit} deposit for ${journeyTitle} with Google Pay`}
                data-cursor="link"
              >
                <GoogleMark />
                <span className={styles.gText}>Pay</span>
              </button>
            </Magnetic>
          ) : null}
        </div>
      ) : null}

      {hasWallet ? (
        <div className={styles.divider} aria-hidden="true">
          <span className={`t-caps ${styles.or}`}>or</span>
        </div>
      ) : null}

      <MagneticButton
        variant="ghost"
        label={`Reserve with card · ${deposit}`}
        className={styles.card}
        disabled={disabled}
        onClick={() => onPay("card")}
        aria-label={`Reserve ${journeyTitle} with a card, ${deposit} deposit`}
      />
    </div>
  );
}
