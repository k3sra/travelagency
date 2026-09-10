# Fable Travels — Front-end Architecture

> Editorial luxury meets cinematic documentary. Zero page reloads, heavy scroll
> physics, WebGL displacement transitions, tactile UI — at a stable 60 fps.

Tagline: **Write your own legend.**

## Stack

| Layer      | Choice                                   | Why                                                                  |
| ---------- | ---------------------------------------- | -------------------------------------------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack)        | Server-rendered pages, client-side route transitions, `next/font`.   |
| Scroll     | Lenis 1.3                                | Inertia scrolling, single source of truth for scroll position.       |
| Motion     | GSAP 3.15 + ScrollTrigger, SplitText, CustomEase | Timelines, scroll choreography, line unmasking, house eases. |
| WebGL      | Three.js 0.186 (raw, no R3F)              | One persistent full-screen quad for transitions; render-on-demand.   |
| Styling    | CSS Modules + global tokens               | No runtime CSS, no utility churn; tokens in `src/app/globals.css`.    |

## Palette & type

| Token             | Value     | Use                                            |
| ----------------- | --------- | ---------------------------------------------- |
| `--forest`        | `#2D3A3A` | Forest Shadow — primary, dark plates, drawer   |
| `--gold`          | `#D4AF37` | Mythic Gold — italics, rules, scarcity, cursor |
| `--vellum`        | `#FBF8F1` | Old Vellum — page ground                       |

Playfair Display (display, italic accents) · Cinzel (small caps eyebrows & labels) · Crimson Text (body).
Loaded with `next/font/google` in `src/app/layout.tsx` and exposed as `--font-playfair`,
`--font-cinzel`, `--font-crimson`.

## Directory map & ownership

```
src/
  app/
    layout.tsx                 fonts, metadata, providers, global chrome
    page.tsx                   Home
    journeys/page.tsx          Journey index
    journeys/[slug]/page.tsx   Journey package (The Collective, Secure Your Spot)
    not-found.tsx
    globals.css                tokens, reset, utilities
  lib/
    types.ts                   domain model
    journeys.ts                catalogue + copy
    media.ts                   asset manifest (MEDIA_BASE)
    easing.ts                  motion tokens (durations, eases, Lenis physics)
    store.ts                   tiny external store (cursor / transition / drawer)
    useReducedMotion.ts
  components/
    gl/                        WebGL stage, transition shader, TransitionLink
    motion/                    Lenis provider, text unmask, shutter, blur-to-focus, parallax, magnetic, cursor
    booking/                   BookingProvider, BookingDrawer, wallet pay, trust markers
    nav/                       SiteNav, Footer, Wordmark
    home/                      Hero, Manifesto, FocusReveal sections, JourneyIndex, CollectiveTeaser
    journey/                   JourneyHeader, Chapters, Collective, SecureSpot
    ui/                        small shared atoms
scripts/
  generate-media.mjs           placeholder media generator (sharp + ffmpeg)
public/media/                  generated assets (see Media manifest)
```

## Layers (z-index)

| Layer                 | z    | Notes                                                   |
| --------------------- | ---- | ------------------------------------------------------- |
| page content          | 1    |                                                         |
| SiteNav               | 40   | hides on scroll-down, returns on scroll-up              |
| drawer backdrop       | 60   | `backdrop-filter: blur(24px)` + forest tint             |
| BookingDrawer         | 70   |                                                         |
| GL transition canvas  | 90   | `pointer-events: none`, opacity 0 when idle             |
| Cursor                | 100  | `pointer-events: none`                                  |

## Data-attribute protocol

| Attribute                        | Meaning                                                                  |
| -------------------------------- | ------------------------------------------------------------------------ |
| `data-cursor="link\|view\|drag\|hidden"` | Cursor state while hovering this element (event delegation).       |
| `data-cursor-label="Explore"`    | Optional label rendered inside the expanded cursor.                      |
| `data-magnetic-media`            | Media inside a magnetic element that zooms `scale(1.06)` over 0.3 s.     |
| `data-transition-hero="<url>"`   | The page's primary image; used as the *from* texture when leaving.       |
| `data-lenis-prevent`             | Scrollable regions Lenis must not hijack (drawer body).                  |

## Component APIs (contract)

### motion/

