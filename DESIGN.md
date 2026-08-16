# Design.md
## UI/UX Design System — Patient-Facing (Frontend)
### RSU Tangsel Care

**Scope of this document:** patient-facing only (landing page/home + all patient features: online registration, status check, outpatient care, doctor chat). Backoffice/staff is out of scope.

**Technical assumption:** this document is written for **React (web)** — the components, breakpoints, and responsive patterns below assume rendering in a browser (desktop + mobile web), not a native mobile app. If the target is actually React Native (a separate mobile app from the web), parts of it (CSS breakpoints, hover states, semantic HTML) need adapting — confirm before implementation to avoid going in the wrong direction.

---

## 1. Design Philosophy

**Principle: plain, clean, and familiar.** This is not a product that needs a bold visual identity or "wow" elements — it is a public healthcare facility used across all ages and tech backgrounds. Goal: a person opens the site and immediately knows what to do, without ever thinking about the design.

Concrete reference points: **shadcn/ui** and **Tailwind UI** — not as a visual theme to copy verbatim, but as a standard of design discipline: consistent spacing scale, simple typography (1 typeface, a few weights), dominant neutral colors, brand color used sparingly and intentionally, small-to-medium consistent border radius, subtle shadows, no decorative gradients, no glassmorphism, no 3D/AI-generated look.

