# Patterns & Screen Templates

## 1. Screen Architecture

All screens follow iOS safe area conventions:

```
┌─────────────────────────────────────┐
│         Status Bar (44px)           │  ← System, not styled
├─────────────────────────────────────┤
│         Navigation / Header         │  ← Optional, per screen
├─────────────────────────────────────┤
│                                     │
│           Content Area              │  ← Scrollable
│                                     │
│                                     │
├─────────────────────────────────────┤
│      Bottom Navigation (64px)       │  ← Fixed, floating
│      Safe Area Inset (~34px)        │  ← System
└─────────────────────────────────────┘
```

**Screen width:** 390px (iPhone 15 Pro reference)
**Content max-width:** 390px (full bleed mobile)
**Horizontal margins:** 16px default

---

## 2. Home / Feed Screen

The main social feed combining stories and post cards.

```
┌────────────────────────────────────────┐
│  Status Bar                            │
├────────────────────────────────────────┤
│  [Stories Row - horizontal scroll]     │
│  [+]  [🐕]  [🐕]  [🐕]  [🐕] →       │
│ My story  Uno  Adriana  ...            │
├────────────────────────────────────────┤
│  ┌──────────────────────────────────┐  │
│  │ [Avatar] Flash   @super_flash ···│  │
│  │ ┌────────────────────────────┐   │  │
│  │ │   [Full-width post image]  │   │  │
│  │ │                            │   │  │
│  │ │  Caption text              │   │  │
│  │ │  [tag] [tag] [tag]         │   │  │
│  │ └────────────────────────────┘   │  │
│  │ ❤️ 689   💬 23             🔖   │  │
│  └──────────────────────────────────┘  │
│                                        │
│  [Next post card...]                   │
├────────────────────────────────────────┤
│  [Bottom Navigation Bar]               │
└────────────────────────────────────────┘
```

**Layout rules:**
- Stories row: full-width, horizontal scroll, height ~100px
- Post cards: edge-to-edge width OR 16px side margin (either acceptable)
- Card separation: 8px gap between cards, or full-width hairline divider
- Feed is a vertical scroll list
- Pull-to-refresh supported
- Like animations float above feed on double-tap or heart-tap

---

## 3. Onboarding / Landing Screen

The splash/onboarding screen shown to new users.

```
┌──────────────────────────────────────┐
│                                      │
│    ┌────────────────────────────┐    │
│    │   [Stacked post card       │    │
│    │    previews with like      │    │
│    │    bubble animations]      │    │
│    └────────────────────────────┘    │
│                                      │
│  🐾 Dogger                          │
│                                      │
│  Every dog has its day              │
│                                      │
│  Join the community and share       │
│  moments with your four-legged      │
│  best friend                        │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  Become a member           → │   │
│  └──────────────────────────────┘   │
│                                      │
│              Safe Area               │
└──────────────────────────────────────┘
```

**Layout rules:**
- Background: `--color-neutral-0`
- Top 45%: floating/previewed post cards with like bubble animations
- Bottom 55%: brand content + CTA
- Brand section padding: `24px` left
- CTA button: full-width minus `32px` (16px each side)
- Bottom padding: `32px` + safe area

**Typography hierarchy:**
1. Paw icon + "Dogger" — brand mark, orange
2. "Every dog has its day" — `--text-display`, bold, near-black
3. Body copy — `--text-body`, `--color-neutral-500`
4. CTA button — `--text-headline`, white

---

## 4. Profile Screen

The individual dog's profile page.

