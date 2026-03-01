# Woof Product Roadmap

**Last Updated:** 2026-03-01
**Completed:** Phases 3, 4, 5A-5D, 6A-6C, 7A-7C, 8A, 9A, 10A-10E, 12A-12F (Tier 1), 13A (i18n), Bug Fixes, Territory Follows
**Current:** Tier 2 — Major Features (15A Sentry next)

---

## Completed Phases

### Phase 3: UX Foundation
Form styling, post timestamps, comments, mobile bottom nav, search/explore, profile posts grid, loading skeletons, image aspect ratios, Web Share API, HTTPS/custom domain, password requirements, XSS fixes.

### Phase 4: Core Features
Health records (vet visits, vaccinations, medications, weight tracking), post detail view (`/post/:id`), dog-to-dog DMs with conversation list and polling.

### Phase 5A: Cognito Auth + Design System
AWS Cognito (email verification, password reset, MFA-ready). Design system: 60+ `--woof-*` tokens, Woof Crimson (`#C9403F`), warm cream neutral palette.

### Phase 5B: Svelte 5 Migration + Architectural Refactor
Full migration from vanilla JS to Svelte 5 SPA (`src-refactored/`). N+1 query fixes, transaction patterns, Cache-Control + ETag headers, performance indexes.

### Phase 5C/5D: Post Options + Reporting + Bookmarks + Admin
Instagram-style bottom action sheet, reporting system, post bookmarks, admin panel with report queue.

### Phase 6A: Image CDN + Optimization
Lambda Sharp image processor (thumb 150px, medium 600px), CloudFront CDN at `cdn.woofapp.fi`.

### Phase 6B: Selective HTTP Caching
Cache-Control on stable endpoints, ETag on dog profiles. Version signals drive invalidation.

### Phase 6C: PWA Foundation
`vite-plugin-pwa`, service worker with CacheFirst CDN strategy, installable app, offline fallback.

### Phase 7A: Navigation + Notifications + Admin Enhancements
Persistent sidebar drawer (280px desktop), bell notifications with polling, comment options sheet, user banning.

### Phase 10A-10E: Breeds & Territories
246 bilingual breeds (EN + FI), breed pages with follow/feed, breed directory, anti-scraping protections, 635 Finnish territories (3-level hierarchy), territory pages with SEO-friendly URLs, service worker auto-reload.

### Territory Follows & Enhancements
Territory follow system mirroring breed follows: `territory_follows` table, follow/unfollow endpoints, followed territories in nav drawer, territory follower count + `isFollowing` flag on territory pages, guidance text for non-followers, popular breeds per territory section, breed filter chips on territory Dogs tab, territories searchable in Search panel. Navigation-only (does not affect Following feed).

---

## Positioning

Woof's differentiator: **Health records** — no competitor offers integrated vet/vaccination/weight tracking. Combined with an Instagram-quality feed: **"The social network that knows your dog."**

---

## Build vs Buy Decisions

| Feature | Decision | Tool | Cost (<10K users) | Why |
|---------|----------|------|-------------------|-----|
| Auth | **Buy** | AWS Cognito | $0 (50K MAU free) | Eliminates password storage, adds MFA, social login |
| Image moderation | **Buy** | AWS Rekognition | ~$1-5/mo | Single SDK call, same AWS ecosystem |
| Hate speech filter | **Buy** | Google Perspective API | $0 (free) | Supports Finnish, distinguishes hate speech from swearing |
| i18n | **Library** | `svelte-i18n` | $0 | Browser language detection, JSON translations |
| Email | **Buy** | AWS SES | $0-0.10/1K | Domain verified, Cognito emails via SES |
| Push notifications | **Library** | `web-push` (npm) | $0 | VAPID-based, add FCM for native later |
| Image optimization | **Build** | Sharp + S3 + CloudFront | $1-3/mo | 3 variants at upload time |
| Video processing | **Buy** | Lambda + ffmpeg / MediaConvert | $0-5/mo | Offload CPU-heavy work |
| Search | **Build** | PostgreSQL full-text search | $0 | `tsvector` + GIN indexes |
| Real-time | **Library** | Socket.io | $0 | Replaces polling, add Redis adapter if scaling |
| Error tracking | **Buy** | Sentry (free tier) | $0 (5K errors/mo) | Stack traces, error grouping |
| Analytics | **Build** | Custom events table | $0 | Add PostHog/Mixpanel for funnels later |

