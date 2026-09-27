# XuPay: dark glass design spec

Reference: `Screenshot 2026-09-26 121240.png` (Fampal Banking Solution landing, Dribbble shot 24487828).
Applies to the whole frontend: landing, auth, and the signed-in app.
Built on Next.js App Router, Tailwind v4 `@theme` tokens in `src/app/globals.css`, and three / @react-three/fiber / @react-three/drei for the hero rings.

**Content rule:** keep XuPay's copy, brand name and routes, and change only the visual design. Where the reference has a slot that XuPay has no content for, the slot is filled from XuPay's own product data and nothing is invented. The two cases are covered in §6.

---

## 1. How the reference was measured

The screenshot is 1200×720 and shows the design scaled down. The scale was worked out from the type:

- **Scale:** the H1 line pitch is 68px and the badge text is about 9.5px, which puts the scale near 0.78. Every px value below has been converted to a 1440px desktop.
- **Colours:** sampled with PIL. The screenshot is compressed, so small hue shifts were rounded.

### Corrections to the brief

| Item | Brief said | Reference shows | Adopted |
|---|---|---|---|
| Page ground | `#050507` | `#020204` at the corners, lifting to ~`#050507` under the grid | `#030305` |
| Grid cell | ~64px | 45–47px in the screenshot, about **56px** at 1440 | `56px` |
| Grid line | white ~5% | ~2–3% at the edges, ~4–6% at the centre where the mask is strongest | `rgb(255 255 255 / 5%)` under a radial mask |
| Ring aperture | *(not in brief)* | Inside the top ring the ground is a lifted charcoal disc (`#1c1c22`), not black | Radial `--aperture` glow behind the top ring, painted under the grid |
| Badge text | ~12px | 12px, but **near-white** (`#f4f4f6`), not grey | `#e4e4e7`, 12px, weight 500 |
| Badge fill | white/10 | Barely lighter than the aperture it sits on | `white/6` fill, `white/10` border |
| Subtitle width | ~620px | 681px in the screenshot, about **860px** at 1440, over 2 lines | `max-width: 860px` |
| CTA gradient | `#5B5BF0 → #8B7CF8`, horizontal | **Vertical**: `#4358D1` at the top, a violet `#9B90F1` bloom at the bottom centre | `linear(180deg, #4358D1 → #5A5FE0)` plus a radial `#9B90F1` bloom held under the label (see §7) |
| Social proof | 3 photo avatars + "1.5M people" | Same | **Not copied.** XuPay has no user count and no customer photos. See §6 |
| Card border | white/10 | Indigo-tinted (`#25206b`), with a lavender highlight line on the top edge (`#9a90c8`) | `rgb(124 116 236 / 28%)` border plus a top highlight gradient |
| Card subtitle | grey | Lavender-grey `#9091b5`: grey text over the indigo bloom | Plain `--body-foreground`; the bloom tints it the same way |
| Toggle track | dark pill | The track is almost invisible and the active pill is navy `#101934` | Track `white/4`; active `#111a36` with a `white/10` hairline |

---

## 2. Tokens

Every colour is a CSS variable in `:root` of `globals.css`. There is one theme: the app is dark-only, and `<html>` carries `.dark` so the `dark:` variants in the shadcn primitives apply.

### Ground and text

| Token | Value | Contrast on `--background` | Use |
|---|---|---|---|
| `--background` | `#030305` | n/a | Page ground |
| `--foreground` | `#ffffff` | 20.6:1 | Headings |
| `--body-foreground` | `#a1a1aa` | 8.0:1 | Body copy |
| `--muted-foreground` | `#8b8b94` | 6.1:1 (5.4:1 inside the indigo bloom) | Labels, captions |
| `--aperture` | `#1c1c22` | n/a | Charcoal disc inside the top ring |

### Surfaces

| Token | Value | Use |
|---|---|---|
| `--surface` | `#0a0a0f` | **Opaque** data surface: tables, forms, app panels |
| `--surface-2` | `#101016` | Raised rows, table heads, hover wells |
| `--surface-hover` | `#15151c` | Row hover |
| `--glass` | `rgb(255 255 255 / 3%)` | Marketing and auth glass (needs `backdrop-blur`) |
| `--glass-strong` | `rgb(255 255 255 / 6%)` | Badges, floating chips, nav |
| `--glass-edge` | `rgb(255 255 255 / 10%)` | Glass borders |

### Lines

