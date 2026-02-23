# Woof Product Roadmap

**Last Updated:** 2026-02-24
**Current Phase:** Phase 6 In Progress (6A/6B/6C complete — 6D/6E pending)
**Next Phase:** Phase 6D (Content Moderation) or Phase 7 (Engagement & Discovery)

---

## Completed Phases

### Phase 3: UX Foundation (Complete)

Form styling, post timestamps, comments system, mobile bottom nav, search/explore, profile posts grid, loading skeletons, image aspect ratio standardization, Web Share API, HTTPS/custom domain, password requirements, XSS fixes.

### Phase 4: Core Features (Complete)

Health records (vet visits, vaccinations, medications, weight tracking), post detail view (`/post/:id`), dog-to-dog DMs with conversation list and polling.

### Positioning

Woof's differentiator: **Health records** — no competitor offers integrated vet/vaccination/weight tracking. Combined with an Instagram-quality feed, this is Woof's niche: **"The social network that knows your dog."**

---

## Build vs Buy Decisions

Every feature evaluated: build custom, use a managed service, or use an open-source library.

| Feature | Decision | Tool | Cost (<10K users) | Why |
|---------|----------|------|-------------------|-----|
| Auth | **Buy** | AWS Cognito | $0 (50K MAU free) | Eliminates password storage, adds email verification, password reset, MFA, social login. Already on AWS. |
| Image moderation | **Buy** | AWS Rekognition | ~$1-5/mo | Single SDK call, high accuracy, same AWS ecosystem. Open-source models require hosting ML infra. |
| Hate speech filter | **Buy** | Google Perspective API | $0 (free) | Detects racism/hate speech while allowing normal swearing. Supports Finnish. AWS Comprehend lacks Finnish support. |
| i18n | **Library** | `i18next` | $0 | Industry standard, browser language detection, simple JSON translation files. Finnish + English. |
| Email | **Buy** | AWS SES | $0 (3K free/mo first year, then ~$0.10/1K) | Configured in eu-north-1. Cognito sends verification/reset emails via SES from `noreply@woofapp.fi`. |
| Push notifications | **Library** | `web-push` (npm) | $0 | VAPID-based Web Push, no third-party dependency. Add FCM later for native mobile apps. |
| Image optimization | **Build** | Sharp + S3 + CloudFront | $1-3/mo | Resize at upload time to 3 variants. You already have S3/CloudFront. Cloudinary adds a second image host. |
| Video processing | **Buy** | Lambda + ffmpeg / MediaConvert | $0-5/mo | Offload CPU-heavy work from web server. Lambda free tier covers thumbnail generation. |
| Search | **Build** | PostgreSQL full-text search | $0 | Already have RDS. `tsvector` + GIN indexes handle dogs/posts/hashtags well at this scale. |
| Real-time | **Library** | Socket.io | $0 | Replaces polling for messages. Single EB instance = no Redis needed. Add Redis adapter if scaling to multiple instances. |
| Error tracking | **Buy** | Sentry (free tier) | $0 (5K errors/mo) | Stack traces, error grouping, release tracking. CloudWatch is for infra, not app errors. |
| Analytics | **Build** | Custom events table | $0 | Simple PostgreSQL events table. Add PostHog or Mixpanel when you need funnels/retention analysis. |
| CDN | **Configure** | CloudFront | $1-3/mo | Already have CloudFront for HTTPS. Add a distribution for S3 images at `cdn.woofapp.fi`. |

**Total additional monthly cost: ~$2-15/mo** on top of existing infrastructure (~$35-65/mo).

---

## Phase 5: Trust & Safety

**Why first:** You cannot responsibly grow without moderation and proper auth. One inappropriate post on a dog app is devastating. Users who forget their password are lost forever.

### 5A. Migrate Auth to AWS Cognito + Data Reset + Design System (COMPLETE)

**Decision: Buy (AWS Cognito)**

Replace custom bcrypt/JWT auth with Cognito. This deletes code rather than adding it.

**Data Reset (decided):**
- Wipe all existing data (users, dogs, posts, comments, messages, etc.)
- Start clean with Cognito-native registration — no migration Lambda needed
- Drop and re-run all migrations from scratch with `role` and `moderation_status` baked into initial table definitions
- Clean out test photos from S3 bucket

**Staging environment:** Postponed. Production is the test environment for now (small group of friends testing). Revisit when approaching a public launch.

