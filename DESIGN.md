# Design.md
## UI/UX Design System - Patient-Facing (Frontend)
### RSU Tangsel Care

**Scope of this document:** patient-facing only (landing page/home + all patient features: online registration, status check, outpatient care, doctor chat). Backoffice/staff is out of scope.

**Technical assumption:** this document is written for **React (web)** - the components, breakpoints, and responsive patterns below assume rendering in a browser (desktop + mobile web), not a native mobile app. If the target is actually React Native (a separate mobile app from the web), parts of it (CSS breakpoints, hover states, semantic HTML) need adapting - confirm before implementation to avoid going in the wrong direction.

---

## 1. Design Philosophy

**Principle: plain, clean, and familiar.** This is not a product that needs a bold visual identity or "wow" elements - it is a public healthcare facility used across all ages and tech backgrounds. Goal: a person opens the site and immediately knows what to do, without ever thinking about the design.

Concrete reference points: **shadcn/ui** and **Tailwind UI** - not as a visual theme to copy verbatim, but as a standard of design discipline: consistent spacing scale, simple typography (1 typeface, a few weights), dominant neutral colors, brand color used sparingly and intentionally, small-to-medium consistent border radius, subtle shadows, no decorative gradients, no glassmorphism, no 3D/AI-generated look.

**Explicitly avoided** (the "generic AI" look we don't want here):
- Rainbow gradients as backgrounds or large buttons.
- Generic abstract blob/3D illustrations.
- Dramatic bold display fonts on every heading.
- Cards with large floating shadows + excessive border radius (e.g. `rounded-3xl` on everything).
- Emoji as a substitute for functional icons.
- Marketing-speak copy ("Your future health solution!") - use functional, clear, direct language.
- Layouts with too much decorative whitespace (large empty space without structural reason).

---

## 2. Design Tokens

### 2.1 Colors

Neutral base (shadcn-style gray scale - not monotonous gray, with a subtle cool undertone to match the teal brand):

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
| `--accent` | `#E63946` | **Very limited** - emergency/urgent badges only, not decoration |

Status colors (independent of brand colors, industry standard to avoid ambiguity):

| Token | Hex | Usage |
|---|---|---|
| `--success` | `#16A34A` | Confirmation status, success |
| `--warning` | `#D97706` | Pending status, needs attention |
| `--destructive` | `#DC2626` | Error, cancel, failed |

**Target ratio on a single page:** ~85% neutral (white/gray/text), ~10% primary (teal), ~5% status/accent combined. If a page looks "colorful", the design is drifting from the principle.

### 2.2 Typography

One typeface for the whole product (not a contrasting display+body combination) - consistent with the shadcn/Tailwind UI approach:

- **Font:** Inter (or system font stack as fallback: `-apple-system, "Segoe UI", Roboto, sans-serif`) - chosen because it's neutral, very well-tested for readability at various screen sizes and user conditions (including elderly users), and already standard in many digital health/government products.
- **Size scale** (mobile-first, base 16px - not 14px, because the elderly target needs a larger baseline than the common default):

| Token | Size | Usage |
|---|---|---|
| `text-xs` | 13px | Captions, small labels (used sparingly) |
| `text-sm` | 14px | Secondary text |
| `text-base` | 16px | Default body text |
| `text-lg` | 18px | Large body text (user option, see §5) |
| `text-xl` | 22px | Subheading |
| `text-2xl` | 28px | Section heading |
| `text-3xl` | 34px | Page/hero heading (used sparingly, home only) |

- **Weight:** Regular (400) for body, Medium (500) for labels/buttons, SemiBold (600) for headings. Avoid excessive Bold (700+) across many elements - it makes the page noisy.
- **Line-height:** 1.5 for body text (not cramped 1.2) - important for elderly/low-vision readers.

### 2.3 Spacing & Layout

4px-based spacing scale (Tailwind standard): `4, 8, 12, 16, 24, 32, 48, 64px`. Used consistently for padding, gap, margin - don't use free values outside this scale.

- **Border radius:** `--radius: 8px` for button/input, `12px` for cards. No more than that - avoid large radius (`24px+`) that reads "playful/AI generated".
- **Shadow:** thin and functional only - `0 1px 2px rgba(0,0,0,0.05)` for cards, used to distinguish layers, not a decorative "floating" effect.
- **Container max-width:** 1200px on desktop, with horizontal padding 16px (mobile) → 24px (tablet) → 32px (desktop).

### 2.4 Responsive Breakpoints

| Breakpoint | Width | Target |
|---|---|---|
| `sm` | ≥640px | Large mobile / landscape |
| `md` | ≥768px | Tablet |
| `lg` | ≥1024px | Small desktop |
| `xl` | ≥1280px | Desktop |

**Mobile-first approach is mandatory** - design & code start from the mobile layout (≤640px), then scale up. The majority of patients access from their phones.

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
| `Skeleton` | Loading state for doctor schedule/data | Not a generic spinner - more informative for list content |

**Component selection principle:** if there's a direct equivalent in shadcn/ui, use that pattern (props, structure, naming) as the baseline, then adjust the color/spacing tokens to the system above. Don't reinvent established patterns.

---

## 4. Multi-Language (i18n)

- **Default language:** Indonesian. **Secondary language:** English (for tourists/expats/foreign patients' families).
- Language toggle **always visible** in the header (not hidden in a menu/footer) - globe icon + language code label (`ID` / `EN`), top-right, consistent across all pages.
- **All UI strings are externalized** (not hardcoded in components) - key-per-feature structure, e.g.:
  ```
  {
    "booking.step1.title": "Pilih Poli",
    "booking.step1.title_en": "Select Department"
  }
  ```
- Date, time, and number formatting **follows the active locale** (e.g. `dd/mm/yyyy` for ID; 24-hour format stays in both languages since it's more common in the Indonesian hospital context - avoid AM/PM which can confuse elderly users).
- Medical/administrative terms (department names, service types) have validated translations - not raw machine translation, since they directly affect patients' understanding of health services.
- Safety disclaimers (doctor chat, emergency directions) **must be available in both languages** with identical meaning, not just literal translation.

---

## 5. Accessibility - Elderly & Disabled Users

Target standard: **WCAG 2.1 level AA** minimum, with additional adjustments specific to the elderly population (the majority of healthcare facility users).

### 5.1 For Elderly Users
- **16px base font, with text size control** - A-/A+ buttons in the header to enlarge text without breaking the layout (not just relying on browser zoom).
- **Minimum 44×44px tap/click targets** for all interactive elements (buttons, links, checkboxes) - per WCAG and Apple/Google HIG recommendations, crucial for users with tremors/limited motor control.
- **Minimum color contrast 4.5:1** for normal text, 3:1 for large text/UI components - all token color combinations in §2.1 are validated against this ratio before use (teal `#0E7D80` on white needs re-checking for small text; if insufficient, use the darker `--primary-hover` for text).
- **Plain language** - avoid unexplained technical/medical terms, avoid unexplained abbreviations (e.g. spell out "IGD" once at the start: "IGD (Instalasi Gawat Darurat)").
- **Linear flow, one action per screen** - avoid pages with many simultaneous choices; multi-step processes (online registration) are split per step with a "Back" button always available.
- **Explicit confirmation before important actions** - confirmation dialog for cancelling a booking, not an immediate action without pause.

### 5.2 For Users with Disabilities
- **Full keyboard navigation** - all interactive elements reachable via Tab, logical focus order following the visual flow, **visible focus ring** (not `outline: none` without replacement).
- **Screen reader support** - semantic HTML required (`<button>` not `<div onClick>`, `<label>` connected to `<input>`, consistent heading hierarchy `h1`→`h2`→`h3`), `aria-label` for textless icons, `aria-live` for dynamic updates (booking status, OTP results).
- **Reduced motion** - respect `prefers-reduced-motion`; transitions optional/minimal, no auto-play carousel or animation that can't be turned off.
- **Descriptive alt text** for all informative images (doctor photos, service icons); decorative images get `alt=""` so they don't disturb screen readers.
- **Clear form errors** - error messages connected directly to the relevant field (`aria-describedby`), not just red border color (for color blindness) - include icon + text.
- **Don't rely on color alone** - booking status uses color + text label + icon (not just a color badge), important for color-blind users.

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
[ Stepper: ①Department - ②Doctor&Schedule - ③Personal Data - ④Confirmation ]

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
- [ ] Font size manually increased (browser zoom 200%) - layout must not break/overlap.
- [ ] `prefers-reduced-motion` tested, animations correctly disabled.
- [ ] Tap targets measured - no interactive element below 44px.

---

## 8. Implementation Notes (Verified from `web/`)

Source of truth for what is actually implemented in the Next.js 16 + Tailwind v4 codebase. Where the running code differs from the spec above, treat the code as current and migrate drift toward the spec (see §8.4).

### 8.1 Colors (as implemented in `web/app/globals.css`)

Tokens are defined in both `:root` (CSS vars) and `@theme` (Tailwind utilities) and consumed as `bg-background`, `text-foreground`, `border-border`, `bg-muted`, `text-muted-foreground`, `bg-primary`, `bg-primary-hover`, `text-accent`, `text-success`, `text-warning`, `text-destructive` — **always use these, never raw hex** in components.

| Token | Spec (§2.1) | Implemented | Note |
|---|---|---|---|
| `--background` | `#FFFFFF` | `#ffffff` | match |
| `--foreground` | `#1C2626` | `#1c2626` | match |
| `--muted` | `#F1F4F4` | `#f4f7f7` | slightly lighter than spec |
| `--muted-foreground` | `#5C6B6B` | `#5c6b6b` | match |
| `--border` | `#E2E8E8` | `#e0e7e7` | slightly darker than spec |
| `--primary` | `#0E7D80` | `#0e7d80` | match |
| `--primary-foreground` | `#FFFFFF` | `#ffffff` | match |
| `--primary-hover` | `#0A5F61` | `#0a5f61` | match |
| `--accent` | `#E63946` | `#e63946` | match |
| `--success` | `#16A34A` | `#16a34a` | match |
| `--warning` | `#D97706` | `#d97706` | match |
| `--destructive` | `#DC2626` | `#dc2626` | match |

### 8.2 Border radius (Tailwind v4 overridden tokens)

`--radius-sm/md/lg` are overridden in `@theme`, so `rounded-*` utilities below those names resolve to the custom values:

| Utility | Value | Used for |
|---|---|---|
| `rounded-sm` | 8px (`--radius-sm`) | Buttons, inputs, textarea, toasts, nav links |
| `rounded-md` | 12px (`--radius-md`) | Cards, dialogs/modals, form panels |
| `rounded-lg` | 16px (`--radius-lg`) | Larger surfaces (service cards, sidebar panels) |
| `rounded-full` | pill | Badges, status chips, avatars, carousel dots, search bar |
| `rounded-xs` | 2px (Tailwind default) | Tiny category chips only (home page) |

**Caution:** `rounded-xl` / `rounded-2xl` / `rounded-3xl` are **not** overridden — they keep Tailwind defaults (12/16/24px) and appear only in legacy and hero surfaces (§8.4). Default container/card radius must remain `rounded-md` (12px).

### 8.3 Shadow scale (as implemented)

| Utility | Usage |
|---|---|
| `shadow-2xs` | Smallest - resting state for articles, contact cards |
| `shadow-xs` | Default interactive controls (buttons, inputs) + Card default |
| `shadow-sm` | Card hover state, active stepper circle |
| `shadow-md` | Hero carousel, mobile menu panel |
| `shadow-lg` | Dialogs/modals, WhatsApp popup |
| `shadow-xl` | Mega dropdown panels, success confirmation modal |

Buttons, inputs, and Cards default to `shadow-xs`; hover states use `shadow-sm`. `shadow-2xl` appears in exactly one marketing banner (§8.4). No decorative floating shadows.

### 8.4 Deviations found in the codebase (migrate forward when touched)

- **`app/daftar-online/`** — legacy styling: hardcoded `slate-*`/`emerald-*` classes, `rounded-xl`/`rounded-2xl`, `shadow-md`+ instead of `border-border`, `bg-primary`, `rounded-md`. Uses Tailwind defaults, not the tokens above. Migrate to the token system on next touch.
- **`app/admin/*`** — uses a **slate + emerald** palette (`emerald-600` primary, `slate-200` borders, `dark:` variants in `stat-card.tsx`/`sidebar.tsx`), distinct from the patient-facing teal. Backoffice is out of scope (§1) — keep as-is.
- **`components/sections/health-access-section.tsx`** — `slate-900 → primary → slate-900` gradient banner, `rounded-3xl`, blurred decorative blobs, `shadow-2xl`. Contradicts §1/§2.3 ("no decorative gradients", no `rounded-3xl` on everything). Accept as a one-off hero moment or reduce to the standard card treatment.
- **`components/ui/whatsapp-float.tsx`** — uses WhatsApp's `emerald-*` brand colors. Intentional third-party brand exception; **do not** convert to teal.
- Interactive focus is `focus:border-primary focus:ring-1 focus:ring-primary` (inputs) / `focus-visible:outline-primary` (buttons, links), consistent with §5.2.

### 8.5 Typography, spacing & structure (implemented)

- Inter via `next/font/google`, weights 400/500/600 (`--font-sans`), applied on `body`; base 16px, `line-height: 1.5`. ✓ §2.2
- `html[data-font-size="lg"]` → 18px drives the header A+/A− control. ✓ §5.1
- Spacing on the Tailwind 4px scale (`p-4`, `px-5`, `gap-3`, …); free-form values limited to hero min-height. ✓ §2.3
- Page container: `max-width: var(--container-max)` (1200px) + `px-4 sm:px-6 lg:px-8`. ✓ §2.3
- Buttons: `h-11` (44px) for `sm`/`md`, `h-12` (48px) for `lg` — meets the 44px tap target. ✓ §5.1
- Header sticky/white/thin bottom border, i18n `ID/EN` toggle, `A−/A+` font control. ✓ §4, §5.1
- Focus ring, `prefers-reduced-motion`, semantic HTML (`label`→`input`, `aria-describedby`, `role="status"`). ✓ §5.2
