# Foundations

## 1. Color System

### Brand Colors

| Token | Hex | Usage |
|---|---|---|
| `--woof-color-brand-primary` | `#EF4621` | Primary CTA buttons, active nav icons, highlights, brand logo |
| `--woof-color-brand-primary-light` | `#F5865A` | Hover states, light-mode tints |
| `--woof-color-brand-primary-dark` | `#CC3615` | Pressed states, active states |
| `--woof-color-brand-primary-subtle` | `#FEF0EC` | Background tints, badge backgrounds |
| `--woof-color-brand-gradient` | `linear-gradient(135deg, #EF4621, #F5A623)` | Story rings, center nav button, hero accents |

> **Woof Orange** (`#EF4621`) is a warm, vivid orange-red that communicates energy, warmth, and community spirit. The brand gradient sweeps from orange to golden amber and is used for story rings and the center navigation button.

---

### Neutral Palette

The neutrals are clean and minimal — predominantly white surfaces with subtle off-white tints, letting the orange accent stand out.

| Token | Hex | Usage |
|---|---|---|
| `--woof-color-neutral-0` | `#FFFFFF` | Card backgrounds, pure white surfaces |
| `--woof-color-neutral-50` | `#FAFAF8` | App background (near-white) |
| `--woof-color-neutral-100` | `#F5F5F3` | Section backgrounds, input backgrounds |
| `--woof-color-neutral-200` | `#EBEBEB` | Dividers, borders, separators |
| `--woof-color-neutral-300` | `#D1D1D1` | Inactive tab icons, placeholder text |
| `--woof-color-neutral-400` | `#A8A8A8` | Disabled states |
| `--woof-color-neutral-500` | `#737373` | Secondary text, captions, handles |
| `--woof-color-neutral-600` | `#5C5C5C` | Tertiary labels |
| `--woof-color-neutral-700` | `#3D3D3D` | Secondary labels |
| `--woof-color-neutral-800` | `#2E2E2E` | Secondary headings |
| `--woof-color-neutral-900` | `#1A1A1A` | Primary text, headings (warm near-black) |
| `--woof-color-neutral-950` | `#111111` | Near black |
| `--woof-color-neutral-1000` | `#000000` | Black |

---

### Semantic Colors

| Token | Hex | Usage |
|---|---|---|
| `--woof-color-like` | `#FF4757` | Heart/like icon (filled), like count |
| `--woof-color-like-bg` | `#FFF0EF` | Like bubble background |
| `--woof-color-success` | `#34C759` | Follow confirmed, success states |
| `--woof-color-warning` | `#FF9500` | Warning states |
| `--woof-color-error` | `#FF3B30` | Error states, destructive actions |
| `--woof-color-info` | `#007AFF` | Info states |

---

### Surface Colors

| Token | Value | Usage |
|---|---|---|
| `--woof-surface-primary` | `#FFFFFF` | Main card/screen surface |
| `--woof-surface-secondary` | `#F5F5F3` | Secondary surface (light cream) |
| `--woof-surface-overlay` | `rgba(0,0,0,0.4)` | Image overlays, modals |
| `--woof-surface-nav` | `#FFFFFF` | Bottom navigation bar (flat white, Collaction style) |
| `--woof-surface-nav-blur` | `rgba(255,255,255,0.95)` | Nav bar with blur |
| `--woof-surface-story-ring` | `linear-gradient(135deg, #EF4621, #F5A623)` | Unviewed story ring (gradient) |
| `--woof-surface-story-ring-seen` | `#D1D1D1` | Viewed story ring |

---

### Color Usage Rules

- **Never** use orange as a background for large areas — only for buttons, icons, and small accents
- The brand gradient (`#EF4621 → #F5A623`) is reserved for story rings and the center nav button
- Always ensure 4.5:1 contrast ratio for text on any surface
- White text on `--woof-color-brand-primary` passes AA contrast
- Use `--woof-color-like` exclusively for like/heart interactions
- The near-white app background (`#FAFAF8`) gives the screen a clean, minimal quality; cards use pure white `#FFFFFF` to stand out from the background