| Token | Value |
|---|---|
| `--hairline` | `rgb(255 255 255 / 8%)` |
| `--hairline-strong` | `rgb(255 255 255 / 14%)` |
| `--border` | `rgb(255 255 255 / 10%)` |
| `--input` | `rgb(255 255 255 / 12%)` |
| `--grid-line` | `rgb(255 255 255 / 5%)` |
| `--grid-size` | `56px` |

### Brand (indigo to violet)

| Token | Value | Notes |
|---|---|---|
| `--cta-from` | `#4358d1` | CTA top edge (measured). White text 5.9:1 |
| `--cta-to` | `#5a5fe0` | CTA bottom body. White text 4.9:1 |
| `--cta-bloom` | `#9b90f1` | Violet bloom. **Only 2.7:1 under white**, so it stays below the label's baseline |
| `--primary` | `#4b55db` | Solid fill under white text (shadcn `Button`), 5.8:1 |
| `--primary-accent` | `#a5a6ff` | Accent **text** and links, 9.3:1 |
| `--ring` | `#7c7cf5` | Focus ring |
| `--glow-indigo` | `rgb(91 91 240 / 45%)` | Card bloom and highlighted plan |
| `--card-edge` | `rgb(124 116 236 / 28%)` | Indigo-tinted glass card border |
| `--card-highlight` | `#9a90c8` | Top-edge light line on the big card |
| `--segment-active` | `#111a36` | Active segment in toggles |

### Status (dark-tuned; every value clears 5:1 on `--surface`)

| Token | Value |
|---|---|
| `--success` | `#3dd68c` |
| `--warning` | `#e0a726` |
| `--error` | `#f2555a` |

### Charts

The categorical palette is unchanged: `#3987e5`, `#d95926`, `#199e70`, `#c98500`. It was validated for colour-blindness on dark originally and holds 4.7–6.7:1 on `--surface`. The chart ink (axes and grid) moves to white-alpha: grid `#1b1b21`, axis text `#8b8b94`.

---

## 3. Typography

| Role | Spec |
|---|---|
| Family | **Geist Sans**. It is the neo-grotesk closest to the reference that is available offline, and it is already self-hosted. **Geist Mono** is kept for money and IDs |
| H1 (hero) | weight **300**, `clamp(3rem, 7vw, 5.5rem)`, line-height **1.0**, tracking **-0.04em**, white, sentence case (no uppercase) |
| Section H2 | weight 400, `clamp(2.25rem, 4.5vw, 3.5rem)`, line-height 1.05, tracking -0.035em |
| Card title | 28px, weight 500, tracking -0.02em |
| Body / subtitle | 15px, line-height 1.6, `--body-foreground` |
| Badge | 12px, weight 500, `#e4e4e7` |
| App page title | 22px, weight 500, tracking -0.02em |

---

## 4. Global background

The layers, bottom to top:

1. `--background`
2. `--aperture` glow
3. Grid
4. Rings
5. Content

- **Grid:** two 1px linear gradients on a `--grid-size` lattice, masked by `radial-gradient(ellipse 60% 55% at 50% 35%, #000 30%, transparent 75%)`. It is visible in the centre and gone at the edges.
- **Aperture:** `radial-gradient(circle at 50% -4%, var(--aperture) 0 26%, transparent 42%)`, sized to the top ring.

## 5. Hero

- **Layout:** a single centred column. The badge sits at ~24% of the viewport height and the H1 lines at ~32% and ~41%. The subtitle follows 24px below, the CTA row 36px below that, and the card top at ~74% of the viewport height.
- **Badge:** pill, 12px text, padding `6px 14px`, `--glass-strong` fill, `--glass-edge` border.
- **CTA row:** gap 28px. The primary pill is 48px tall with 32px horizontal padding and 15px/500 text. On hover the glow grows from a 12px blur at 35% to a 28px blur at 55%. At ≤640px the row stacks, centred.
- **Avatars:** 44px circles overlapped by -12px, with a 2px `--background` ring.
- **Proof text:** two lines. Line 1 uses `--body-foreground`, line 2 has the key figure in white 600.

### The rings (React Three Fiber)

