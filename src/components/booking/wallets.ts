"use client";

/**
 * Wallet availability. Detection only: whether this browser can present an
 * Apple Pay sheet or a Google Pay sheet. Completing a payment needs a
 * configured merchant (see src/lib/payments.ts).
 *
 * NEXT_PUBLIC_DEMO_WALLETS=1 reports both wallets as available so the drawer
 * can be reviewed and screenshotted on any machine.
 */

export interface WalletAvailability {
  applePay: boolean;
  googlePay: boolean;
  /** window.isSecureContext — wallets only exist on https (and localhost). */
  secure: boolean;
}

declare global {
  interface Window {
    ApplePaySession?: {
      canMakePayments(): boolean;
    };
  }
}

const GOOGLE_PAY_METHOD: PaymentMethodData = {
  supportedMethods: "https://google.com/pay",
  data: {
    environment: "TEST",
    apiVersion: 2,
    apiVersionMinor: 0,
    allowedPaymentMethods: [
      {
        type: "CARD",
        parameters: {
          allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
          allowedCardNetworks: ["VISA", "MASTERCARD", "AMEX"],
        },
      },
    ],
  },
};

const PROBE_DETAILS: PaymentDetailsInit = {
  total: { label: "Deposit", amount: { currency: "USD", value: "1.00" } },
};

function detectApplePay(): boolean {
  try {
    return window.ApplePaySession?.canMakePayments() === true;
  } catch {
    return false;
  }
}

async function detectGooglePay(): Promise<boolean> {
  if (typeof window.PaymentRequest === "undefined") return false;
  try {
    const request = new PaymentRequest([GOOGLE_PAY_METHOD], PROBE_DETAILS);
    return await request.canMakePayment();
  } catch {
    // Insecure context, unsupported method data, or a browser that throws on
    // the probe: all mean "no wallet button".
    return false;
  }
}

export async function detectWallets(): Promise<WalletAvailability> {
  if (typeof window === "undefined") {
    return { applePay: false, googlePay: false, secure: false };
  }
  const secure = window.isSecureContext === true;

  if (process.env.NEXT_PUBLIC_DEMO_WALLETS === "1") {
    return { applePay: true, googlePay: true, secure };
  }
  if (!secure) {
    return { applePay: false, googlePay: false, secure };
  }

  const [applePay, googlePay] = await Promise.all([detectApplePay(), detectGooglePay()]);
  return { applePay, googlePay, secure };
}

/**
 * Safari draws the real Apple Pay mark through `-webkit-appearance:
 * -apple-pay-button`; every other engine gets a styled fallback.
 */
export function supportsNativeApplePayButton(): boolean {
  if (typeof window === "undefined" || typeof CSS === "undefined" || !CSS.supports) return false;
  try {
    return CSS.supports("-webkit-appearance", "-apple-pay-button");
  } catch {
    return false;
  }
}
