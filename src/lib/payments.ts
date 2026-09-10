/**
 * Deposit processing — MOCK.
 *
 * `processDeposit()` is the single hand-off point between the booking drawer
 * and money. Today it resolves after ~1.4 s with a deterministic hold id so
 * the drawer choreography can be built, reviewed and screenshotted without a
 * merchant account. Nothing here talks to a network.
 *
 * Replacing it with a real processor (Stripe is the reference shape):
 *
 * 1. Server side, create a PaymentIntent for `amount` in `currency` with
 *    `capture_method: "manual"` so the deposit is authorised ("held") now and
 *    captured later, and return its `client_secret` to the browser. In the
 *    static export that endpoint must live off-site (a small function on
 *    your PSP-facing host); this app ships no route handlers.
 * 2. `method === "card"` → confirm the intent with Stripe Elements /
 *    `stripe.confirmCardPayment(clientSecret, ...)`.
 * 3. `method === "apple" | "google"` → drive the same intent through the
 *    Payment Request API (`stripe.paymentRequest(...)` + `PaymentRequestButton`)
 *    or, for Apple Pay directly, an `ApplePaySession` whose
 *    `onvalidatemerchant` posts the validation URL to your server, which
 *    calls Apple with your merchant identity certificate and returns the
 *    session object. Google Pay needs a merchant id and the `PRODUCTION`
 *    environment in `wallets.ts` once you leave TEST.
 * 4. Resolve with the intent id, `status: "held"` while it is
 *    `requires_capture`, and the authorisation expiry (7 days for cards; the
 *    14-day refund promise in the drawer is a policy you enforce on capture).
 *
 * Until a merchant is configured, the wallet buttons in `PaymentButtons.tsx`
 * only *detect* Apple Pay / Google Pay; they cannot complete a real payment.
 */

export type PaymentMethod = "apple" | "google" | "card";

export interface DepositRequest {
  journeySlug: string;
  method: PaymentMethod;
  /** Deposit amount in major units (e.g. 900 for $900). */
  amount: number;
  currency: string;
  traveller: { name: string; email: string };
}

export interface DepositResult {
  /** Hold reference shown to the traveller, e.g. "FT-KIS-8H2K1Q". */
  id: string;
  status: "held";
  /** ISO timestamp until which the deposit is fully refundable. */
  heldUntil: string;
}

const PROCESSING_MS = 1400;
const REFUND_WINDOW_DAYS = 14;

/** Per-session sequence so two identical requests never share a reference. */
let sequence = 0;

/** FNV-1a: tiny, dependency-free, stable across runs for the same input. */
function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function slugInitials(slug: string): string {
  const initials = slug
    .split("-")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (initials || "FT").slice(0, 3);
}

export function processDeposit(request: DepositRequest): Promise<DepositResult> {
  sequence += 1;
  const seed = [
    request.journeySlug,
    request.method,
    request.traveller.email.trim().toLowerCase(),
    request.traveller.name.trim(),
    String(sequence),
  ].join("|");
  const id = `FT-${slugInitials(request.journeySlug)}-${fnv1a(seed)
    .toString(36)
    .toUpperCase()
    .padStart(7, "0")
    .slice(-7)}`;

  return new Promise((resolve) => {
    setTimeout(() => {
      const heldUntil = new Date(Date.now() + REFUND_WINDOW_DAYS * 86_400_000).toISOString();
      resolve({ id, status: "held", heldUntil });
    }, PROCESSING_MS);
  });
}