---

## 2. Typography

### Font Family

Woof uses the system font stack to feel native on iOS. For web/cross-platform, use **Inter** as the primary substitute.

```css
--woof-font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
  "SF Pro Text", "Inter", "Helvetica Neue", Arial, sans-serif;
--woof-font-family-mono: "SF Mono", "Fira Code", Menlo, monospace;
```

> The iOS system font (SF Pro) gives the app its clean, modern, and trustworthy feel. Inter is an excellent cross-platform substitute with very similar metrics.

---

### Type Scale

| Token | Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| `--woof-text-display` | 34px | 41px | 700 | Hero headlines ("Every dog has its day") |
| `--woof-text-title-1` | 28px | 34px | 700 | Screen titles (Profile name "Cheddar") |
| `--woof-text-title-2` | 22px | 28px | 700 | Section titles |
| `--woof-text-title-3` | 20px | 25px | 600 | Card titles |
| `--woof-text-headline` | 17px | 22px | 600 | Post usernames, nav labels |
| `--woof-text-body` | 16px | 22px | 400 | Body copy, bio text, post captions |
| `--woof-text-callout` | 15px | 20px | 400 | Secondary body text |
| `--woof-text-subheadline` | 15px | 20px | 400 | Comment text |
| `--woof-text-footnote` | 13px | 18px | 400 | Timestamps, handles (@super_flash) |
| `--woof-text-caption-1` | 12px | 16px | 400 | Story names, tag labels |
| `--woof-text-caption-2` | 11px | 13px | 400 | Very small labels |

---

### Font Weights

| Token | Value | Usage |
|---|---|---|
| `--woof-font-weight-regular` | 400 | Body, captions |
| `--woof-font-weight-medium` | 500 | Emphasis, tabs |
| `--woof-font-weight-semibold` | 600 | Subheadings, buttons |
| `--woof-font-weight-bold` | 700 | Headings, display, CTAs |
| `--woof-font-weight-heavy` | 800 | Brand name, stat numbers |

---

### Typography Rules

- **Brand name ("Woof")** uses `--woof-text-title-2` + `--woof-color-brand-primary` + `--woof-font-weight-bold`
- **Stat numbers** (454 Posts, 229 Followers) use `--woof-text-title-2` + `--woof-font-weight-heavy`
- **User handles** (e.g. @super_flash) always use `--woof-color-neutral-500` + `--woof-text-footnote`
- **Breed badge** ("goldensweet") uses `--woof-text-caption-1` + `--woof-color-brand-primary` + `--woof-font-weight-semibold`
- Avoid text smaller than 11px for accessibility

---

## 3. Spacing System

Woof uses an **8px base grid** with a 4px micro-grid for fine adjustments.

| Token | Value | Usage |
|---|---|---|
| `--woof-space-1` | `4px` | Micro: icon gap, tight padding |
| `--woof-space-2` | `8px` | Small: tag inner padding, icon-text gap |
| `--woof-space-3` | `12px` | Component inner padding |
| `--woof-space-4` | `16px` | Default content padding, card inner padding |
| `--woof-space-5` | `20px` | Section padding |
| `--woof-space-6` | `24px` | Large section spacing |
| `--woof-space-7` | `28px` | Card margins |
| `--woof-space-8` | `32px` | Screen-level section gaps |
| `--woof-space-10` | `40px` | Large vertical rhythm |
| `--woof-space-12` | `48px` | Hero sections |
| `--woof-space-16` | `64px` | Full-screen padding |

### Screen Margins

| Context | Value |
|---|---|
| Horizontal screen margin | `16px` |
| Card inner padding | `16px` |
| Story row padding | `12px` horizontal |
| Bottom safe area | `34px` (iPhone with home indicator) |
| Navigation bar height | `83px` (49px bar + 34px safe area) |

---

## 4. Border Radius