**Total monthly cost: ~$35-65/mo** (EB + RDS + S3 + CloudFront). Projected at full build: ~$40-100/mo.

---

## Future Roadmap — Tiered Priority

### Tier 1: Quality of Life & Polish (Ship First)

Small items, 1-3 days each, high impact on existing UX.

#### 12A: UX Fixes & Navigation Polish — DONE

Logo scroll-to-top, bell click back-navigation, home button scroll, double-tap to like with heart animation, pull-to-refresh, locale-aware timestamps, share button, content gate for unauthenticated users, invite cards in feed. Token expiry fix: 3-layer refresh (reactive 401 retry, proactive 50min interval, visibility change).

#### 12B: Edit Posts — DONE

`PUT /api/posts/:id` endpoint with ownership check. EditPostModal component, "Edit caption" button in PostOptionsSheet for own posts, "(edited)" indicator when `updatedAt > createdAt` by 60+ seconds. `updated_at` added to all feed and detail query responses.

#### 12C: New Design Colors — DONE

Coral Peach (`#FF8E7A`) and Fresh Mint (`#6ED3C3`) accent colors added to `tokens.css`, design docs, and `tokens.json`.

#### 12D: Followers/Following Lists — DONE

FollowListModal component shows followers/following with profile photos, breed, and follow/unfollow buttons. Clickable follower/following counts on ProfileView open the modal. Uses existing `getFollowers`/`getFollowing` API endpoints.

#### 12E: Bookmarks Feed — DONE

`GET /api/bookmarks` endpoint with cursor pagination (full feed-style response with territory, breed, like/comment data). BookmarksView at `/bookmarks` with infinite scroll. "Favourites" link in Navigation drawer (authenticated only).

#### 12F: Dog Date of Birth Migration — DONE

Migration 022: added `date_of_birth DATE` column, converted existing integer ages to approximate DOB, made `age` nullable. Backend computes age from DOB on create/update (keeps `age` column for backward compatibility). Frontend: date picker replaces number input in CreateDogModal + EditDogModal. ProfileView displays computed age from DOB (e.g., "2 years, 4 months" or "8 weeks").

---

### Tier 2: Major Features (High Priority)

Medium-large items that significantly boost engagement.

#### 13A: Internationalization (i18n) — DONE

Custom Svelte 5 `$state`-based i18n store (svelte-i18n incompatible with runes). ~220 UI strings in `locales/en.json` + `locales/fi.json`. Language detection: localStorage → `navigator.language` → fallback `en`. EN/FI toggle in Navigation drawer. `t(key, params?)` function with `{param}` interpolation, `localName(item)` helper for bilingual breed/territory names. Backend returns `breedNameFi` in all dog/post/feed endpoints. All hardcoded English strings replaced across ~25 frontend files.

#### Bug Fixes (post-13A) — DONE

- **Edit comments**: `PUT /api/comments/:id` endpoint with ownership check. EditCommentModal component, "Edit comment" button in CommentOptionsSheet, "(edited)" indicator on comments.
- **Share OG preview**: Backend `GET /share/post/:id` serves HTML with Open Graph meta tags for social media crawlers (og:title, og:image, og:description), with auto-redirect to SPA for human visitors. Outside `/api` routes (no rate limiting for crawlers).
- **Following feed fix**: Added `AND d.owner_id != $1` to exclude own posts from the Following tab.
- **Visit profile fix**: PostOptionsSheet falls back to `dogId` when `dogSlug` is empty, with early return guard.

#### 13B: Multi-Image Posts — Large

*Merges existing Phase 9B. Capped at 5 images (not 10).*

