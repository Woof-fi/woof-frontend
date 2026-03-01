# Components

All components follow a mobile-first, iOS-native design language. Minimum touch target is **44×44px**. Icons use **thin-stroke SVG outlines** (`stroke-width: 1.8`, `stroke-linecap: round`) throughout.

---

## 1. Buttons

### Primary CTA Button

The signature full-width call-to-action button. Used for the most important action on a screen.

```
┌─────────────────────────────────────────────────┐
│  Become a member                              →  │
└─────────────────────────────────────────────────┘
```

| Property | Value |
|---|---|
| Background | `--woof-color-brand-primary` (`#C9403F`) |
| Text color | `#FFFFFF` |
| Text style | `--woof-text-headline` + `--woof-font-weight-semibold` |
| Height | `52px` |
| Border radius | `--woof-radius-full` (`9999px`) |
| Padding | `0 20px` |
| Icon | Arrow right (thin outline), 20px, right-aligned in circle |
| Icon circle | `rgba(255,255,255,0.25)`, 32px diameter |
| Width | Full-width (subtract 32px for margins) |

**States:**
- Default: `#C9403F`
- Pressed: `#A83030` + `--woof-shadow-brand`
- Disabled: `--woof-color-neutral-300` bg, `--woof-color-neutral-500` text

---

### Follow Button (Profile)

Full-width crimson button on profile pages.

| Property | Value |
|---|---|
| Background | `--woof-color-brand-primary` |
| Text color | `#FFFFFF` |
| Text style | `--woof-text-headline` + `--woof-font-weight-semibold` |
| Height | `44px` |
| Border radius | `--woof-radius-full` |
| Width | Full card width (minus card padding) |

**Following state** (after tap):
- Background: `--woof-color-neutral-100`
- Text: `--woof-color-neutral-900`
- Border: `1px solid --woof-color-neutral-200`
- Text: "Following"

---

### Icon Button (Circular)

Used for back navigation and floating actions.

```
  ┌───┐
  │ ← │   Back button: 36px circle, --woof-color-neutral-100 bg
  └───┘
```

| Property | Value |
|---|---|
| Size | `36px` diameter |
| Background | `--woof-color-neutral-100` (light) or `rgba(255,255,255,0.85)` (over image) |
| Border radius | `--woof-radius-full` |
| Icon | Thin-stroke chevron, `16px` |
| Shadow | `--woof-shadow-sm` |

---

### Create / Add Button (Center Nav)

The squarish gradient button with a "+" icon — the center action in the navigation bar (Collaction + Dogger style).

| Property | Value |
|---|---|
| Size | `56×56px` |
| Background | `--woof-color-brand-gradient` (`linear-gradient(135deg, #C9403F, #C3A84E)`) |
| Border radius | `18px` (squarish, Dogger style) |
| Icon | Plus sign (thin outline), white, 24px |
| Shadow | `0 4px 12px rgba(201,64,63,0.45)` |

---

### Create / Add Button (Stories Row)

The crimson squarish button that starts "My story".

| Property | Value |
|---|---|
| Size | `56×56px` |
| Background | `--woof-color-brand-primary` |
| Border radius | `18px` |
| Icon | Plus sign, white, 24px |

---

## 2. Avatars & Story Rings

### Avatar Sizes

| Size | Diameter | Usage |
|---|---|---|
| XS | `28px` | Inline mentions |
| SM | `36px` | Comment author |
| MD | `44px` | Post card header, nav profile |
| LG | `56px` | Story thumbnail |
| XL | `80px` | Profile header |
| 2XL | `100px` | Full profile hero |

All profile avatars: `border-radius: --woof-radius-full`, `object-fit: cover`

---

### Story Ring

A gradient-bordered squarish rounded rectangle thumbnail indicating an unviewed story (Dogger squarish shape + Collaction gradient ring).

```
  ┌────────────────┐
  │   ┌──────┐     │    Story thumbnail: 56px squarish (18px radius)
  │   │  🐕  │     │    Unseen ring: orange-amber gradient, 2px, 2px gap
  │   └──────┘     │    Seen ring: --woof-color-neutral-300
  └────────────────┘
```

| Property | Value |
|---|---|
| Thumbnail shape | Squarish rounded rectangle, `border-radius: 18px` |
| Ring method | CSS `outline` or `border` wrapping a gradient pseudo-element |
| Ring width | `2px` |
| Gap (ring to image) | `2px` (white padding) |
| Unseen gradient | `linear-gradient(135deg, #C9403F, #C3A84E)` |
| Seen color | `--woof-color-neutral-300` (`#D1D1D1`) |

---

## 3. Post Card

The primary feed content unit.

```
┌──────────────────────────────────────┐
│  [Avatar] Flash         @super_flash  ···  │
│                                            │
│  ┌────────────────────────────────┐        │
│  │                                │        │
│  │         [Photo]                │        │
│  │                                │        │
│  │  Enjoying the sunset           │        │
│  │  [mountain trip] [sunset] ...  │        │
│  └────────────────────────────────┘        │
│                                            │
│  ❤ 689    💬 23    ↺ 5    🔖              │
└────────────────────────────────────────────┘
```