```ts
// SmoothScroll.tsx — mount once in layout
export function SmoothScroll({ children }: { children: React.ReactNode }): JSX.Element
export function useLenis(): Lenis | null
// usable outside React (transition controller, drawer)
export const scrollControl: {
  stop(): void; start(): void;
  scrollTo(target: number | string | HTMLElement, opts?: { immediate?: boolean; offset?: number; duration?: number }): void;
  get lenis(): Lenis | null;
}

// TextReveal.tsx — SplitText lines/words rising from a mask, staggered bottom-up
export interface TextRevealHandle { play(): void; reset(): void }
export function TextReveal(props: {
  as?: "h1"|"h2"|"h3"|"p"|"span"|"div";
  children: React.ReactNode;           // plain text, <em>, <br/> allowed
  className?: string;
  split?: "lines" | "words" | "chars"; // default "lines"
  trigger?: "scroll" | "mount" | "manual"; // default "scroll"
  start?: string;                      // ScrollTrigger start, default "top 85%"
  delay?: number; stagger?: number; duration?: number;
  ref?: React.Ref<TextRevealHandle>;   // for trigger="manual"
}): JSX.Element

// ShutterImage.tsx — geometric slat mask reveal + parallax scale
export function ShutterImage(props: {
  image: MediaImage; className?: string; sizes?: string; priority?: boolean;
  slats?: number;                      // default 6
  direction?: "vertical" | "horizontal"; // slat orientation, default "vertical"
  parallax?: number;                   // 0–1, default 0.12 (fraction of height travelled over scroll)
  scale?: number;                      // starting scale, default 1.18
  start?: string;                      // default "top 80%"
  plate?: "forest" | "vellum";         // slat colour, default matches section
  ratio?: string;                      // CSS aspect-ratio, default from image dims
  transitionHero?: boolean;            // sets data-transition-hero
}): JSX.Element

// FocusReveal.tsx — blur-to-focus (pre-blurred layer crossfades to sharp; opacity+transform only)
export function FocusReveal(props: {
  image: MediaImage; className?: string; sizes?: string;
  children?: React.ReactNode;          // overlay content (caption, link)
  scrub?: boolean | number;            // default true; false = play once on enter
  scale?: number;                      // default 1.08
  ratio?: string;
  transitionHero?: boolean;
}): JSX.Element

// Parallax.tsx
export function Parallax(props: { children: React.ReactNode; speed?: number; className?: string }): JSX.Element

// Magnetic.tsx — gravity for any single element child (forwards ref)
export function Magnetic(props: {
  children: React.ReactElement; strength?: number; /* 0–1, default 0.35 */ radius?: number; /* px, default 110 */
}): JSX.Element
// MagneticButton.tsx — house button (gold hairline pill, caps label) with gravity built in
export function MagneticButton(props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "gold" | "ghost" | "forest"; size?: "md" | "lg"; label: string; icon?: React.ReactNode;
}): JSX.Element

// Cursor.tsx — mount once
export function Cursor(): JSX.Element | null
```

### gl/

```ts
// GLStage.tsx — mount once, fixed full-viewport canvas (z 90). Render-on-demand.
export function GLStage(): JSX.Element
export function getStage(): Stage | null
interface Stage {
  renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.OrthographicCamera;
  requestRender(): void;                     // one frame
  acquireLoop(owner: string): void;          // continuous rAF while any owner holds it
  releaseLoop(owner: string): void;
  setVisible(v: boolean): void;              // canvas opacity 0/1 (CSS)
}

// transitionController.ts
export type TransitionKind = "ripple" | "stretch" | "dissolve";
export const transitions: {
  navigate(href: string, opts?: { kind?: TransitionKind; to?: string; origin?: { x: number; y: number } }): Promise<void>;
  preload(url: string): void;               // warm a texture
  get active(): boolean;
}
export function usePageEnter(cb: () => void): void  // fires when the curtain lifts on the new page (and on first load after intro)

// TransitionProvider.tsx — mount once inside layout; binds next/navigation router + pathname to the controller
export function TransitionProvider({ children }): JSX.Element

// TransitionLink.tsx — next/link + onNavigate interception
export function TransitionLink(props: LinkProps & React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  kind?: TransitionKind; to?: string; /* texture url for destination */ children: React.ReactNode;
}): JSX.Element
```

Transition sequence (`transitions.navigate`):

1. `store.transition = "out"`. Read `from` = `[data-transition-hero]` on the current page (fallback: brand plate).
2. Stage canvas fades in (0.25 s) showing `from`; shader `uProgress` 0 → 1 over `DUR.transition` with `ease: "cinematic"`; DOM content dims to Forest in parallel.
3. At `uProgress ≥ 0.5` → `router.push(href)`. Await pathname change **and** `to` texture ready (whichever is later); meanwhile the shader holds on the displaced midpoint if needed.
4. `scrollControl.scrollTo(0, { immediate: true })`, `store.transition = "in"`, canvas fades out (0.6 s) revealing the new page whose hero is the same image → seamless.
5. `store.transition = "idle"`, `usePageEnter` callbacks fire → hero copy unmasks.

Shader (fragment) — one material, three kinds selected by `uKind`:

```glsl
// dissolve: noise-threshold reveal with gold-tinted edge
// ripple: radial sine displacement from uOrigin, decaying with distance
// stretch: vertical stretch of `from` while `to` compresses in — the "rubber film" feel
vec2 d   = (texture2D(uDisp, vUv * uDispScale).rg - 0.5) * 2.0;   // procedural noise DataTexture
float p  = uProgress;
vec2 uvA = vUv + d * p * uIntensity;            // from-image pushed by noise
vec2 uvB = vUv - d * (1.0 - p) * uIntensity;    // to-image pulled into place
vec4 a   = texture2D(uFrom, coverUv(uvA, uFromRes));
vec4 b   = texture2D(uTo,   coverUv(uvB, uToRes));
gl_FragColor = mix(a, b, smoothstep(0.2, 0.8, p));
```

Fallback: no WebGL / reduced motion → CSS curtain (forest plate wipes up, 0.7 s).

### booking/

```ts
export function BookingProvider({ children }): JSX.Element  // renders <BookingDrawer/> portal
export function useBooking(): { open(slug: string): void; close(): void; isOpen: boolean }
export const booking: { open(slug: string): void; close(): void }  // for non-React callers
```

Drawer choreography (GSAP timeline, `ease: "cinematic"`):
`scrollControl.stop()` → backdrop opacity 0→1 (0.5 s) with `backdrop-filter: blur(24px)` →
panel `xPercent: 100 → 0` (0.9 s) → content lines unmask (stagger 0.06) → padlock shackle snaps shut
(0.4 s, `ease: "back.out(2)"`) → wallet buttons rise. Close reverses at 0.7× speed. Focus is trapped; `Esc` closes.

Payments: `PaymentButtons.tsx` feature-detects Apple Pay (`ApplePaySession.canMakePayments()`) and
Google Pay / generic wallets (`PaymentRequest` + `canMakePayment()`), renders the matching one-click
button, and hands off to `lib/payments.ts` (`processDeposit()` — mock processor, replace with PSP).

## Motion grammar

| Moment                     | Recipe                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| Headline enters            | SplitText lines, mask overflow, `yPercent: 110 → 0`, `duration 1.1`, `stagger 0.085`, ease `fable` |
| Image enters               | Slats `scaleY 1 → 0` (stagger 0.06, ease `cinematic`) + image `scale 1.18 → 1` (1.4 s)     |
| Image on scroll            | `yPercent` parallax (scrub), 8–15 % travel                                                 |
| Destination emerges        | Pre-blurred layer opacity 1 → 0 and `scale 1.08 → 1`, scrubbed over the section's approach |
| Button hover               | Magnetic pull ≤ 35 % of offset, `quickTo` 0.4 s; media inside `scale(1.06)` 0.3 s          |
| Cursor                     | 8 px gold dot; on `[data-cursor]` grows to 64 px glass circle (`backdrop-filter: blur(8px)`) |
| Scarcity                   | `[ 2 Spots Remaining ]` gold pulse, 2.4 s loop, opacity 0.55 ↔ 1 (CSS, compositor-only)     |
| Collective marquee         | CSS `translateY` keyframes on a duplicated column, 38 s loop; pauses on hover              |

## 60 fps rules (non-negotiable)

1. Scroll-linked work animates **transform and opacity only**. No `filter`, `height`, `top`, `box-shadow`, or `background-position` on scrub.
2. Blur-to-focus uses a **pre-blurred asset crossfade**, never a live `filter: blur()` sweep on a large image.
3. The GL stage renders **on demand**: no rAF loop while idle. `acquireLoop/releaseLoop` bracket every effect.
4. Renderer: `antialias: false`, `powerPreference: "high-performance"`, DPR capped at 1.5, textures `LinearFilter`, no mipmaps, ≤ 2048 px.
5. Lenis drives GSAP's ticker (`gsap.ticker.add(t => lenis.raf(t * 1000))`, `lagSmoothing(0)`); ScrollTrigger updates from Lenis `scroll` events. Never `normalizeScroll`.
6. `will-change` is applied by GSAP for the duration of a tween only; no permanent promotion of large layers except the fixed canvas and cursor.
7. Continuous loops (marquee, pulse) are CSS animations so they survive main-thread work.
8. Every `ScrollTrigger` is created inside `gsap.context()` / `useGSAP`-style effects and reverted on unmount; `ScrollTrigger.refresh()` after fonts load and after route enter.
9. Images: intrinsic `width/height`, `sizes`, lazy below the fold, `priority` for the hero only.
10. Reduced motion: everything settles to its final state immediately; the site remains fully usable.

## Media manifest

Generated by `npm run media` into `public/media` (override root with `NEXT_PUBLIC_MEDIA_BASE`):

```
hero/hero.webm  hero/poster.jpg  hero/poster-blur.jpg
journeys/<slug>/hero.jpg (+ -blur)  card.jpg (+ -blur)  chapter-01..05.jpg (+ -blur)
portraits/p01..p16.jpg            monochrome, 600×800
curators/c01..c04.jpg             monochrome, 600×800
```