- `post_images` table (`post_id FK, image_url, position, created_at`)
- Keep `image_url` on posts as cover image for backward compatibility
- Carousel/swipe UI on PostCard (CSS scroll-snap), dot indicators
- Redesigned CreatePostModal: multi-image selection, thumbnails with reorder/delete
- Batch presigned URL upload, parallel S3 uploads
- Feed stays lightweight (cover image + count badge); full carousel on PostDetailView

#### 13C: Dark Mode — Large

- CSS custom property switching via `[data-theme="dark"]` on `<html>`
- System preference detection (`prefers-color-scheme`)
- User override in `localStorage` (`woof_theme`: light/dark/system)
- Theme toggle in Navigation drawer / Account Settings
- Design system page (`docs/design/index.html`) gets theme toggle for preview
- Full component audit for hardcoded colors
- Depends on: 12C (new colors need dark variants)

#### 13D: Dog Tagging — Medium

- `@nelly` autocomplete in caption textarea (CreatePostModal)
- `post_tags` table (`post_id FK, tagged_dog_id FK, tagged_by_dog_id FK`)
- `tag_privacy` setting on dogs table (`everyone`/`followers`/`nobody`, default `everyone`)
- Tagged dogs shown as clickable names on PostCard
- Self-removal: tagged dog owner can remove their tag from any post
- New `tag` notification type

#### 13E: Stories — Large

Design system documentation already complete (tokens, CSS, motion specs).

- `stories` table (`dog_id FK, image_url, created_at, expires_at`) + `story_views` table
- 24-hour expiration via `expires_at > NOW()` filter
- Stories row at top of feed: 56px squarish thumbnails, gradient ring for unseen, gray for seen
- Full-screen story viewer: progress bars, tap left/right to navigate, swipe down to dismiss
- Same S3 presigned URL upload flow as posts
- Scheduled cleanup of expired story images

#### AS-1: Account Settings — Medium

*Merges partial Phase 7E (account settings).*

- `/settings` route and SettingsView.svelte
- Sections: Theme (light/dark/system), Language (EN/FI), Privacy (public/private per dog), Notifications (email digest preferences), Account (change password via Cognito, delete account)

---

### Tier 3: Social Graph Deepening (Medium-High Priority)

Features that change the fundamental social model.

#### 14A: Public/Private Profiles & Friend Requests — Large

- `visibility` column on dogs: `public` (default) or `private`
- `follow_requests` table (`requester_dog_id FK, target_dog_id FK, status: pending/accepted/rejected`)
- Private dog: follows become requests, owner approves/rejects
- Limited profile view for non-followers (name, photo, breed, territory, follower count — no posts)
- Follow button states: "Follow" / "Requested" / "Following"
- New notification type: `follow_request`
- Feed queries filter out private dog posts unless viewer follows them
- All existing dogs stay public (no breaking change)

#### 14B: Multiple Owners Per Dog — Medium

- `dog_owners` junction table (`dog_id FK, user_id FK, role: owner/co-owner, invited_by FK, accepted_at`)
- Keep `owner_id` on dogs table as primary owner for backward compatibility
- Co-owners can: post as dog, edit profile, add health records
- Only primary owner can: delete dog, transfer ownership, remove co-owners
- Invitation flow: primary owner invites by email, invitee accepts/rejects
- CreatePostModal dog selector includes co-owned dogs

#### 14C: RIP Memorial Profiles — Medium

- `memorial_at` nullable timestamp on dogs table
- Memorial mode: read-only profile, no new posts or edits
- Visual treatment: memorial badge, muted overlay, "In loving memory" text
- Existing posts remain, followers remain, comments stay open (community memories)
- Posts stop appearing in "For You" feed but accessible via profile link and search
- Owner action: "Mark as memorial" in dog settings, reversible

---

### Tier 4: Infrastructure (Medium Priority, ship alongside Tier 2-3)

#### 15A: Error Tracking (Sentry) — Small

*Existing Phase 6E.* `@sentry/svelte` frontend, `@sentry/node` backend, sourcemaps.

#### 15B: WebSocket Messaging — Medium

