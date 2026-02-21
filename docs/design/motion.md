# Motion & Animation

Dogger's motion design is **spring-based, snappy, and warm**. Animations feel physical and alive — like a dog bounding toward you. Nothing is slow or heavy.

---

## Principles

1. **Spring over ease** — Prefer spring physics over linear/bezier easing for UI elements
2. **Fast and snappy** — Most transitions complete in 200–350ms
3. **Purposeful** — Every animation communicates something (state change, hierarchy, feedback)
4. **Delight through surprise** — Like bubbles, bounce effects, and haptics add joy without blocking flow

---

## Duration Scale

| Token | Duration | Usage |
|---|---|---|
| `--duration-instant` | `100ms` | Tap highlights, button press |
| `--duration-fast` | `200ms` | State toggles (like/unlike), icon swap |
| `--duration-normal` | `300ms` | Modal appear, card expand |
| `--duration-slow` | `400ms` | Like heart animation, page transitions |
| `--duration-slower` | `600ms` | Onboarding sequences |

---

## Easing Curves

| Token | CSS Value | Usage |
|---|---|---|
| `--ease-default` | `cubic-bezier(0.25, 0.1, 0.25, 1)` | General UI |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving screen |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Elements entering screen |
| `--ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Spring/bounce, like heart |
| `--ease-spring` | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` | Button press, story pop |

---

## Component Animations

### Like / Heart Toggle

Sequence when tapping the heart:
1. Heart icon scales down: `scale(0.8)`, `100ms ease-in`
2. Heart fills red and scales up: `scale(1.3)`, `200ms ease-bounce`
3. Heart settles to normal: `scale(1.0)`, `150ms ease-out`
4. Like count increments with a slide-up number transition

**Double-tap like** (on image):
1. Large white/red heart appears at tap location
2. `scale(0.1) → scale(1.3) → scale(1.0)`, `400ms ease-bounce`
3. Heart fades out: `opacity 1 → 0`, starting at `600ms`, over `400ms`

---

### Like Bubble Notification

Floating "+1 like", "+2 likes" indicators:
1. Bubble appears from bottom: `translateY(20px) → translateY(0)`, `300ms ease-out`
2. Bubble floats up: `translateY(0) → translateY(-60px)`, over `2000ms linear`
3. Bubble fades out: `opacity 1 → 0`, `400ms ease-in`, starting at `1600ms`

Multiple bubbles: each staggered by `200ms`, positioned with slight random horizontal offset.

---

### Follow Button

Tapping "Follow":
1. Button background transitions: `#F26A2E → #34C759` (green flash), `200ms`
2. After `400ms`, transitions to followed state (gray outlined): `300ms ease`
3. Text changes: "Follow" → "Following" with a crossfade

---

### Navigation Bar

Icons on tap:
1. Scale down: `scale(0.85)`, `100ms ease-in`
2. Scale up with bounce: `scale(1.15) → scale(1.0)`, `250ms ease-bounce`
3. Color transitions to active: `200ms ease`

Center create button on tap:
- Spring scale: `scale(0.9) → scale(1.0)`, `200ms ease-bounce`
- Shadow pulses

---

### Story Ring

Tapping a story:
1. Avatar scales up: `scale(0.95) → scale(1.0)`, `150ms ease-out`
2. Full-screen story view expands from avatar position
3. Progress bars animate left-to-right during story display

---

### Page / Screen Transitions

| Transition | Direction | Duration | Easing |
|---|---|---|---|
| Navigate forward (push) | Slide from right | `350ms` | `ease-out` |
| Navigate back (pop) | Slide to right | `300ms` | `ease-in` |
| Modal present | Slide up from bottom | `400ms` | `ease-out` |
| Modal dismiss | Slide down | `300ms` | `ease-in` |
| Tab switch | Crossfade | `200ms` | `ease` |

---

### Skeleton Loading → Content

1. Skeleton: `--color-neutral-100` with shimmer gradient animation (`1.5s` loop)
2. On data load: skeleton fades out `200ms`, content fades in `300ms`
3. Stagger child elements by `50ms` each

---

## Haptics

Haptic feedback is integral to Dogger's feel (iOS Taptic Engine):

| Action | Haptic Type |
|---|---|
| Like a post | `impact.light` |
| Double-tap like | `impact.medium` |
| Follow a dog | `notification.success` |
| Story tap to advance | `selection` |
| Pull to refresh | `impact.light` on trigger |
| Long press post | `impact.medium` |

---

## Accessibility

- Respect `prefers-reduced-motion` — when enabled, replace motion with instant transitions or simple fades
- Never use animation as the sole means of communicating state change
- Keep animation durations under `500ms` to avoid vestibular discomfort

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```