```
┌──────────────────────────────────────┐
│  ← Back                              │  ← Floating back button
│                                      │
│  ┌────────────────────────────────┐  │
│  │        [Hero image - dog]      │  │  40% of screen height
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Cheddar          🐾 goldensweet│  │
│  │                                │  │
│  │  454   │  229    │   101       │  │
│  │ Posts  │Followers│ Following   │  │
│  │                                │  │
│  │ Sharing life through the eyes  │  │
│  │ of my Golden...                │  │
│  └────────────────────────────────┘  │
│  ┌──────┐  ┌──────┐                  │
│  │  🐕  │  │  🐕  │                  │
│  │      │  │      │                  │
│  └──────┘  └──────┘                  │
│  ┌──────┐  ┌──────┐                  │
│  │  🐕  │  │  🐕  │                  │
│  │      │  │ 3+   │                  │
│  └──────┘  └──────┘                  │
│                                      │
│  ┌──────────────────────────────┐    │
│  │         Follow               │    │
│  └──────────────────────────────┘    │
│                                      │
└──────────────────────────────────────┘
```

**Layout rules:**
- Hero image: full-width, height `~220px`, no border radius
- Profile card: overlaps bottom of hero image by ~20px, top radius `--radius-lg`
- Stats row: three equal columns, `1px` vertical divider between
- Photo grid: 2-column, `2px` gap, square cells
- Follow button: within card, below photos, full-width
- No bottom nav on profile (modal presentation) OR nav visible if tab

---

## 5. Post Detail / Full Image View

Tapping a post opens full-screen image with overlay content.

**Layout rules:**
- Full bleed image
- Caption overlay gradient at bottom
- Tags shown on image
- Engagement row below image (white background)
- Back button top-left, options top-right (both floating)

---

## 6. Navigation Patterns

### Tab Navigation (Bottom Nav)

5 tabs with center create action:

| Position | Icon | Label |
|---|---|---|
| 1 (left) | Home | Feed |
| 2 | Search/Grid | Explore |
| 3 (center) | + (orange circle) | Create |
| 4 | Heart | Activity |
| 5 (right) | Profile avatar | Profile |

**Active indicator:** Icon turns `--color-brand-primary` or white (no text label shown in active state, but icon state changes)

### Modal Navigation

Profiles, post details, and settings use modal/sheet presentation:
- Slide up from bottom (sheet style)
- Drag handle indicator at top: `40×4px` rounded pill, `--color-neutral-300`
- Dismissible by swipe-down

### Back Navigation

- Inline header with `←` icon button (left side)
- Swipe right to go back (iOS standard)

---

## 7. Empty States

When content is unavailable (no posts, no followers, etc.):

```
     🐾

  No posts yet

  Start sharing your dog's
  adventures with the world

  ┌──────────────────┐
  │  Share first post │
  └──────────────────┘
```

- Icon: Large paw emoji or illustration
- Heading: `--text-title-3` + `--font-weight-bold`
- Body: `--text-body` + `--color-neutral-500`
- CTA: `--color-brand-primary` text button or secondary outlined button

---

## 8. Loading States

### Skeleton Screens (preferred over spinners)

- Placeholder shapes in `--color-neutral-100`
- Animated shimmer: left-to-right gradient sweep, `1.5s` loop
- Match exact layout of loaded content

### Inline Spinner

- Used for actions (follow, like submit)
- Color: `--color-brand-primary`
- Size: 20px

---

## 9. Feed Interaction Patterns

### Double-Tap to Like

1. User double-taps image
2. Large heart icon animates from center (scale 0→1.3→1, 400ms spring)
3. Like bubble floats up from bottom-right of image
4. Heart in engagement row toggles to filled red

### Story Viewing

1. Tap story ring → full-screen story player
2. Progress bar at top (per-story segment)
3. Tap left/right to navigate
4. Swipe down to dismiss

### Pull to Refresh

- Standard iOS pull-to-refresh
- Spinner color: `--color-brand-primary`

---

## 10. Responsive Considerations

Dogger is **mobile-first** (iOS 390px reference). For tablet or web:

| Breakpoint | Layout change |
|---|---|
| `< 430px` | Single column, edge-to-edge cards |
| `430–768px` | Single column, 16px margins |
| `768–1024px` | Two-column feed, 24px margins |
| `> 1024px` | Three-column feed, sidebar navigation |