*Existing Phase 8A.* Socket.io replaces 10s polling in MessagesView. Typing indicators, online status. Also replace 60s notification polling. No Redis needed at single instance.

#### 15C: Transactional Email (SES) — Medium

*Existing Phase 8B.* Welcome email, weekly notification digest, follow milestone emails. SES domain already verified. Unsubscribe preferences.

#### 15D: Content Moderation Enhancement — Medium

*Existing Phase 6D.* Google Perspective API for text moderation (comments, posts, messages). Supports Finnish. Check `IDENTITY_ATTACK` and `THREAT` only (swearing allowed, hate speech blocked).

#### 15E: Hashtags — Medium

*Existing Phase 7B.*

- Regex extraction of `#word` from captions on post create
- `hashtags` + `post_hashtags` tables, trending by recent count
- Autocomplete in CreatePostModal (shares pattern with `@` dog tagging)
- Hashtag page: `/tag/:name` with post feed
- Clickable hashtag links in captions

---

### Engagement Features (ship alongside Tier 2-3)

Build on 12F (date of birth) for delight and retention.

#### EF-1: Dog Birthday Celebrations — Small

- Auto-notify followers on dog's birthday (from `date_of_birth`)
- Birthday badge on profile for the day
- Optional birthday post prompt to owner
- **Depends on:** 12F (DOB migration)

#### EF-2: Puppy Milestones — Medium

- Auto-generated milestone cards at key ages: 8 weeks, 3 months, 6 months, 1 year, 2 years
- Photo comparison template ("then vs now")
- Push notification to owner: "Celebrate this milestone!"
- Viral sharing potential
- **Depends on:** 12F (DOB migration)

---

### Breed Health & Training Advice System (Research Item)

A curated knowledge base of breed-specific health and training tips, integrated throughout the app.

**Content delivery surfaces:**
- **Breed pages**: "Tips" / "Advice" tab on `/breed/:slug` with breed-specific articles
- **Periodic notifications**: Push relevant tips based on dog's breed
- **Age-based triggers**: Tips tied to dog age from `date_of_birth` (e.g., "Your puppy is 4 months — time for socialization training", "Senior care tips for dogs over 8")
- **Health record triggers**: When owner logs something in health tab (vaccination, weight change, vet visit), surface related advice

**Research questions:**
- Content sourcing: curate from veterinary sources? Partner with vets? AI-assisted with vet review?
- Content format: short tip cards vs long-form articles vs both?
- Notification frequency: daily digest? Weekly? Only on triggers?
- Monetization: premium breed guides? Sponsored by pet food/health brands?
- Could business pages (16D) contribute verified advice content?

**Depends on:** 12F (DOB for age-based triggers), health records system, breed pages (live)

---

### Tier 5: Expansion & Monetization (Lower Priority / Research)

#### 16A: "I Want a Dog" Mode — Medium

- `account_type` on users: `dog_owner` (default) or `aspiring_owner`
- Browse-only: can follow dogs/breeds, save bookmarks, receive notifications
- Cannot post, comment, or DM
- When aspiring owner creates a dog, they become `dog_owner`
- Different onboarding: "I have a dog" vs "I want a dog" choice at registration

#### 16B: Video Posts — Large

*Existing Phase 9A.*

- Accept video uploads (mp4, mov, max 30s, max 50MB)
- Lambda + ffmpeg: transcode to H.264, extract thumbnail
- HTML5 `<video>` in feed, muted autoplay on scroll, tap to unmute
- `media_type` column on posts ('image' | 'video')
- **Depends on:** 13B (multi-image establishes the multi-media pattern)

#### 16C: Dog-Friendly Places + Check-In — Large

*Existing Phase 10A + 10B.*

- Leaflet + OpenStreetMap. User-submitted places (parks, cafes, vets)
- Place reviews and ratings
- Check-in with "currently here" status, auto-expire stale check-ins
- Territory integration (places within territories)

#### 16D: Business Pages — Large