**User roles** — baked into initial schema (no separate migration):
```sql
-- In users table definition
role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin'))
```
- Backend: `requireRole('admin')` middleware for admin-only routes
- Frontend: conditional admin nav items based on `user.role`
- Set your own role via SQL: `UPDATE users SET role = 'admin' WHERE email = '...';`

**What Cognito gives you for free:**
- Email verification on registration
- Password reset ("Forgot password" flow)
- MFA (optional, TOTP or SMS)
- Social login (Google, Apple, Facebook — configure later)
- Refresh tokens with automatic rotation
- Brute force protection (account lockout)
- Secure password storage (SRP protocol, not bcrypt)

**Approach (clean start):**
- Create Cognito User Pool with email as username
- No migration Lambda needed — all users register fresh through Cognito
- Backend auth middleware changes from `jwt.verify(secret)` to verifying Cognito JWT (using Cognito's public JWKS endpoint)
- Frontend: use `amazon-cognito-identity-js` SDK for login/register/password reset UI
- Delete: `bcrypt` dependency, `password_hash` column usage, custom JWT signing

**Backend changes:**
- `src/middleware/auth.ts` — verify Cognito JWTs via JWKS
- `src/controllers/authController.ts` — remove register/login (Cognito handles it), keep `/api/auth/me`
- `src/utils/jwt.ts` — delete (Cognito issues tokens)
- `src/config/env.ts` — add Cognito User Pool ID, Client ID
- Remove `bcrypt`, `jsonwebtoken` dependencies
- Add `aws-jwt-verify` or `jwks-rsa` dependency

**Frontend changes:**
- `js/auth.js` — use Cognito SDK for login/register/password reset
- `index.html` — add "Forgot password?" link, email verification step
- Auth modal — add password reset flow, verification code input

**New infrastructure:**
- AWS Cognito User Pool (eu-north-1)
- SES verified domain `woofapp.fi` for Cognito emails (from `noreply@woofapp.fi`, MAIL FROM `mail.woofapp.fi`)

**Onboarding UX (added post-Cognito):**
- Welcome banner in feed for authenticated users with 0 dogs
- Create dog modal: placeholders, body scroll lock, navigate to profile after creation
- Profile onboarding tour: 3-step carousel (Welcome, Sharing, Health Diary) shown once for new owners
- Improved empty states: Posts tab shows "Share your first photo!" for owners, Health tab has "Add First Record" button

**Design System (added 2026-02-21):**
- 60+ `--woof-*` CSS custom properties: color, radius, shadow, typography, spacing, animation easing
- Brand color migrated from Instagram Blue (`#0095F6`) to Woof Orange (`#EF4621`)
- Warm cream neutral palette (`#FAFAF8` bg, `#1A1A1A` text)
- Border radii increased: sm 8px, md 12px, lg 16px
- Alias layer: old `--color-*` names point to `--woof-*` tokens — zero component regressions
- Design reference at `docs/design/index.html` (interactive, opens in any browser)
- `docs/design/tokens.json` — W3C Design Token format for Figma/Style Dictionary

### 5B. Svelte 5 Migration + Architectural Refactor + UI Polish (COMPLETE)

**Svelte 5 Migration (2026-02-22):**
- Full migration from vanilla JS views to Svelte 5 SPA (`src-refactored/`)
- 44 component unit tests pass; build: 201 modules, 217.85 kB
- Runes-only: `$props()`, `$state()`, `$derived()`, `$effect()` — no Svelte 4 patterns
- Event bus (window custom events) eliminated — replaced by `modal-store.svelte.js` callback props
- ProfileView fully migrated to Svelte 5; dead JS files deleted

**Architectural Refactor (2026-02-22):**
- N+1 query fix in postController (LEFT JOIN aggregation)
- createDog wrapped in transaction; getAllDogs cursor-paginated
- Cache-Control + ETag headers on feed and profile responses
- Performance indexes migration (013_performance_indexes.sql)
- 185/185 backend tests pass

**UI Polish (2026-02-23):**
- Skeleton shimmer loaders implemented and wired up in Feed.svelte + ProfileView.svelte ✅
- Brand color palette updated from Woof Orange (`#EF4621`) to Woof Crimson (`#C9403F`)
- New artisan palette tokens: gold (`#C3A84E`), butter (`#F0CA78`), slate-dark (`#4A5A6B`), slate-mid (`#799FAE`), ice blue (`#C8DAE4`)
- Design system docs updated: `docs/design/index.html`, `foundations.md`, `README.md`

### 5C/5D. Post Options Sheet + Reporting + Bookmarks + Admin Panel (COMPLETE 2026-02-23)

**Post Options Sheet (Instagram-style bottom action sheet):**
- Three-dot "..." button on every PostCard (top-right)
- Own post menu: Delete post, Go to post, Share, Copy link
- Others' post menu: Report, Follow/Unfollow, Add/Remove favourites, Go to post, Share, Copy link, Visit profile
- Unauthenticated: limited menu, Report/Follow prompt login
- Delete confirmation view (no browser confirm() dialog) with "Delete" / "Keep post" styled buttons
- Multi-view sheet: `options` → `report` → `confirm-delete` — transitions via Svelte `fly`/`fade`

**Reporting system:**
- `014_reports.sql` migration: reports table with UNIQUE(reporter, target_type, target_id), status lifecycle
- `POST /api/reports` — authenticated, 409 on duplicate
- `GET /api/reports` — admin/moderator only, cursor-paginated, joins post content (caption, image, dog name)
- `PATCH /api/reports/:id/status` — admin/moderator only
- Reason picker in sheet: inappropriate_content, spam, harassment, not_a_dog, violence, other

**Bookmarks (Favourites):**
- `015_post_bookmarks.sql` migration: post_bookmarks table with composite PK
- `POST /api/bookmarks/:postId/toggle` — toggle on/off, returns `{ bookmarked: boolean }`, 404 on FK violation
- `GET /api/bookmarks/:postId/status` — returns current status

**Admin panel (`/admin` route):**
- Accessible to `admin` and `moderator` roles only (gated in both Navigation + AdminView)
- Filter tabs: Pending / Reviewed / Actioned / Dismissed / All
- Report cards: post image, reason badge, status badge, caption, dog name/link, reporter email + timeAgo
- Actions: Delete post + action, Mark reviewed, Dismiss
- `store.authUser.role` populated from `syncUser()` response on app init
- Navigation shows "Moderation" link only for admin/moderator users

**Bug fixes during implementation:**
- `Cache-Control: public, max-age=60` on feed caused stale data after post mutations — fixed with `cache: 'no-store'` in `apiRequest`
- `response.json()` on 204 No Content threw error — fixed with `response.text()` + conditional parse
- Toast CSS was entirely missing — added complete toast styles
- Svelte `fly` transition requires `y: number` (pixels), not `'100%'` string

**Tests added:**
- Backend: `reports.test.ts` (21 tests), `bookmarks.test.ts` (13 tests)
- Frontend unit: `AdminView.test.ts` (9 tests), updated `PostCard.test.ts` (+2 tests for "..." button)
- E2E: `posts.spec.ts` (3 tests: delete own post via sheet, report sheet for others' posts, bookmark toggle)
- Totals: backend 219 tests, frontend 45 unit tests

### 5C-content. Content Moderation *(deferred → implemented as Phase 6D)*

### 5D. Reporting System

**Decision: Build (simple CRUD)**

**Database:**
```sql
-- 014_reports.sql
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_user_id UUID NOT NULL REFERENCES users(id),
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('post', 'comment', 'message', 'dog')),
    target_id UUID NOT NULL,
    reason VARCHAR(50) NOT NULL CHECK (reason IN (
        'inappropriate_content', 'spam', 'harassment',
        'not_a_dog', 'violence', 'other'
    )),
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(reporter_user_id, target_type, target_id)
);
```

**Backend:**

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/reports` | required | Submit a report |
| GET | `/api/admin/reports` | admin | List pending reports (admin only) |
| PUT | `/api/admin/reports/:id` | admin | Review/action a report |

**Frontend:**
- Report button (flag icon) on posts, comments, dog profiles
- Report modal with reason selection + optional description
- Admin route `/admin/reports` in existing SPA (gated by `user.role === 'admin'`)
- Admin can also delete any post/comment directly (role check in API)

**Role permissions:**

| Action | Moderator | Admin |
|--------|-----------|-------|
| View & action report queue | Yes | Yes |
| Hide/remove reported posts & comments | Yes | Yes |
| See moderation status flags | Yes | Yes |
| Delete any post/comment (without report) | No | Yes |
| Ban/suspend users | No | Yes |
| Change user roles | No | Yes |
| View platform stats | No | Yes |

**Admin views (inside main SPA):**

| Route | Access | Purpose |
|-------|--------|---------|
| `/admin/reports` | moderator+ | Report queue with filter tabs (pending/reviewed/actioned) |
| `/admin/content` | admin | Browse all posts, remove any content |
| `/admin/users` | admin | User list, role management, ban/suspend |

Moderators also see a flag/shield icon on posts in the normal feed for quick moderation actions.

**Admin approach:** Built into the main app as `/admin/*` routes, not a separate subdomain. Separate to `admin.woofapp.fi` only if admin grows beyond ~10 pages or external moderators are hired.

### 5E. Error Tracking *(deferred → implemented as Phase 6E)*

---

## Phase 6: Performance & Infrastructure

**Why second:** Make what you have fast and reliable before adding more features.

**Execution order: 6A → 6C → 6B** (PWA before caching — higher user-visible value, fully independent)

### 6A. Image CDN + Optimization

**Decision: Build (Lambda + Sharp + CloudFront)**

Resize uploaded images to 3 variants for fast loading across all contexts.

| Variant | Width | Use case |
|---------|-------|----------|
| thumb | 150px | Profile pics, grid thumbnails |
| medium | 600px | Feed posts, post detail |
| original | as-is | Full-screen / download |

**How it works — Lambda trigger, not synchronous backend processing:**

The current upload flow is `browser → presigned URL → S3 directly`. The backend never sees the file, so Sharp cannot run in `uploadController.ts`. Instead:

1. Browser uploads original to S3 at key `photos/{uuid}.jpg` (unchanged)
2. S3 triggers a Lambda on `ObjectCreated` events under `photos/`
3. Lambda reads the original, resizes to thumb + medium using Sharp, writes back to S3:
   - `photos/{uuid}.jpg` — original (already there)
   - `photos/{uuid}_medium.jpg`
   - `photos/{uuid}_thumb.jpg`
4. All three are served via `cdn.woofapp.fi/{key}`

**Backend changes:**
- `src/controllers/uploadController.ts` — return a structured key (`photos/{uuid}.jpg`) alongside the presigned upload URL. API responses derive CDN URLs from the key rather than storing full S3 URLs.
- All API endpoints that return `image_url` / `profile_image_url` construct the CDN URL: `https://cdn.woofapp.fi/{key}`
- Feed and dog profile responses return `image_url_medium` and `image_url_thumb` fields alongside `image_url` (original)

**Frontend changes (Svelte):**
- Svelte components use `image_url_medium` in `PostCard.svelte` and `Feed.svelte` (feed display)
- `ProfileView.svelte` uses `image_url_thumb` for the profile avatar
- Fall back to `image_url` if medium/thumb variant is not yet available (Lambda async delay on first upload)
- No changes to `api.js` — CDN URLs come from API responses, components just bind `src`

**Infrastructure:**
- CloudFront distribution pointing at `woof-prod-photos` S3 bucket → `cdn.woofapp.fi`
- S3 object Cache-Control: `public, max-age=31536000, immutable` (images never change — new upload = new UUID key)
- Lambda function in eu-north-1, triggered by S3 `ObjectCreated`, IAM role with `s3:GetObject` + `s3:PutObject` on `woof-prod-photos`

### 6B. Selective HTTP Caching

**Why not a client-side JS cache layer:**

The Svelte 5 architecture uses version signals (`feedVersion`, `dogVersion`, `profileVersion` in `svelte-store.svelte.js`) as the cache invalidation mechanism. Components watch these in `$effect` and re-fetch when they bump. Adding a separate TTL-based in-memory cache in `api.js` would create two competing invalidation systems — a mutation would bump the version signal and trigger a re-fetch, but `api.js` would serve stale cached data. This is the same class of bug that was already hit and fixed with `cache: 'no-store'` in Phase 5C/5D.

The version signal + reactive re-fetch pattern is already doing what SWR provides conceptually: components render from existing `$state` immediately while a re-fetch runs in the background. No additional layer needed.

**Backend — add Cache-Control to stable endpoints only:**

| Endpoint | Header | Rationale |
|----------|--------|-----------|
| `GET /api/dogs/:id` | `public, max-age=300` | Dog profiles change infrequently |
| `GET /api/dogs/slug/:slug` | `public, max-age=300` | Same |
| `GET /api/follows/status/:dogId` | `public, max-age=60` | Follow counts change but tolerate 1 min stale |
| `GET /api/posts/feed` | none | Mutations are frequent; version signals drive re-fetches |
| `GET /api/messages/*` | none | Real-time; polling requires fresh responses |

Add `ETag` support to `GET /api/dogs/:id` — reduces bandwidth for unchanged profiles on return visits (304 Not Modified).

**Frontend — make `cache` opt-in per call, not global `no-store`:**

`apiRequest()` currently hardcodes `cache: 'no-store'` globally. Change it to accept a `cache` option (default `'no-store'` to preserve existing behaviour), then pass `cache: 'default'` on stable read calls:

```js
// api.js — only these callers change; everything else stays no-store
getDog(id)         → apiRequest(`/api/dogs/${id}`,        { cache: 'default' })
getDogBySlug(slug) → apiRequest(`/api/dogs/slug/${slug}`, { cache: 'default' })
getFollowStatus()  → apiRequest(`/api/follows/status/…`,  { cache: 'default' })
```

The browser then honours the `Cache-Control` headers the backend sets, and the version signal bumps in the Svelte store remain the single source of truth for invalidation.

### 6C. PWA Foundation

**Decision: Build (vite-plugin-pwa)**

`vite-plugin-pwa` integrates directly with the Vite + Svelte 5 build and generates the service worker automatically from `vite.config.ts`. No manual service worker authoring needed.

**Changes:**
- Add `vite-plugin-pwa` to `devDependencies`
- Configure in `vite.config.ts`: app name, icons, theme color (`--woof-color-brand-primary` = `#C9403F`), `display: standalone`, `start_url: /`
- Service worker strategy: `generateSW` with `precacheAndRoute` for the app shell (HTML, JS, CSS bundles). Runtime caching for CDN images (`cdn.woofapp.fi`) with `CacheFirst`, `max-age: 7 days`
- Offline fallback page: served from precache when network is unavailable
- Add `<meta name="theme-color" content="#C9403F">` and Apple touch icon meta tags to `index.html`

This enables "Add to Home Screen" on Android and iOS and gives the app a native feel without Capacitor.

**Note:** Token Refresh (old 6D) is removed — Cognito SDK handles refresh tokens automatically (Phase 5A complete).

### 6D. Content Moderation (Perspective API + Rekognition)

**Hate speech filter — Buy: Google Perspective API**

Filter racist and toxic content while allowing normal language including swearing. Perspective API supports Finnish and English and distinguishes identity attacks/hate speech (blocked) from general profanity (allowed).

**Backend changes:**
- `src/services/perspectiveService.ts` — wraps Perspective API `AnalyzeComment`
- Check `IDENTITY_ATTACK` and `THREAT` attributes only (not `TOXICITY` / `PROFANITY` — those catch normal swearing)
- Apply to: `POST /api/comments`, `POST /api/posts`, `POST /api/messages`, `POST /api/dogs`, `PUT /api/dogs/:id`
- Reject with 400 + clear user-facing message if score exceeds threshold
- Pass `languages: ['fi', 'en']`

**Image moderation — Buy: AWS Rekognition**

Screen every uploaded image for inappropriate content at post creation time (not at upload, since the presigned URL flow means the backend never touches the file directly). Rekognition can call S3 directly given an object key.

**Backend changes:**
- `src/services/moderationService.ts` — wraps Rekognition `DetectModerationLabels` using the S3 key
- Call from `postController.ts` `createPost()` — after the image URL is received, before the DB insert
- Synchronous check: if flagged, reject with 400 before the post is created
- `moderation_status` column already exists on posts table from `001_initial_schema.sql` (default `'approved'`). No new migration needed.
- Admin panel already shows `moderation_status` — no frontend changes needed for admin
- Feed query: add `WHERE p.moderation_status != 'rejected'` filter

### 6E. Error Tracking (Sentry)

**Decision: Buy (Sentry free tier — 5K errors/month)**

**Backend:** Add `@sentry/node`, initialize in `src/app.ts`, add Sentry error handler middleware after all routes.

**Frontend:** Add `@sentry/sveltekit` (works with Vite/Svelte 5), initialize in `src/main.ts`. Captures unhandled promise rejections and component errors.

---

## Phase 7: Engagement & Discovery

**Why third:** These features increase session time and return visits. Notifications are the #1 retention driver.

### 7A. In-App Notifications

**Decision: Build (PostgreSQL + polling)**

**Database:**
```sql
-- 015_notifications.sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN (
        'like', 'comment', 'follow', 'message'
    )),
    target_type VARCHAR(20),
    target_id UUID,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_user_id, read, created_at DESC);
```

**Backend:**

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/notifications` | required | List notifications (paginated) |
| PUT | `/api/notifications/read` | required | Mark all as read |
| GET | `/api/notifications/unread-count` | required | Badge count |

Generate notifications in existing controllers:
- `likeController.ts` — on like, create notification for post owner
- `commentController.ts` — on comment, notify post owner
- `followController.ts` — on follow, notify followed dog's owner
- `messageController.ts` — on message, notify recipient (if not already in conversation view)

**Frontend:**
- Notification bell icon in header with unread count badge
- `js/views/NotificationsView.js` — notification list
- Poll unread count every 30s (same pattern as messages)
- Click notification → navigate to relevant content

### 7B. Hashtags

**Decision: Build (PostgreSQL)**

**Database:**
```sql
-- 016_hashtags.sql
CREATE TABLE hashtags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tag VARCHAR(100) NOT NULL UNIQUE,
    tag_normalized VARCHAR(100) NOT NULL UNIQUE,
    post_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE post_hashtags (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    hashtag_id UUID NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, hashtag_id)
);
CREATE INDEX idx_post_hashtags_hashtag ON post_hashtags(hashtag_id);
```

**Backend:**
- Parse hashtags from captions on post create (`#goldenretriever` → extract, normalize, upsert)
- `GET /api/hashtags/search?q=` — autocomplete for hashtag search
- `GET /api/hashtags/:tag/posts` — posts with this hashtag
- `GET /api/hashtags/trending` — top hashtags by recent post count

**Frontend:**
- Hashtags in captions rendered as clickable links → `/hashtag/:tag`
- Hashtag page shows posts grid (same as profile posts)
- Search includes hashtag results
- Post creation: hashtag autocomplete in caption input

### 7C. Breed-Based Content Filtering

**Decision: Build (PostgreSQL)**

**Database:**
```sql
-- 017_breeds.sql
CREATE TABLE breeds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    name_normalized VARCHAR(100) NOT NULL UNIQUE,
    group_name VARCHAR(100),
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE dogs ADD COLUMN IF NOT EXISTS breed_id UUID REFERENCES breeds(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_dogs_breed_id ON dogs(breed_id);

-- Seed ~200 common breeds including 'Mixed Breed' and 'Other'
```

**Backend:**

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/breeds` | none | List all breeds (cached) |
| GET | `/api/breeds/:id` | optionalAuth | Breed detail + member count |
| GET | `/api/breeds/:id/posts` | optionalAuth | Feed filtered to this breed |
| GET | `/api/breeds/search?q=` | none | Search/autocomplete breeds |

**Frontend:**
- Browse breeds page (`/breeds`)
- Breed detail page with breed feed and member dogs
- Dog create/edit: breed field becomes searchable autocomplete against breeds table
- Feed filter: "Filter by breed" option

### 7D. Internationalization (i18n)

**Decision: Library (i18next)**

Support Finnish and English, defaulting to device/browser language.

**Frontend:**
- Add `i18next` + `i18next-browser-languagedetector` dependencies
- Translation files: `locales/en.json`, `locales/fi.json`
- `js/i18n.js` — initialize i18next, detect `navigator.language`, fallback to `en`
- Replace all hardcoded UI strings with `t('key')` calls
- Language switcher in user settings / profile menu

**Scope of translated strings:**
- Navigation labels, button text, form labels, error messages, empty states, modal titles
- User-generated content (posts, comments, bios) is NOT translated — left as-is

**Backend:**
- API error messages: return error codes, frontend maps to localized strings
- No backend i18n library needed — all translation is client-side

### 7E. UX Improvements

Small but impactful features, all frontend-only:

| Feature | Implementation |
|---------|---------------|
| Double-tap to like | Touch event handler on post images (300ms debounce, heart animation) |
| Pull-to-refresh | Touch drag handler at top of feed, triggers feed reload |
| Post sharing | Web Share API button on posts (fallback: copy URL to clipboard) |
| Infinite scroll improvements | Intersection Observer, loading skeleton at bottom |

---

## Phase 8: Real-Time & Email

### 8A. WebSocket Messaging

**Decision: Library (Socket.io)**

Replace polling-based messaging with real-time WebSocket connections.

**Backend:**
- Add `socket.io` dependency
- `src/services/socketService.ts` — Socket.io server integrated with Express
- Authenticate WebSocket connections using JWT/Cognito token
- Events: `message:new`, `message:read`, `typing:start`, `typing:stop`
- Sticky sessions on EB load balancer for WebSocket support

**Frontend:**
- `js/socket.js` — Socket.io client, auto-reconnect
- MessagesView: real-time message delivery, typing indicators
- Notification count: real-time update via socket instead of polling

**Infrastructure (single instance):** No additional infra needed.
**Infrastructure (multi-instance):** Add ElastiCache Redis (cache.t3.micro, ~$13/mo) + `@socket.io/redis-adapter`.

### 8B. Transactional Email

**Decision: Buy (AWS SES)**

**Emails to send:**
- Welcome email (on registration)
- Notification digests (daily/weekly summary of likes, comments, follows)
- Password reset (handled by Cognito if Phase 5A done)

**Backend:**
- `src/services/emailService.ts` — SES wrapper with template rendering
- Email templates: simple HTML (use `mjml` or inline styles)
- Notification preferences: users can opt out of email digests

**Infrastructure:**
- Verify `woofapp.fi` domain in SES
- Request production access (move out of SES sandbox)

---

## Phase 9: Content Expansion

### 9A. Video Posts (15-30s)

**Decision: Buy (Lambda + ffmpeg for thumbnails, MediaConvert if transcoding needed)**

**Backend:**
- Accept video uploads to S3 (`.mp4`, `.mov`, max 30s, max 50MB)
- Lambda trigger on S3 upload: extract thumbnail at 1s mark using ffmpeg
- Optional: MediaConvert job to transcode to H.264/MP4 if source format varies
- Store: `posts.media_type` column ('image' | 'video'), `posts.thumbnail_url`

**Frontend:**
- Video player in feed (HTML5 `<video>`, muted autoplay on scroll, tap to unmute)
- Upload modal: accept video files, show preview, duration validation
- Thumbnail as poster frame

**Database:**
```sql
ALTER TABLE posts ADD COLUMN media_type VARCHAR(10) DEFAULT 'image';
ALTER TABLE posts ADD COLUMN thumbnail_url TEXT;
```

### 9B. Multi-Photo Posts

**Database:**
```sql
CREATE TABLE post_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Frontend:** Carousel/swipe UI on posts with multiple images. Upload modal allows selecting up to 10 images.

---

## Phase 10: Community & Places

### 10A. Dog-Friendly Places (Map)

**Decision: Build + free services (Leaflet + OpenStreetMap)**

**External dependencies:**
- Leaflet 1.9.x (CDN, free, BSD-2)
- OpenStreetMap tiles (free, no API key)
- Overpass API (free, for seeding data)

**Database:**
```sql
CREATE TABLE places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'dog_park', 'vet_clinic', 'pet_store', 'groomer',
        'dog_friendly_cafe', 'dog_friendly_restaurant', 'other'
    )),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT,
    description TEXT,
    osm_id BIGINT UNIQUE,
    added_by_dog_id UUID REFERENCES dogs(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE place_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    dog_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(place_id, dog_id)
);
```

**Backend:** CRUD for places, reviews, nearby search (Haversine SQL), Overpass seeder script.
**Frontend:** Map view with type filters, place cards, add place modal, place detail with reviews.

### 10B. Dog Park Check-In

**Depends on:** 10A (places table).

**Database:**
```sql
CREATE TABLE checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    dog_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed')),
    check_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
    check_out_time TIMESTAMP WITH TIME ZONE,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Backend:** Create/activate/complete check-ins, "who's here" endpoint, auto-expire stale check-ins.
**Frontend:** Check-in button on place detail, "Who's Here" list, map markers with active count badge.

---

## Phase 11: Native App & Growth

### 11A. Capacitor Wrapper

**Decision: Use framework (Capacitor by Ionic, free)**

Wrap the existing Vite SPA in a native shell for App Store and Play Store.

- Install `@capacitor/core`, `@capacitor/cli`
- Add iOS and Android projects
- Configure deep linking (Universal Links / App Links)
- Access native APIs: camera, push notifications, haptics

### 11B. Native Push Notifications

**Decision: Buy (AWS SNS or FCM)**

- Register device tokens on app install
- Backend sends push via SNS/FCM when notifications are created
- Pair with in-app notifications (Phase 7A)

### 11C. Analytics Upgrade

**Decision: Buy (PostHog or Mixpanel free tier)**

When you need funnels, retention analysis, and session recordings, add a managed analytics tool. PostHog Cloud free tier: 1M events/month. Mixpanel free tier: 20M events/month.

---

## Migration Summary

| # | File | Phase | Feature |
|---|------|-------|---------|
| 013 | performance_indexes.sql | 5B | Performance indexes on core tables |
| 014 | reports.sql | 5C/5D | Reporting system (COMPLETE) |
| 015 | post_bookmarks.sql | 5C/5D | Post bookmarks/favourites (COMPLETE) |
| 016 | notifications.sql | 7A | In-app notifications |
| 016 | hashtags.sql | 7B | Hashtags |
| 017 | breeds.sql | 7C | Breed normalization + communities |
| 018 | video_support.sql | 9A | Video posts (media_type, thumbnail_url) |
| 019 | post_images.sql | 9B | Multi-photo posts |
| 020 | places.sql | 10A | Dog-friendly places + reviews |
| 021 | checkins.sql | 10B | Dog park check-ins |

Note: Data reset in Phase 5A means `password_hash` column is removed and `role` column is baked into the initial users table definition. No gradual migration needed — clean start with Cognito-native auth.

---

## Cost Summary by Phase

| Phase | Additional Monthly Cost | Notes |
|-------|------------------------|-------|
| Current | ~$35-65/mo | EB + RDS + S3 + CloudFront |
| Phase 5 (Trust & Safety) | +$1-5/mo | Rekognition. Cognito, SES, Sentry, Perspective API all free. Staging postponed. |
| Phase 6 (Performance) | +$1-3/mo | CloudFront image CDN. Sharp/PWA are free. |
| Phase 7 (Engagement) | +$0 | All PostgreSQL-based. |
| Phase 8 (Real-time) | +$0-13/mo | Socket.io free. Redis only if multi-instance. |
| Phase 9 (Content) | +$2-10/mo | Video storage + MediaConvert. |
| Phase 10 (Places) | +$0 | Leaflet/OSM free. PostgreSQL queries. |
| Phase 11 (Native) | +$0-5/mo | Capacitor free. Push via SNS pennies. |
| **Total at Phase 11** | **~$40-100/mo** | Staging not included (postponed) |

---

## Technical Debt

| Item | Priority | Notes |
|------|----------|-------|
| ~~HTTPS~~ | ~~High~~ | ✅ Done — Cloudflare free tier, `woofapp.fi` |
| ~~Default avatar 404~~ | ~~Low~~ | ✅ Done — image exists at `/assets/images/dog_profile_pic.jpg` |
| S3 SPA routing | Medium | Direct URL navigation returns S3 404 HTML before JS takes over. Need CloudFront with error page redirect to index.html |
| Token expiration handling | Resolved in Phase 5A | Cognito handles refresh tokens automatically |
| Test coverage gaps | Medium | Frontend tests minimal, image upload not tested |
| No staging environment | Low (for now) | Postponed. Production is the test environment while user base is small (friends only). Revisit before public launch. |

---

## Architecture Decisions

### Phase 3
- **Comments:** Separate `comments` table, not embedded in posts. Paginated retrieval (cursor-based like feed).
- **Search:** Full-text search via PostgreSQL `ILIKE` — no external search service needed at this scale.
- **Bottom nav:** CSS-only, no framework. Fixed position, z-index above content, `@media` query for mobile breakpoint.
- **Skeletons:** CSS `@keyframes` shimmer animation, no JavaScript library.
- **Image aspect ratio:** CSS `aspect-ratio` property with `object-fit: cover`.

### Phase 5+
- **Auth:** AWS Cognito over Auth0/Clerk/Firebase — same ecosystem, free at scale, eliminates custom password storage.
- **Image moderation:** AWS Rekognition over open-source models — no ML infra to manage, $1/1000 images.
- **Hate speech:** Google Perspective API over `bad-words`/AWS Comprehend — supports Finnish, distinguishes hate speech from normal swearing (swearing is allowed, racism is not). Free, no API cost.
- **i18n:** `i18next` — industry standard, browser language detection, JSON translation files. Finnish + English.
- **Search:** PostgreSQL FTS over Algolia/OpenSearch/ElasticSearch — free, already have RDS, adequate at <100K records. ElasticSearch adds ~$25/mo minimum for no user-visible benefit at this scale. Reconsider only at 100K+ records with complex search needs (fuzzy matching, geo-distance, marketplace).
- **Real-time:** Socket.io over AWS AppSync/Pusher — no vendor lock-in, no connection limits, pairs with Express.
- **Native app:** Capacitor over React Native/Flutter — wraps existing SPA, no rewrite needed.
- **Admin tool:** Built into main SPA as `/admin/*` routes, not a separate subdomain. Avoids duplicate deployment, auth, and CORS setup. Separate only if admin grows beyond ~10 pages or external moderators are hired.
- **User roles:** Simple `role` column (`user`/`moderator`/`admin`) over full RBAC. Three roles cover all needs through Phase 10.
- **Testing/staging:** Postponed. Production serves as test environment while user base is friends-only. Revisit before public launch.
- **Data reset:** Clean slate before Cognito migration. No real users to preserve — eliminates migration Lambda complexity.