### Post Card Anatomy

| Element | Spec |
|---|---|
| Card background | `--woof-color-neutral-0` |
| Card padding | `--woof-space-4` (16px) |
| Card radius | `--woof-radius-md` (12px) — feed cards often go edge-to-edge |
| Card shadow | `--woof-shadow-sm` |
| Avatar size | `44px` |
| Username | `--woof-text-headline` + `--woof-font-weight-semibold` + `--woof-color-neutral-900` |
| Handle | `--woof-text-footnote` + `--woof-color-neutral-500` |
| Options button (···) | `--woof-color-neutral-400`, right-aligned |
| **Post image** | Full-width, `border-radius: --woof-radius-md`, `aspect-ratio: 4/3` |
| Caption overlay | Gradient from transparent → `rgba(0,0,0,0.5)`, bottom 40% of image |
| Caption text | `--woof-text-body` + `--woof-color-neutral-0` (white) |
| **Engagement row** | `margin-top: --woof-space-3`, horizontal flex (Collaction style: heart / comment / repost / bookmark with counts) |
| Like count | Heart icon (thin outline, `--woof-color-like` when active) + count, `--woof-text-callout` |
| Comment count | Speech bubble icon (thin outline) + count, `--woof-text-callout` + `--woof-color-neutral-500` |
| Repost count | Repost arrows icon (thin outline) + count, `--woof-text-callout` + `--woof-color-neutral-500` |
| Bookmark | Right-aligned, bookmark icon (thin outline), `--woof-color-neutral-400` |
| Separator | `1px` bottom border `--woof-color-neutral-200` |

---

### Hashtag / Tag Pills

Small rounded chips displayed on post images and below captions.

```
  ┌──────────────────┐
  │  mountain trip   │
  └──────────────────┘
```

| Property | Value |
|---|---|
| Background | `rgba(0,0,0,0.35)` (on image) / `--woof-color-neutral-100` (below) |
| Text color | `#FFFFFF` (on image) / `--woof-color-neutral-800` (below) |
| Text style | `--woof-text-caption-1` + `--woof-font-weight-medium` |
| Padding | `4px 10px` |
| Border radius | `--woof-radius-full` |
| Gap between tags | `--woof-space-2` (8px) |

---

## 4. Like Bubble (Floating Notification)

The floating "+1 like", "+2 likes" animations that appear over the feed.

```
  ┌──────────────┐
  │ ❤  +1 like  │
  └──────────────┘
```

| Property | Value |
|---|---|
| Background | `--woof-color-like-bg` (`#FFF0EF`) |
| Border | `1px solid rgba(255,71,87,0.15)` |
| Text color | `--woof-color-neutral-900` |
| Text style | `--woof-text-callout` + `--woof-font-weight-semibold` |
| Padding | `6px 12px` |
| Border radius | `--woof-radius-full` |
| Shadow | `--woof-shadow-md` |
| Heart icon | `--woof-color-like` (`#FF4757`), 14px |
| Animation | Slide up + fade in, 300ms ease-out; fade out after 2s |

---

## 5. Stories Row

The horizontally scrolling story list at the top of the feed. Story thumbnails are **squarish rounded rectangles** (18px radius, Dogger style) wrapped in the brand gradient ring (Collaction style).

```
┌──────────────────────────────────────────────────┐
│  [+]      [🐕]      [🐕]      [🐕]      [🐕]   │
│ My story   Uno    Adriana  Sebastian   Poppy      │
└──────────────────────────────────────────────────┘
```

| Property | Value |
|---|---|
| Container height | `~110px` |
| Padding | `12px horizontal` |
| Item width | `~70px` |
| Item gap | `--woof-space-4` (16px) |
| Thumbnail shape | Squarish rounded rectangle, `border-radius: 18px` |
| Unseen ring | `2px` gradient (`#C9403F → #C3A84E`), `2px` gap |
| Seen ring | `2px solid #D1D1D1` |
| Label style | `--woof-text-caption-1` + `--woof-color-neutral-900` |
| Label truncation | Truncate at ~8 chars with ellipsis |
| Scroll | Horizontal, no scrollbar visible |
| "My story" item | Crimson squarish gradient button + "My story" label |

---

## 6. Navigation Bar

The flat white bottom navigation bar (Collaction style). Full-width, not floating, with a subtle top border/shadow separator.

```
  ┌──────────────────────────────────────────────┐
  │  🏠      ···   [+grad]    🤍     🐾          │
  └──────────────────────────────────────────────┘
```