| Item | Spec |
|---|---|
| Canvas | Absolute, spanning the hero plus the card overlap. Transparent (`alpha`). DPR `[1, 1.5]`. Mounted client-only via `dynamic(..., { ssr: false })` |
| Top ring | Outer diameter ≈ **58% of the viewport width** (≈840px at 1440). Tube radius ≈ 12% of the major radius. Centre x 50%, centre y ≈ -2% of the viewport height, so the viewport top crops it |
| Lower ring | Outer diameter ≈ **41% of the viewport width**. Centre x 50.5%. Its top edge meets the top ring just under the H1's second line. The glass card hides its lower half |
| Material | `MeshTransmissionMaterial`: transmission 1, thickness ~1.4, chromaticAberration ~0.8, anisotropicBlur ~0.2, roughness ~0.06, ior ~1.4, backside on, samples 6, resolution 512 |
| Light | `<Environment resolution={256}>` built only from `Lightformer`s, so no HDR is fetched. Warm red/orange on the left, blue/violet on the right, white strips above and below for the hot highlights |
| Motion | Spin ~0.1 rad/s about each ring's axis. Mouse parallax of ±0.12 rad tilt, eased |
| Budget | Stops rendering when the hero leaves the viewport (`frameloop="never"`) |
| Fallback | Static `public/ring-fallback.png` (a transparent render of the same scene) under 768px, under `prefers-reduced-motion`, and before the canvas mounts. SSR paints the fallback, so the LCP is never a blank hero |
| Readability | The H1 gets `text-shadow: 0 2px 24px rgb(3 3 5 / 55%)`, which keeps white strokes legible where they cross the ring's white highlights |

## 6. Content mapping (reference slot to XuPay content)

| Reference | XuPay |
|---|---|
| Badge "Welcome to Fampal…" | "Ledger-accurate payments" |
| H1 "AI Touch in your / Every Financial Decision" | "Every cent, / accounted for" |
| Subtitle | Existing hero paragraph |
| "Join Beta" | "Open an account" → `/register` (the hero's "Sign in" stays in the nav) |
| Photo avatars + "Trusted by over 1.5M People" | **No user count exists, so none is claimed.** Three initial-avatars (the app's own contact-chip style) + "Transfers between wallets / **0 ₫** fee · settles instantly". Both facts already appear on the landing (TransferQuoteCard fee, "Settles instantly") |
| "Payment Driven solution" pricing card | "Tiered limits" + "Verification unlocks higher transaction and volume limits." (existing Compliance copy) |
| Monthly / Annual toggle | **Per day / Per hour**: the real transaction caps |
| 3 plan cards, middle highlighted | Basic / **Verified** / Premium (KYC tiers 1–3), with real values from the `transaction_limits` seed (`infrastructure/db/user-service/V1__complete_user_schema.sql`): transfers per day 20/50/200, per hour 5/10/50; international sending no/yes/yes; merchant payments yes/yes/yes. Money caps are left out on purpose: the seed is in USD cents while the wallet shows VND, so they would read as "1.000 ₫/day" |
| Pastel section artwork, floating chips | Replaced by the new visual language (rings, grid, indigo glows). The transfer quote moves into the Ledger section, where "you send = they receive, fee 0" illustrates the section's own claim |

## 7. Components

- **Glass card (big):** radius **28px**, `--glass` fill, `--card-edge` border, `backdrop-blur(24px)`. An inset top highlight (`--card-highlight` fading along the top edge) and a `--glow-indigo` bloom radiating down from the top centre.
- **Segmented toggle:** track `white/4` with a `white/8` hairline, radius full, padding 4px. Items are 13px/500 with 6px×14px padding. Active is `--segment-active` + white text; inactive is `--muted-foreground`.
- **Plan card:** radius 18px, fill `white/2`, `--hairline` border. The highlighted plan gets a `#5b5bf0`/70% border and an outer glow of `0 0 0 1px` plus a 40px indigo bloom at 25%.
- **CTA pill:** vertical gradient `--cta-from → --cta-to`. The `--cta-bloom` radial sits at 50% 120%, so the label (vertical centre) sits on ≥4.9:1. Inner highlight `inset 0 1px 0 white/25`.
- **App data surfaces:** `.panel` stays **opaque** (`--surface` + `--hairline` + a soft black shadow). Money on translucent glass over a lit ground is illegible, so glass is for marketing and auth only.
- **Inputs:** `--surface-2` fill, `--input` border, `--ring` focus.

## 8. Responsive

| Width | Rules |
|---|---|
| ≥1024 | As specified |
| 768–1023 | Canvas still on. Rings scale with the viewport width. Plan cards in 3 columns while each is ≥200px wide |
| <768 (375 target) | Static fallback ring at ~120% of the viewport width, cropped by the top. CTA row stacked. Plan cards in one column. Glass card radius 22px, padding 24px |
