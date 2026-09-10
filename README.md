# Fable Travels

> **Write your own legend.**
> A cinematic, editorial web experience for a small-group travel house. Zero page reloads,
> heavy inertia scrolling, WebGL displacement transitions, tactile UI — at 60 fps.

Built with **Next.js 16** (App Router, Turbopack), **GSAP 3.15** (ScrollTrigger, SplitText, CustomEase),
**Three.js 0.186** and **Lenis 1.3**.

Read [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the component contract, transition sequence, shader logic,
motion grammar and the 60 fps rules.

## Run it

```bash
npm install
npm run media     # generate the placeholder media set into public/media (sharp + ffmpeg)
npm run dev       # http://localhost:3000
```

Production:

```bash
npm run build && npm start
```

Checks:

```bash
npm run typecheck   # next typegen + tsc --noEmit
npm run lint        # eslint
```

## Experience map

| Route               | What happens                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| `/`                 | Full-screen slow-motion hero video, tagline unmasks, magnetic **Curate Your Journey**. Manifesto. Three destinations emerge from blur into focus. Journey index with shutter-masked imagery. |
| `/journeys`         | Editorial index of every departure.                                                                       |
| `/journeys/[slug]`  | Package page: cinematic header, itinerary chapters, **The Collective** (vertical marquee of monochrome portraits, vibe-alignment tags, pulsing scarcity), **Secure Your Spot** → booking drawer. |

Navigation between routes never reloads: `TransitionLink` intercepts `next/link`, the WebGL stage
displaces the current hero into the destination hero (ripple / stretch / dissolve), the router swaps
the page underneath, and the curtain lifts on the new page.

## Media

Placeholders are generated locally so the repo works offline. To ship real footage, mirror the paths in
`public/media` (see the manifest in `ARCHITECTURE.md`) or point `NEXT_PUBLIC_MEDIA_BASE` at a CDN that does.

- Hero: `hero/hero.webm` (VP8) — add `hero/hero.mp4` (H.264) for the widest reach; the component tries both.
- Every image has a `-blur.jpg` sibling used by the blur-to-focus reveal (pre-blurred so the reveal stays compositor-only).
- Portraits are monochrome 600×800.

## Payments

`src/lib/payments.ts` is a mock processor. `PaymentButtons` feature-detects Apple Pay and Google Pay through
the Payment Request API and renders the matching one-click button; wire `processDeposit()` to your PSP
(Stripe PaymentIntents + Apple Pay merchant validation) to take real deposits. Set
`NEXT_PUBLIC_DEMO_WALLETS=1` to force both wallet buttons on for design reviews.

## Performance budget

- Scroll-linked motion is transform/opacity only; blur-to-focus crossfades a pre-blurred asset.
- The WebGL canvas renders on demand — no frame loop while idle.
- Lenis drives GSAP's ticker; ScrollTrigger updates from Lenis, never from its own scroll listener.
- Continuous loops (marquee, scarcity pulse) are CSS animations.
- Reduced motion is honoured everywhere; the site is fully usable without it.