| Property | Value |
|---|---|
| Background | `--woof-surface-nav` (`#FFFFFF`) — flat white |
| Top border | `1px solid rgba(0,0,0,0.06)` + `--woof-shadow-nav` |
| Border radius | `0` — full-width flat bar (Collaction style) |
| Height | `64px` visible bar + safe area inset |
| Padding | `0 28px` |
| Position | Fixed bottom, spans full screen width |
| Icon style | **Thin-stroke SVG outlines** (`stroke-width: 1.8`, `stroke-linecap: round`) |
| Icon size | `24px` |
| Active icon color | `--woof-color-brand-primary` (`#C9403F`) |
| Inactive icon color | `--woof-color-neutral-400` |
| **Center action button** | `56px`, `border-radius: 18px` (squarish), brand gradient background, `+` icon white |
| Center button shadow | `0 4px 12px rgba(201,64,63,0.45)` |

### Nav Items (left → right)

1. Home — thin-outline house icon
2. Search/Explore — thin-outline search icon
3. **Create** — squarish (18px radius) gradient button (`#C9403F → #C3A84E`) with "+" (elevated, 56px)
4. Activity/Likes — thin-outline heart icon
5. Profile — circular avatar thumbnail

---

## 7. Profile Page

### Profile Header (Collaction Style)

Full-width hero photo covering the top ~40% of the screen. The **avatar overlaps the hero image from below** — the avatar circle is positioned centered, partially overlapping the bottom edge of the hero image, with the rest of the profile card sliding behind it. Name is centered below the avatar, with a thin divider and the breed badge inline.

```
┌──────────────────────────────────────────┐
│         [Hero photo / gradient]          │
│                   [←]                   │
│             [ Avatar 🐕 ]               │  ← avatar overlaps hero bottom edge
└──────────────────────────────────────────┘
              Cheddar
         🐾 goldensweet
    ─────────────────────────
    [Follow]  [Message]  [···]    ← circular action buttons
```

### Profile Card

| Element | Spec |
|---|---|
| Card background | `--woof-color-neutral-0` |
| Card border radius | `--woof-radius-lg` (16px) top corners |
| Card padding | `--woof-space-5` (20px) |
| **Avatar overlap** | Avatar (80–100px) centered, overlapping hero bottom edge by ~40px; `border: 3px solid #FFFFFF` ring |
| Name text | `--woof-text-title-1` + `--woof-font-weight-bold` + `--woof-color-neutral-900`, centered |
| **Breed badge** | Small 🐾 icon + breed name, centered below name, `--woof-text-caption-1`, `--woof-color-brand-primary` |
| **Divider** | `1px solid --woof-color-neutral-200`, full-width, below breed badge |
| **Action buttons row** | Centered row of circular buttons: Follow (filled orange), Message, More options; `40px` diameter each |
| **Stats row** | Three columns separated by `1px --woof-color-neutral-200` vertical dividers |
| Stat number | `--woof-text-title-2` + `--woof-font-weight-heavy` + `--woof-color-neutral-900` |
| Stat label | `--woof-text-caption-1` + `--woof-color-neutral-500` |
| Bio text | `--woof-text-body` + `--woof-color-neutral-700` |
| Bio margin | `--woof-space-3` top |

---

### Profile Photo Grid

A 2-column grid of square photos below the profile card.

| Property | Value |
|---|---|
| Columns | 2 |
| Gap | `2px` |
| Cell aspect ratio | `1:1` |
| Cell border radius | `0` (edge-to-edge in grid) |
| Third cell (partial) | Half-visible, indicates more content |

---

## 8. Breed Badge

A small inline chip indicating the dog's breed, shown below the dog's name on profiles (centered layout, Collaction style).

```
  🐾 goldensweet
```

| Property | Value |
|---|---|
| Icon | 🐾 paw or custom SVG, `--woof-color-brand-primary` |
| Text | Breed name, `--woof-text-caption-1`, `--woof-color-brand-primary` |
| Font weight | `--woof-font-weight-semibold` |
| Gap | `4px` between icon and text |
| Alignment | Centered below the dog's name |
| Background | None (inline text treatment) |

---

## 9. Back Button

Circular ghost button used for navigation.

| Property | Value |
|---|---|
| Size | `36px` |
| Background | `rgba(255,255,255,0.85)` with blur |
| Icon | Chevron left (thin-stroke outline), `--woof-color-neutral-900`, 16px |
| Border radius | `--woof-radius-full` |
| Position | Top-left, within safe area |

---

## 10. Input Fields

Standard text inputs for search, captions, comments.

| Property | Value |
|---|---|
| Height | `44px` |
| Background | `--woof-color-neutral-100` |
| Border | None (default) / `1px solid --woof-color-brand-primary` (focused) |
| Border radius | `--woof-radius-full` (search) / `--woof-radius-md` (multiline) |
| Text | `--woof-text-body` + `--woof-color-neutral-900` |
| Placeholder | `--woof-text-body` + `--woof-color-neutral-400` |
| Padding | `0 16px` |
| Focus ring color | `--woof-color-brand-primary` (`#C9403F`) |

---

## 11. Three-Dot Menu (Post Options)

Ellipsis icon button opening a context menu.

| Property | Value |
|---|---|
| Icon | Three horizontal dots `···` (thin-stroke) |
| Size | `24px` touch area minimum `44px` |
| Color | `--woof-color-neutral-400` |
| Position | Top-right of post card header |