| Token | Value | Usage |
|---|---|---|
| `--woof-radius-xs` | `4px` | Small chips, micro elements |
| `--woof-radius-sm` | `8px` | Tags, hashtag pills |
| `--woof-radius-md` | `12px` | Cards, post cards |
| `--woof-radius-lg` | `16px` | Bottom sheets, large cards |
| `--woof-radius-xl` | `24px` | CTA buttons |
| `--woof-radius-2xl` | `32px` | Large modals |
| `--woof-radius-full` | `9999px` | Avatars, circular buttons, like bubbles |
| Story thumbnail | `18px` | Squarish rounded rectangle thumbnails (Dogger style) |

---

## 5. Elevation & Shadows

| Token | Value | Usage |
|---|---|---|
| `--woof-shadow-xs` | `0 1px 2px rgba(0,0,0,0.06)` | Subtle card lift |
| `--woof-shadow-sm` | `0 2px 8px rgba(0,0,0,0.08)` | Cards, post cards |
| `--woof-shadow-md` | `0 4px 16px rgba(0,0,0,0.10)` | Like bubbles, floating elements |
| `--woof-shadow-lg` | `0 8px 32px rgba(0,0,0,0.14)` | Bottom sheets, modals |
| `--woof-shadow-xl` | `0 16px 48px rgba(0,0,0,0.20)` | Full-screen overlays |
| `--woof-shadow-brand` | `0 4px 16px rgba(124,58,237,0.35)` | CTA buttons on press |
| `--woof-shadow-nav` | `0 -1px 0 rgba(0,0,0,0.06), 0 -4px 16px rgba(0,0,0,0.04)` | Flat white nav bar top separator |

---

## 6. Iconography

- **Style:** Clean, **thin-stroke SVG outline** icons (Collaction style). `stroke-width: 1.8`, `stroke-linecap: round`, `stroke-linejoin: round`. Active state may use a slightly bolder stroke or a filled variant; inactive state is always outline.
- **Size:** 24px standard (tap targets always minimum 44×44px)
- **Library:** SF Symbols (iOS) / Lucide React or Phosphor Icons (cross-platform) — both support thin-stroke outline variants
- **Active color:** `--woof-color-brand-primary` (`#EF4621`)
- **Inactive color:** `--woof-color-neutral-400`
- **Do not use** filled/solid icons as the default inactive state; reserve filled for active/selected feedback

### Key Icons Used

| Icon | Context |
|---|---|
| Home (thin outline) | Active nav tab |
| Search (thin outline) | Nav tab |
| Plus (squarish gradient button, 18px radius) | Create post, center nav action |
| Heart (thin outline / filled when liked) | Like / liked toggle |
| Paw print | Profile / active user nav tab |
| Three dots `···` | Post options menu |
| Arrow right (thin) | CTA button suffix |
| Chevron left (thin) | Back navigation |
| Bookmark (thin outline) | Save post |
| Speech bubble (thin outline) | Comments count |
| Repost arrows | Repost action |

---

## 7. Imagery Guidelines

- **Aspect ratios:** Square (1:1) for profile photos; **squarish rounded rectangle** for story thumbnails (border-radius 18px); 4:3 or 3:4 for feed posts; 16:9 for header/hero images
- **Corner radius:** Profile images use `--woof-radius-full`; feed post images use `--woof-radius-md` (12px); story thumbnails use 18px (`--woof-story-thumb-radius`)
- **Overlays:** Use `--woof-surface-overlay` for text-over-image (caption tags, gradient overlays)
- **Object fit:** `cover` — always fill the container, center crop
- **Story thumbnails:** 56px squarish rounded rectangles, wrapped in a 2px orange-amber gradient ring (`linear-gradient(135deg, #EF4621, #F5A623)`) with a 2px white gap. Seen stories use a `#D1D1D1` ring.
- **Profile hero:** Full-width hero photo; the avatar overlaps downward from the bottom edge of the hero image (Collaction style), centered, with the dog's name and breed displayed below as centered text with a thin divider