- `business_profiles` table (name, type: vet/shop/brand/service, verified, location, contact)
- Business accounts: `account_type = 'business'` on users
- Businesses can: create profile page, post content (promotions, advice), respond to reviews
- Dog owners can: follow businesses, leave reviews, check in
- Verification: manual admin process, verified badge
- Monetization: premium placement, sponsored posts, analytics dashboard

#### 16E: Advertisements — Research Only

- Ad types: sponsored posts in feed (marked "Sponsored"), business promotions, territory-targeted
- Context: dog-related only (pet food, vet services, dog training, accessories). Hard filter: no non-pet ads
- Implementation: initially admin-created. Later: self-serve ad manager for businesses
- Revenue: CPM or flat monthly placement
- Privacy: no individual tracking. Target by breed, territory, profile type only
- **Depends on:** 16D (business pages)

#### 16F: Native Apps (Capacitor) — Large

*Existing Phase 11A-C.*

- Capacitor wrapper for iOS/Android, App Store + Play Store
- Native push via FCM/APNs (replacing PWA push)
- Deep linking, native camera, haptics
- PostHog/Mixpanel analytics upgrade

---

### Additional Feature Ideas (for later consideration)

- **Lost dog alerts**: Territory-based urgent notifications, community search
- **Walk tracker**: GPS route recording, distance/duration stats, walk streak gamification
- **Adoption showcase**: Shelters post available dogs, connects with "I want a dog" mode
- **Playdate matching**: Breed compatibility + territory proximity suggestions

---

## Suggested Implementation Order

| # | Phase | Name | Size |
|---|-------|------|------|
| 1 | 12A | UX fixes & nav polish | Small |
| 2 | 12B | Edit posts | Small |
| 3 | 12C | New design colors | Small |
| 4 | 12D | Followers/following lists | Small |
| 5 | 12E | Bookmarks feed | Small |
| 6 | 12F | Dog date of birth migration | Small |
| 7 | 13A | i18n (EN + FI) | Large |
| 8 | 15A | Sentry error tracking | Small |
| 9 | 13B | Multi-image posts | Large |
| 10 | 13C | Dark mode | Large |
| 11 | AS-1 | Account settings | Medium |
| 12 | 13D | Dog tagging | Medium |
| 13 | EF-1 | Dog birthday celebrations | Small |
| 14 | EF-2 | Puppy milestones | Medium |
| 15 | 13E | Stories | Large |
| 16 | 14A | Public/private profiles | Large |
| 17 | 15B | WebSocket messaging | Medium |
| 18 | 14B | Multiple owners per dog | Medium |
| 19 | 14C | RIP memorial profiles | Medium |
| 20 | 15C | Transactional email | Medium |
| 21 | 15D | Content moderation | Medium |
| 22 | 15E | Hashtags | Medium |
| 23+ | 16A-F | Expansion features | Large |

---

## Key Dependencies

```
12C (new colors) ──────→ 13C (dark mode)
12D (follower lists) ──→ 14A (private profiles)
12F (DOB migration) ───→ EF-1 (birthdays) + EF-2 (milestones)
13B (multi-image) ─────→ 16B (video posts)
13D (dog tagging) ←───→ 14A (tag privacy synergy)
16D (business pages) ──→ 16E (advertisements)
```

---

## Technical Debt

| Item | Priority | Notes |
|------|----------|-------|
| Test coverage gaps | Medium | Frontend tests minimal, image upload not tested |
| No staging environment | Low (for now) | Production is test env while user base is friends-only. Revisit before public launch |

---

## Cost Summary by Phase

| Phase | Additional Monthly Cost | Notes |
|-------|------------------------|-------|
| Current | ~$35-65/mo | EB + RDS + S3 + CloudFront |
| Tier 1 (Polish) | +$0 | All frontend/backend changes |
| Tier 2 (Major features) | +$0 | PostgreSQL-based, client-side |
| Tier 3 (Social graph) | +$0 | PostgreSQL-based |
| Tier 4 (Infrastructure) | +$0-13/mo | Socket.io free, Redis only if multi-instance |
| Tier 5 (Expansion) | +$2-15/mo | Video storage, MediaConvert, push |
| **Total at full build** | **~$40-100/mo** | |
