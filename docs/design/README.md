# Woof Design System

**"Every dog has its day."**

A playful, community-first design system for the Woof app — a social platform for dogs and their humans.

---

## Overview

Woof's design language is **friendly, bold, and clean**. It draws from two visual references: the **Collaction app** (warm orange primary, clean thin-stroke SVG outline icons, flat white bottom nav, profile avatar overlapping hero) and **Dogger** (squarish story thumbnails with rounded corners). The system is mobile-first, content-forward, and built for community.

The primary brand color is **Woof Crimson** (`#C9403F`), paired with a near-white clean background (`#FAFAF8`) and a crimson-to-gold gradient (`linear-gradient(135deg, #C9403F, #C3A84E)`) for story rings and the center nav button. A complementary artisan palette — warm gold (`#C3A84E`), straw butter (`#F0CA78`), dark slate (`#4A5A6B`), dusty cerulean (`#799FAE`), and ice blue (`#C8DAE4`) — provides secondary accent and tint colors.

---

## Structure

| File | Contents |
|---|---|
| [`foundations.md`](./foundations.md) | Colors, typography, spacing, elevation, border radius, iconography |
| [`components.md`](./components.md) | All UI component specifications |
| [`patterns.md`](./patterns.md) | Screen patterns, layout templates, navigation |
| [`motion.md`](./motion.md) | Animation principles, durations, easing |
| [`tokens.css`](./tokens.css) | CSS custom properties with `--woof-` prefix (use in web/React Native Web) |
| [`tokens.json`](./tokens.json) | Design token JSON (use with Style Dictionary / Figma Tokens) |

---

## Core Principles

### 1. Artisan Warmth
Woof Crimson (`#C9403F`) anchors every primary action and active state. Pair with the brand gradient (crimson → khaki gold) for story rings and the center create button. Warm, crafted, alive — never corporate.

### 2. Content is King
Dogs are the stars. UI chrome steps back — minimal borders, clean whites and lavenders, and generous imagery space let photos breathe.

### 3. Community at Scale
The feed, stories, and profiles are designed for high-density content consumption. Hierarchy must be crystal clear.

### 4. Playful but Purposeful
Micro-interactions (like bubbles, haptics, spring animations) add delight without distracting from the core task.

### 5. iOS-Native Feel
The system closely follows Apple HIG conventions — safe areas, standard touch targets (44px min), SF-style typography scale, and system blur/vibrancy patterns.

---

## Brand Identity

| Element | Value |
|---|---|
| App name | Woof |
| Tagline | "Every dog has its day" |
| Mascot icon | 🐾 paw print |
| Tone | Playful, warm, community-driven |
| Primary color | Woof Crimson `#C9403F` |
| Background | Warm sandy cream `#FAFAF8` |
| Brand gradient | `linear-gradient(135deg, #C9403F, #C3A84E)` |
| Primary market | iOS mobile |