**Explicitly avoided** (the "generic AI" look we don't want here):
- Rainbow gradients as backgrounds or large buttons.
- Generic abstract blob/3D illustrations.
- Dramatic bold display fonts on every heading.
- Cards with large floating shadows + excessive border radius (e.g. `rounded-3xl` on everything).
- Emoji as a substitute for functional icons.
- Marketing-speak copy ("Your future health solution!") — use functional, clear, direct language.
- Layouts with too much decorative whitespace (large empty space without structural reason).

---

## 2. Design Tokens

### 2.1 Colors

Neutral base (shadcn-style gray scale — not monotonous gray, with a subtle cool undertone to match the teal brand):

| Token | Hex | Usage |
|---|---|---|
| `--background` | `#FFFFFF` | Main background |
| `--foreground` | `#1C2626` | Primary text (not pitch black #000) |
| `--muted` | `#F1F4F4` | Secondary section background, neutral cards |
| `--muted-foreground` | `#5C6B6B` | Secondary text, captions, placeholders |
| `--border` | `#E2E8E8` | Borders, dividers |

Brand colors (from the RSU Tangsel Care logo), used **selectively**, not dominantly:

| Token | Hex | Usage |
|---|---|---|
| `--primary` | `#0E7D80` | Primary buttons, active links, functional icons, interactive elements |
| `--primary-foreground` | `#FFFFFF` | Text on primary |
| `--primary-hover` | `#0A5F61` | Hover/active state |
| `--accent` | `#E63946` | **Very limited** — emergency/urgent badges only, not decoration |

Status colors (independent of brand colors, industry standard to avoid ambiguity):

| Token | Hex | Usage |
|---|---|---|
| `--success` | `#16A34A` | Confirmation status, success |
| `--warning` | `#D97706` | Pending status, needs attention |
| `--destructive` | `#DC2626` | Error, cancel, failed |

**Target ratio on a single page:** ~85% neutral (white/gray/text), ~10% primary (teal), ~5% status/accent combined. If a page looks "colorful", the design is drifting from the principle.

### 2.2 Typography

One typeface for the whole product (not a contrasting display+body combination) — consistent with the shadcn/Tailwind UI approach:

- **Font:** Inter (or system font stack as fallback: `-apple-system, "Segoe UI", Roboto, sans-serif`) — chosen because it's neutral, very well-tested for readability at various screen sizes and user conditions (including elderly users), and already standard in many digital health/government products.
- **Size scale** (mobile-first, base 16px — not 14px, because the elderly target needs a larger baseline than the common default):

| Token | Size | Usage |
|---|---|---|
| `text-xs` | 13px | Captions, small labels (used sparingly) |
| `text-sm` | 14px | Secondary text |
| `text-base` | 16px | Default body text |
| `text-lg` | 18px | Large body text (user option, see §5) |
| `text-xl` | 22px | Subheading |
| `text-2xl` | 28px | Section heading |
| `text-3xl` | 34px | Page/hero heading (used sparingly, home only) |

- **Weight:** Regular (400) for body, Medium (500) for labels/buttons, SemiBold (600) for headings. Avoid excessive Bold (700+) across many elements — it makes the page noisy.
- **Line-height:** 1.5 for body text (not cramped 1.2) — important for elderly/low-vision readers.

### 2.3 Spacing & Layout

4px-based spacing scale (Tailwind standard): `4, 8, 12, 16, 24, 32, 48, 64px`. Used consistently for padding, gap, margin — don't use free values outside this scale.

- **Border radius:** `--radius: 8px` for button/input, `12px` for cards. No more than that — avoid large radius (`24px+`) that reads "playful/AI generated".
- **Shadow:** thin and functional only — `0 1px 2px rgba(0,0,0,0.05)` for cards, used to distinguish layers, not a decorative "floating" effect.
- **Container max-width:** 1200px on desktop, with horizontal padding 16px (mobile) → 24px (tablet) → 32px (desktop).

### 2.4 Responsive Breakpoints

| Breakpoint | Width | Target |
|---|---|---|
| `sm` | ≥640px | Large mobile / landscape |
| `md` | ≥768px | Tablet |
| `lg` | ≥1024px | Small desktop |
| `xl` | ≥1280px | Desktop |

**Mobile-first approach is mandatory** — design & code start from the mobile layout (≤640px), then scale up. The majority of patients access from their phones.

---

## 3. Components (Inventory, shadcn/ui style)

All components below follow the shadcn/ui pattern: composable, accessible by default (built on Radix primitives if using React), minimally styled via Tailwind utility classes, not heavy custom components.

| Component | Used in | Notes |
|---|---|---|
| `Button` (primary/outline/ghost) | Register online CTA, form submit, secondary actions | Min height 44px (tap target, see §5) |
| `Input`, `Select`, `DatePicker` | Registration form, OTP | Label always visible above the input, not placeholder-only |
| `Card` | Booking summary, doctor search results | Thin border + minimal shadow, not large shadow |
| `Badge` | Booking status (`pending`/`confirmed`/`cancelled`) | Status token colors, not brand colors |
| `Stepper`/`Progress` | Multi-step register online flow | Step number + text label, not icons only |
| `Dialog`/`Sheet` | Confirmation, doctor chat disclaimer | Sheet (bottom sheet) on mobile, Dialog on desktop |
| `Toast` | Action result notifications (booking success, OTP sent) | Auto-dismiss with manual close option |
| `Tabs` | Language toggle, info categories | Underline style, not large pills |
| `Skeleton` | Loading state for doctor schedule/data | Not a generic spinner — more informative for list content |

**Component selection principle:** if there's a direct equivalent in shadcn/ui, use that pattern (props, structure, naming) as the baseline, then adjust the color/spacing tokens to the system above. Don't reinvent established patterns.

---

## 4. Multi-Language (i18n)

- **Default language:** Indonesian. **Secondary language:** English (for tourists/expats/foreign patients' families).
- Language toggle **always visible** in the header (not hidden in a menu/footer) — globe icon + language code label (`ID` / `EN`), top-right, consistent across all pages.
- **All UI strings are externalized** (not hardcoded in components) — key-per-feature structure, e.g.:
  ```
  {
    "booking.step1.title": "Pilih Poli",
    "booking.step1.title_en": "Select Department"
  }
  ```
- Date, time, and number formatting **follows the active locale** (e.g. `dd/mm/yyyy` for ID; 24-hour format stays in both languages since it's more common in the Indonesian hospital context — avoid AM/PM which can confuse elderly users).
- Medical/administrative terms (department names, service types) have validated translations — not raw machine translation, since they directly affect patients' understanding of health services.
- Safety disclaimers (doctor chat, emergency directions) **must be available in both languages** with identical meaning, not just literal translation.

---

## 5. Accessibility — Elderly & Disabled Users

Target standard: **WCAG 2.1 level AA** minimum, with additional adjustments specific to the elderly population (the majority of healthcare facility users).

### 5.1 For Elderly Users
- **16px base font, with text size control** — A-/A+ buttons in the header to enlarge text without breaking the layout (not just relying on browser zoom).
- **Minimum 44×44px tap/click targets** for all interactive elements (buttons, links, checkboxes) — per WCAG and Apple/Google HIG recommendations, crucial for users with tremors/limited motor control.
- **Minimum color contrast 4.5:1** for normal text, 3:1 for large text/UI components — all token color combinations in §2.1 are validated against this ratio before use (teal `#0E7D80` on white needs re-checking for small text; if insufficient, use the darker `--primary-hover` for text).
- **Plain language** — avoid unexplained technical/medical terms, avoid unexplained abbreviations (e.g. spell out "IGD" once at the start: "IGD (Instalasi Gawat Darurat)").
- **Linear flow, one action per screen** — avoid pages with many simultaneous choices; multi-step processes (online registration) are split per step with a "Back" button always available.
- **Explicit confirmation before important actions** — confirmation dialog for cancelling a booking, not an immediate action without pause.

### 5.2 For Users with Disabilities
- **Full keyboard navigation** — all interactive elements reachable via Tab, logical focus order following the visual flow, **visible focus ring** (not `outline: none` without replacement).
- **Screen reader support** — semantic HTML required (`<button>` not `<div onClick>`, `<label>` connected to `<input>`, consistent heading hierarchy `h1`→`h2`→`h3`), `aria-label` for textless icons, `aria-live` for dynamic updates (booking status, OTP results).
- **Reduced motion** — respect `prefers-reduced-motion`; transitions optional/minimal, no auto-play carousel or animation that can't be turned off.
- **Descriptive alt text** for all informative images (doctor photos, service icons); decorative images get `alt=""` so they don't disturb screen readers.
- **Clear form errors** — error messages connected directly to the relevant field (`aria-describedby`), not just red border color (for color blindness) — include icon + text.
- **Don't rely on color alone** — booking status uses color + text label + icon (not just a color badge), important for color-blind users.

---

## 6. Page Structure & Wireframe (Concise)

### 6.1 Home (Landing Page)

```
┌─────────────────────────────────────────┐
│ [Logo]      Home  Services  Info  [ID/EN] │  ← sticky header, white, thin bottom border
├─────────────────────────────────────────┤
│                                           │
│   RSU Tangsel Care                       │  ← heading, not a dramatic hero
│   Merawat Sepenuh Hati                   │
│                                           │
│   [ Register Online ]  [ Check Status ]  │  ← 2 main CTAs, primary + outline
│                                           │
├─────────────────────────────────────────┤
│  Quick Services (2x2 grid mobile / 4x1 desktop) │
│  [Register Online] [Outpatient] [Doctor Chat] [Emergency Info] │
├─────────────────────────────────────────┤
│  Practical info: service hours, location, emergency contacts (text, not illustrations) │
└─────────────────────────────────────────┘
```

Principle: the home page is **functional**, not a marketing landing page. Priority: the two main CTAs visible immediately without scrolling (above the fold) on mobile.

### 6.2 Register Online (Multi-step)

```
[ Stepper: ①Department — ②Doctor&Schedule — ③Personal Data — ④Confirmation ]

Active step shown in full, other steps collapsed/dimmed.
"Next" button (primary) + "Back" (ghost) always at the bottom, sticky on mobile.
```

### 6.3 Check Status / Outpatient Care

Simple list based on `Card`: one card per booking/visit, contents: status `Badge`, date, department, contextual action button ("Cancel" / "View Details"). No dense data tables (not mobile/elderly friendly).

### 6.4 Doctor Chat

- Entry point: large button on home → opens `Sheet`/redirects to WhatsApp.
- Disclaimer must appear as a `Dialog` before the chat starts, requiring an "I Understand" click to continue (not auto-dismiss).

---

## 7. Pre-Release Quality Checklist

- [ ] All breakpoints (sm/md/lg/xl) checked manually, not just a quick browser resize.
- [ ] Color contrast validated with a tool (e.g. WebAIM Contrast Checker) for each text/background combination.
- [ ] End-to-end keyboard navigation tried without the mouse at all.
- [ ] Screen reader (VoiceOver/NVDA) tried at minimum for the register online flow.
- [ ] ID/EN language toggle checked consistently across all pages, including error messages and disclaimers.
- [ ] Font size manually increased (browser zoom 200%) — layout must not break/overlap.
- [ ] `prefers-reduced-motion` tested, animations correctly disabled.
- [ ] Tap targets measured — no interactive element below 44px.
