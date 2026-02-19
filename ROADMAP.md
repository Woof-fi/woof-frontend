# Woof Product Roadmap

**Last Updated:** 2026-02-19
**Current Phase:** Phase 4 Complete
**Next Phase:** Phase 5 (Community & Discovery)

---

## Table of Contents

1. [Current State Assessment](#current-state-assessment)
2. [Visual Audit Findings](#visual-audit-findings)
3. [Competitor Analysis](#competitor-analysis)
4. [Feature Gap Analysis](#feature-gap-analysis)
5. [Phase 3 Roadmap](#phase-3-roadmap)
6. [Phase 4+ Backlog](#phase-4-backlog)

---

## Current State Assessment

### What Works

| Feature | Status | Notes |
|---------|--------|-------|
| Feed (For You) | Working | Cursor-based pagination, infinite scroll |
| Feed (Following) | Working | Tab switching, empty state messaging |
| Like/Unlike | Working | Optimistic UI, server-synced counts |
| Follow/Unfollow | Working | Profile page button, follower counts |
| Post creation | Working | Image upload to S3, caption support |
| Dog profile pages | Working | Avatar, bio, breed/age/location, tabs |
| Profile editing | Working | Edit modal for own dogs |
| Auth (register/login) | Working | JWT-based, logout |
| SPA routing | Working | `/dog/:slug`, deep linking |
| Clickable post avatars | Working | Links to dog profile |

### What's Placeholder / Non-Functional

| Feature | Current State | Priority |
|---------|--------------|----------|
| Share | Button exists, no functionality | Medium |
| Messages/DMs | Icon in header, no functionality | Low |
| Notifications | Bell icon in header, no functionality | Medium |
| Gallery tab | "No photos yet" placeholder | Medium |
| Friends tab | "No friends yet" placeholder | Medium |
| Health tab | "Private to owner" placeholder | Low |
| Like counts | Not visible when count is 0 | Low |

### Recently Completed (formerly placeholder)

| Feature | Completed | Notes |
|---------|-----------|-------|
| Search | Phase 3.5 | Search panel on desktop + mobile, searches dogs by name/breed |
| Comments | Phase 3.3 | Full comment system with backend API, hidden for non-auth users |
| Post timestamps | Phase 3.2 | Relative time with click-to-toggle full date |
| Mobile navigation | Phase 3.4 | Instagram-style bottom nav bar |
| Form styling | Phase 3.1 | All modals styled with focus states, backdrop blur |
| Profile Posts tab | Phase 3.6 | 3-column grid with hover overlay |
| HTTPS/SSL | Done | Cloudflare free tier + custom domain woofapp.fi |
| Password requirements | Done | Backend validation + frontend real-time checklist |

### Console Errors

- `404` on `/assets/images/dog_profile_pic.jpg` — default avatar fallback image missing from S3
- S3 returns HTML 404 on direct URL navigation (SPA fallback issue) — works because JS takes over, but not ideal

---

## Visual Audit Findings

Conducted 2026-02-17 with Playwright on production (desktop 1280x800 and mobile 375x812).

### Home Feed (Desktop)

**Good:**
- Clean card layout, recognizable Instagram-like structure
- Feed tabs (For You / Following) well positioned
- Post images display full width
- Clickable avatars + names are intuitive
- Like/Comment/Share action bar spacing is solid

**Issues:**
- **No timestamps** — can't tell when posts were made (every social network shows these)
- **No like counts visible** when count is 0 — should show "0 likes" or hide the count element entirely, currently just empty space
- **Post images have inconsistent aspect ratios** — portrait photos get black bars on sides, landscape photos are fine. Instagram crops to 4:5 max; Woof should constrain aspect ratio
- **No loading skeleton** — shows "Loading..." plain text, should use shimmer/skeleton cards
- **"Invite a Doggy Friend" button** in sidebar is overly prominent (purple gradient) and unclear what it does

### Login / Register Modals

**Issues:**
- **Completely unstyled form inputs** — native HTML inputs with no CSS. This is the most jarring UX gap in the entire app. Every other element has some styling, but the auth modal looks like raw HTML.
- **No password visibility toggle**
- **No "Forgot password?" link** (even if not implemented, users expect to see it)
- **No password strength indicator** on registration
- **Close button is a plain "x" character** — should be a styled icon
- **Login/Register tab buttons are unstyled** — no active state indicator, no visual distinction
- **No social login options** (Google, Apple — future consideration)
- **No form validation feedback** — invalid email doesn't show inline error until submit

### Add a Pet / Edit Pet Modals

**Issues:**
- **Unstyled form inputs** — same raw HTML appearance as auth modal
- **Native file picker** ("Choose File" / "No file chosen") — should be a styled upload area with drag-and-drop or at minimum a custom button with image preview
- **No image preview** after selecting a file
- **No character counter** on bio textarea
- **Age field is a raw spinbutton** — could be a dropdown or a nicer number input

### Dog Profile Page

**Good:**
- Clean layout with profile photo, name, follow button
- Follower/following counts display well
- Breed/Age/Location info is clear
- Tab navigation (Posts, Gallery, Friends, Health) is intuitive

**Issues:**
- **Posts tab is empty** even when the dog has posts — the tab content area shows nothing below it (posts exist in feed but don't appear on profile's Posts tab)
- **Gallery/Friends/Health tabs** are placeholders with no real content
- **No post count** shown in profile header (Instagram shows posts/followers/following)
- **No cover photo / banner** — profile looks sparse without one
- **Profile photo is small** on desktop (could be larger)
- **"About" section** heading is redundant when bio is short (one line)

### Mobile (375px)

**Issues:**
- **Header nav wraps to 2 lines** — Search, Messages, Notifications, Logout icons + text overflow and stack. Needs a hamburger menu or bottom navigation bar.
- **No bottom navigation bar** — every mobile social app has bottom nav (Home, Search, Create, Activity, Profile). The sidebar is hidden on mobile but there's no replacement.
- **Profile tabs wrap to 2x2 grid** — acceptable but could be scrollable horizontal tabs
- **No mobile-optimized touch targets** — buttons are desktop-sized
- **Feed looks good** — cards fill width properly, images scale well

### General UX Patterns Missing

1. **Pull to refresh** — standard mobile pattern, not implemented
2. **Double-tap to like** — Instagram's signature interaction
3. **Post detail view** — no way to view a single post with its comments
4. **User profile page** — no way to see the human owner's profile, only dog profiles
5. **Toast notifications** are functional but styling could be more polished
6. **Empty states** — Following tab has good copy, but other empty states are generic

---

## Competitor Analysis

### Key Competitors Reviewed

| App | Focus | Key Differentiator | Active? |
|-----|-------|-------------------|---------|
| **Instagram** | General (huge pet community) | Reels, Stories, Explore, DMs | Yes |
| **Petzbe** | Pet-only social network | "No Humans Allowed", pet perspective, stickers | Yes |
| **DogCha!** | Dog owners + local services | Location-based, place ratings, dog-friendly maps | Yes |
| **Yummypets** | Pet Instagram clone | Photo contests, vet partnerships, multi-species | Yes |
| **Swoofi** | Pet social + rewards | Real rewards for posting pet content | Yes |
| **BarkHappy** | Dog owner meetups | Location-based playdates, events, community | Yes |
| **Pawscout** | Lost pet tracking + social | Bluetooth tag, community alerts | Yes |
| **DogHood** | Breed-based community | "Packs" of similar breeds, playdates | Yes |

### Feature Comparison: Woof vs. Competitors

| Feature | Woof | Instagram | Petzbe | DogCha! | Yummypets |
|---------|------|-----------|--------|---------|-----------|
| Photo posts | Yes | Yes | Yes | Yes | Yes |
| Video posts | No | Yes | Yes | No | Yes |
| Stories | No | Yes | No | No | No |
| Reels/Short video | No | Yes | No | No | No |
| Follow/Following | Yes | Yes | Yes (Sniffing) | Yes | Yes |
| Likes | Yes | Yes | Yes | Yes | Yes |
| Comments | Yes | Yes | Yes | Yes | Yes |
| DMs/Messaging | **Yes** | Yes | No | Yes | No |
| Search/Explore | Yes | Yes | No | Yes | No |
| Location features | No | No | No | Yes | No |
| Dog-friendly places | No | No | No | Yes | No |
| Stickers/Filters | No | No | Yes | No | No |
| Photo contests | No | No | No | No | Yes |
| Vet info/chat | No | No | Yes (Vetzbe) | No | Yes |
| Health records | **Yes** | No | No | No | No |
| Multi-pet profiles | No | N/A | Yes | No | Yes |
| Breed communities | No | No | No | No | No |
| Charity/Donations | No | No | Yes (#LendAPaw) | No | No |
| Rewards | No | No | No | No | No |
| Lost pet alerts | No | No | No | No | No |
| Playdate matching | No | No | No | Yes | No |
| Chronological feed | Yes | No (algorithmic) | Yes | N/A | N/A |

### What Woof Should Learn From Competitors

1. **From Instagram:** ~~Post timestamps~~, ~~comment system~~, explore/search page, stories, ~~post detail view~~, double-tap to like, ~~mobile bottom nav~~
2. **From Petzbe:** Fun pet-first branding ("sniffing" instead of "following"), stickers, weekly challenges, chronological feed (Woof already has this)
3. **From DogCha!:** Location-based features — dog parks, vet clinics, dog-friendly restaurants on a map
4. **From Yummypets:** Photo contests, vet health content partnerships, multi-species support
5. **From Swoofi:** Gamification — rewards for posting, streaks, badges

### Woof's Unique Positioning

Woof's differentiator should be the **Health tab** — no competitor offers integrated health records (vet visits, vaccinations, weight tracking). Combined with a beautiful, Instagram-quality feed experience, this is Woof's niche: **"The social network that knows your dog."**

---

## Feature Gap Analysis

### Critical Gaps (Must-Have for MVP) — ALL RESOLVED ✅

1. ~~**Comments**~~ — ✅ Done (Phase 3.3)
2. ~~**Post timestamps**~~ — ✅ Done (Phase 3.2)
3. ~~**Search/Explore**~~ — ✅ Done (Phase 3.5)
4. ~~**Styled form inputs**~~ — ✅ Done (Phase 3.1)
5. ~~**Mobile bottom navigation**~~ — ✅ Done (Phase 3.4)
6. ~~**Profile Posts tab**~~ — ✅ Done (Phase 3.6)

### Important Gaps (Should-Have)

These are features that make the experience feel complete:

7. ~~**Post detail view**~~ — ✅ Done (Phase 4)
8. ~~**Loading skeletons**~~ — ✅ Done (Phase 3.7)
9. ~~**Image aspect ratio standardization**~~ — ✅ Done (Phase 3.8)
10. **Notification system** — "X liked your post", "Y started following you"
11. **Video support** — short video posts (even 15-30 seconds)
12. **User/Owner profile** — see all dogs owned by a person

### Nice-to-Have Gaps (Phase 4+)

13. **Stories** — ephemeral 24h content
14. ~~**DMs/Messaging**~~ — ✅ Done (Phase 4)
15. **Location features** — tag location on posts, dog-friendly place directory
16. **Photo contests / challenges** — weekly themed contests
17. **Stickers / photo filters** — fun overlays for pet photos
18. ~~**Health records**~~ — ✅ Done (Phase 4)
19. **Multi-pet profiles** — users with multiple dogs
20. **Breed communities** — group discussions by breed
21. **Gamification** — badges, streaks, achievements

---

## Phase 3 Roadmap

**Goal:** Close the critical UX gaps so the app feels like a real product, not a prototype.

### 3.1 — Form Styling Overhaul ✅ DONE

Universal `.modal` form styles in `styles.css`: focus states, border styling, rounded corners, backdrop blur, styled auth tabs, file inputs, iOS zoom prevention.

### 3.2 — Post Timestamps ✅ DONE

`timeAgo()` utility with click-to-toggle between relative time and full date. `<time>` semantic element with `datetime` attribute.

### 3.3 — Comments System ✅ DONE

Backend: `comments` table, `commentController.ts`, `routes/comments.ts`, `commentCount` in feed response. Frontend: inline comment section under posts, "View all X comments" link, comment input. Comments hidden from non-authenticated users (clicking comment button opens login modal).

### 3.4 — Mobile Bottom Navigation ✅ DONE

Instagram-style fixed bottom nav (Home, Search, Create, Activity, Profile). Dynamic profile tab based on auth state. Active state tracks current route.

### 3.5 — Search / Explore ✅ DONE

Backend: `GET /api/dogs/search?q=query` searches by name and breed. Frontend: search panel on desktop + mobile bottom nav, results link to dog profiles.

### 3.6 — Profile Posts Tab ✅ DONE

Backend: `GET /api/posts/dog/:dogId` with cursor-based pagination. Frontend: 3-column grid with hover overlay showing like count.

### 3.7 — Loading Skeletons ✅ DONE

CSS shimmer animation, `showFeedSkeleton()` / `showProfileSkeleton()` in `ui.js`, skeleton HTML in `index.html` for initial load.

### 3.8 — Image Aspect Ratio Standardization ✅ DONE

Portrait images capped at 4:5 via `max-height: calc(100cqi * 1.25)` with container queries. `object-fit: cover` on all post images.

### 3.9 — Misc UX Fixes ✅ DONE

Share button uses Web Share API with clipboard fallback. Like counts hidden when 0 (empty string display).

---

## Phase 3 Status

| Task | Status |
|------|--------|
| 3.1 Form Styling | ✅ Done |
| 3.2 Post Timestamps | ✅ Done |
| 3.3 Comments System | ✅ Done |
| 3.4 Mobile Bottom Nav | ✅ Done |
| 3.5 Search / Explore | ✅ Done |
| 3.6 Profile Posts Tab | ✅ Done |
| 3.7 Loading Skeletons | ✅ Done |
| 3.8 Image Aspect Ratio | ✅ Done |
| 3.9 Misc UX Fixes | ✅ Done |

### Additional Improvements Completed (not in original roadmap)

| Item | Notes |
|------|-------|
| HTTPS / Custom Domain | `woofapp.fi` via Cloudflare free tier (SSL, DNS) |
| Password Requirements | Backend validation (8+ chars, uppercase, lowercase, number) + frontend real-time checklist |
| XSS Fix | `escapeHTML()` applied to dog names/photos in navigation.js innerHTML |
| Comments Auth Gate | Comments hidden from non-authenticated users, comment button opens login modal |
| CORS Update | Backend allows `https://woofapp.fi` origin |

---

## Phase 4: Core Features — COMPLETE ✅

| Feature | Status |
|---------|--------|
| Health Records | ✅ Done — vet visits, vaccinations, medications, weight tracking, timeline UI |
| Post Detail View | ✅ Done — `/post/:id` with full comment thread |
| DMs / Messaging | ✅ Done — dog-to-dog conversations, polling-based |

---

## Phase 5+ Backlog

Features for future phases:

### Phase 5: Community & Discovery
- Breed communities / groups
- Dog-friendly places map (Leaflet + OpenStreetMap)
- Dog park check-in
- CDN for images (CloudFront at `cdn.woofapp.fi`)

### Phase 6: Engagement
- Notification system (likes, comments, follows)
- Explore page with popular content
- Double-tap to like
- Video post support (15-30s clips)

### Phase 7: Growth & Polish
- User/Owner profile page
- Multi-pet support (multiple dogs per account)
- Push notifications (PWA or native wrapper)
- Stories (24h ephemeral content)
- Photo contests / weekly challenges
- Stickers / photo filters
- Gamification (badges, streaks)
- Email digest / weekly recap
- Content moderation tools
- Social login (Google, Apple)
- i18n / localization (framework exists, needs content)

---

## Technical Debt to Address

| Item | Priority | Notes |
|------|----------|-------|
| ~~HTTPS~~ | ~~High~~ | ✅ Done — Cloudflare free tier, `woofapp.fi` |
| ~~Default avatar 404~~ | ~~Low~~ | ✅ Done — image exists at `/assets/images/dog_profile_pic.jpg` |
| S3 SPA routing | Medium | Direct URL navigation returns S3 404 HTML before JS takes over. Need CloudFront with error page redirect to index.html |
| Token expiration handling | Medium | Frontend should detect 401 responses and prompt re-login |
| Test coverage gaps | Medium | Frontend tests minimal, image upload not tested |

---

## Architecture Decisions for Phase 3

- **Comments:** Separate `comments` table, not embedded in posts. Paginated retrieval (cursor-based like feed).
- **Search:** Full-text search via PostgreSQL `tsvector` / `ILIKE` — no external search service needed at this scale.
- **Bottom nav:** CSS-only, no framework. Fixed position, z-index above content, `@media` query for mobile breakpoint.
- **Skeletons:** CSS `@keyframes` shimmer animation, no JavaScript library.
- **Image aspect ratio:** CSS `aspect-ratio` property with `object-fit: cover`.
