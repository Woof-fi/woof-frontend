# Woof - Claude Code Instructions

**Last Updated:** 2026-02-21
**Status:** Phase 5A complete (Cognito + Onboarding UX). Email via Cognito default (50/day); SES setup preserved for future use. Next: Phase 5B (Content Moderation). See [ROADMAP.md](/ROADMAP.md).

## Project Overview

Woof is a dog-centric social network (Instagram for dogs). Dogs are the primary users.

- **Frontend repo**: `woof-frontend/` (GitHub: Woof-fi/woof-frontend)
- **Backend repo**: `woof-backend/` (GitHub: Woof-fi/woof-backend)
- **Frontend source**: `src-refactored/` is the active directory (SPA, single entry point: `index.html` → `app-spa.js`)
- **Tech stack**: Vite + vanilla JS (frontend), Express + PostgreSQL (backend)
- **Hosting**: S3 (frontend), Elastic Beanstalk (backend), both in eu-north-1
- **Frontend URL**: https://woofapp.fi (S3 behind Cloudflare)
- **Backend URL**: https://api.woofapp.fi (Elastic Beanstalk behind Cloudflare)

## Multi-Device Setup

When picking up this project on a new machine (MacBook, PC, etc.):

```bash
# 1. Clone both repos (if not already present)
git clone https://github.com/Woof-fi/woof-frontend.git
git clone https://github.com/Woof-fi/woof-backend.git

# 2. Install frontend dependencies
cd woof-frontend/src-refactored && npm install

# 3. Install backend dependencies + create .env
cd ../../woof-backend && npm install
# Copy .env from 1Password / another machine. Required vars:
# DATABASE_URL, AWS_REGION, COGNITO_USER_POOL_ID,
# COGNITO_CLIENT_ID, S3_BUCKET

# 4. Set up local databases (for backend tests)
createdb woof && createdb woof_test
npm run db:migrate && npm run db:migrate:test

# 5. Configure AWS CLI (needed for npm run deploy and eb deploy)
aws configure  # use woof-deployer credentials from 1Password

# 6. MCP (Playwright): .mcp.json is committed — works after npx installs @playwright/mcp
#    On macOS: npx playwright install chromium  (first time only)
```

**Always push to GitHub after committing** — this is the handoff point between devices.

---

## Development

```bash
# Frontend dev server (from woof-frontend/src-refactored/)
npm run dev

# Backend dev server (from woof-backend/)
npm run dev

# Tests
npm test          # Frontend: Vitest (from src-refactored/)
npm test          # Backend: Jest, 185 tests (from woof-backend/)

# E2E tests (Playwright, from src-refactored/)
npm run test:e2e                                        # Against https://woofapp.fi
E2E_BASE_URL=http://localhost:5173 npm run test:e2e    # Against local dev server

# Local dev with mock auth (no Cognito/AWS needed)
# Frontend: VITE_MOCK_AUTH=true is set in .env.development (auto-used by npm run dev)
# Backend:  MOCK_COGNITO=true npm run dev

# Build + deploy
npm run build     # Vite build to dist/ (from src-refactored/)
npm run deploy    # Build + sync to S3 (requires AWS CLI configured)
eb deploy         # Deploy backend to Elastic Beanstalk (from woof-backend/)
```

## MCP Tools Available

- **Playwright MCP**: Browser automation for visual validation. Configured in `woof-frontend/.mcp.json` (also copied to the parent workspace root so it loads from either location). Use `browser_navigate`, `browser_snapshot`, `browser_click` etc. to verify the app works in a real browser.

## Git Workflow

- Always push to GitHub after commits. Both repos have remotes configured.
- Frontend: `git push origin main` from `woof-frontend/`
- Backend: `git push origin main` from `woof-backend/`
- CI runs on push (GitHub Actions: type-check, tests, build)

---

# CLEANUP PLAN

## Phase 0: Clean Up Foundation - COMPLETE ✅

### 0.1 - Resolve .js/.ts file duality ✅
Deleted 6 dead `.ts` files: `app.ts`, `auth.ts`, `api.ts`, `config.ts`, `utils.ts`, `invite.ts`. Kept `types/api.ts` for type documentation.

### 0.2 - Remove dead code and abandoned directories ✅
- Deleted `woof-frontend/` (abandoned Vite template)
- Deleted `src/` (original static prototype)
- Deleted `nelli.html`, `map.html`, `store.html`, `index-old.html` (legacy multi-page)
- Deleted `app.js` (legacy entry point, kept `app-spa.js` as SPA entry)
- Removed `initFeedTabs()` and `loadForYouFeed()` from `posts.js`
- Updated `search.js` to use SPA routes (`/dog/:slug` with `data-link`)
- Updated `modals.js` to delegate profile nav to `navigation.js`
- Updated `vite.config.ts` to single-page build
- Note: `i18n.js` is fully implemented (not a stub), kept for future use
- Note: `generateSlug()` doesn't exist in codebase, no action needed

### 0.3 - Fix the build pipeline ✅
- `npm run build` produces clean `dist/` output (no warnings)
- Fixed `HomeView.js` import of removed `initFeedTabs`

### 0.4 - Fix backend middleware ✅
- `optionalAuth` was already re-enabled on feed endpoint (fixed in Feb 9 session)
- Added `requireAdminSecret` middleware to all admin routes (was completely unprotected)
- Replaced `console.error` with Pino logger in admin routes
- Added 5 admin endpoint tests (auth rejection, success)

### 0.5 - Validate with Playwright ✅
Validated all flows with Playwright MCP (Feb 17, 2026):
- ✅ Home feed loads and displays posts (3 posts from Nelli)
- ✅ Login/register modal works (register, logout, re-login all functional)
- ✅ Post creation flow works (image + caption, post appears in feed)
- ✅ Dog profile pages load (`/dog/nelli-1` shows profile with tabs)
- ✅ Logout clears state and redirects to home (confirm dialog works)
- ✅ Navigation: sidebar Home/Create/Logo links work, SPA routing functional
- ✅ No console errors on any page (0 errors across all flows)
- Found 5 new issues documented in Known Issues Tracker below

## Phase 1: Refactor for Maintainability - COMPLETE ✅

Write tests alongside each refactor - not retroactively.

### 1.1 - Break up modals.js (716 lines) ✅
- Extracted `auth-modal.js` (auth login/register/logout UI)
- Extracted `create-post-modal.js` (post creation form)
- Extracted `create-dog-modal.js` (dog profile creation form)
- Extracted `cart-modal.js` (shopping cart drawer)
- `modals.js` reduced to 48-line coordinator with re-exports
- Existing tests updated and passing (36/36)

### 1.2 - Backend consistency ✅
- Extracted JWT generation into `utils/jwt.ts` (shared by register + login)
- Created `middleware/ownership.ts` (replaces duplicated checks in updateDog/deleteDog)
- Created `config/env.ts` (S3 bucket, region, presigned URL expiry, JWT secret/expiry)
- Replaced all `console.log` with Pino logger in `db/connection.ts`
- Updated `uploadController.ts` to use config instead of hardcoded S3 values
- Updated `middleware/auth.ts` to use config + logger
- Error response format reviewed: already consistent (`{ error: 'message' }`)
- Added 3 JWT utility tests (89 total backend tests)

### 1.3 - Add feed pagination ✅
- Cursor-based pagination on `GET /api/posts/feed` (query params: `cursor`, `limit`)
- Default page size 20, max 50; response includes `nextCursor` for next page
- Frontend uses IntersectionObserver for infinite scroll (Instagram-style)
- DB indexes on `posts.created_at` and `follows` already existed (migration 003)
- Added 6 pagination tests (95 total backend tests)

## Phase 2: Resume Feature Development - COMPLETE ✅

### 2.1 - Following feed, profile editing, UX fixes ✅
- Follow/unfollow backend API (`followController.ts`, routes, 13 tests → 108 total backend tests)
- Feed tabs (For You / Following) with tab switching in `HomeView.js`
- `initFeed(type)` accepts feed type, `loadMorePosts()` uses `currentFeedType`
- Profile editing: `edit-dog-modal.js` with pre-populated form, photo upload
- Edit button on own profile, Follow/Unfollow button on other profiles
- Follower/following counts on profile page via `GET /api/follows/status/:dogId`
- Post avatars link to dog profile (backend returns `dogSlug` in feed, frontend wraps in `<a data-link>`)
- Create Post validation: `createPost()` returns boolean, modal stays open on failure
- UX fixes: clickable post avatars, create post error feedback

### 2.2 - Likes API ✅
- Like/unlike backend API (`likeController.ts`, routes, 12 tests → 120 total backend tests)
- Feed response includes `likeCount` and `likedByUser` per post
- Frontend like button calls API with optimistic UI updates
- Like count displayed next to heart icon
- Fixed EB deployment: `.ebignore` includes `dist/`, build locally before `eb deploy`

## Phase 3: UX Polish + Core Social Features ✅ COMPLETE

See [ROADMAP.md](/ROADMAP.md) for the full product roadmap with competitor analysis, visual audit findings, and detailed implementation plan.

### 3.1 - Form styling overhaul ✅
- Universal form element styles scoped to `.modal` (inputs, textareas, selects, file inputs)
- Focus states, backdrop blur, auth tab switcher, iOS zoom prevention
- CSS-only change, single file: `styles.css`

### 3.2 - Post timestamps ✅
- `timeAgo()` utility with click-to-toggle relative time ↔ full date
- `<time>` semantic element with `datetime` attribute

### 3.3 - Comments system ✅
- Backend: `comments` table (migration 010), `commentController.ts`, `routes/comments.ts`
- `commentCount` included in feed and dog posts responses
- Frontend: inline comment section, "View all X comments" link, comment input
- Comments hidden from non-authenticated users; comment button opens login modal for logged-out users
- Files: backend routes/controllers/migration/tests, frontend `posts.js`, `styles.css`

### 3.4 - Mobile bottom navigation ✅
- Instagram-style fixed bottom nav bar on mobile (≤768px), hidden on desktop
- 5 tabs: Home, Search, Create (+), Activity (placeholder), Profile
- Dynamic profile tab based on auth state, active state tracks current route
- Files: `index.html`, `styles.css`, `navigation.js`, `router.js`, `search.js`

### 3.5 - Search / Explore ✅
- Backend: `GET /api/dogs/search?q=query` searches by name and breed
- Frontend: search panel on desktop + mobile, results link to dog profiles

### 3.6 - Profile Posts tab ✅
- Backend: `GET /api/posts/dog/:dogId` with cursor-based pagination, `optionalAuth` for `likedByUser`
- Frontend: 3-column grid with hover overlay showing like count

### Additional improvements (not in original roadmap) ✅
- **HTTPS / Custom Domain**: `woofapp.fi` via Cloudflare free tier (SSL, DNS, HSTS)
- **Password requirements**: Backend validation (8+ chars, uppercase, lowercase, number) + frontend real-time checklist in register form
- **XSS fix**: `escapeHTML()` applied to dog names/photos in `navigation.js` innerHTML
- **CORS update**: Backend allows `https://woofapp.fi` origin

### 3.7 - Loading skeletons ✅
- CSS shimmer animation, `showFeedSkeleton()` / `showProfileSkeleton()` in `ui.js`
- Skeleton HTML in `index.html` for initial load

### 3.8 - Image aspect ratio ✅
- Portrait images capped at 4:5 via container queries (`max-height: calc(100cqi * 1.25)`)

### 3.9 - Misc UX fixes ✅
- Share button uses Web Share API with clipboard fallback
- Like counts hidden when 0

---

## Known Issues Tracker

| Issue | Location | Status |
|-------|----------|--------|
| ~~Duplicate .js/.ts files~~ | `src-refactored/js/` | ✅ Done |
| ~~Dead `woof-frontend/` dir~~ | project root | ✅ Done |
| ~~Dead `src/` prototype dir~~ | project root | ✅ Done |
| ~~Orphan HTML pages~~ | `src-refactored/` | ✅ Done |
| ~~`initFeedTabs()` dead code~~ | `posts.js` | ✅ Done |
| ~~Feed endpoint missing middleware~~ | `woof-backend/src/routes/posts.ts` | ✅ Done |
| ~~Admin routes unprotected~~ | `woof-backend/src/routes/admin.ts` | ✅ Done |
| ~~`modals.js` is 716 lines~~ | Split into 4 modules + coordinator | ✅ Done |
| ~~Duplicated JWT generation~~ | Extracted to `utils/jwt.ts` | ✅ Done |
| ~~Duplicated ownership checks~~ | Extracted to `middleware/ownership.ts` | ✅ Done |
| ~~Hardcoded S3 bucket name~~ | Moved to `config/env.ts` | ✅ Done |
| ~~Mixed console.log/Pino~~ | `db/connection.ts` now uses Pino | ✅ Done |
| ~~No feed pagination~~ | Cursor-based with infinite scroll | ✅ Done |
| ~~Missing DB indexes~~ | Already existed in migration 003 | ✅ Done |
| ~~Dog slug `undefined` after creation~~ | `dogController.ts` response missing slug | ✅ Done |
| ~~Relative image paths break on `/dog/*`~~ | `navigation.js`, `profile.js`, `posts.js` | ✅ Done |
| ~~Post caption double-encodes HTML entities~~ | `posts.js` redundant `escapeHTML()` with DOM methods | ✅ Done |
| ~~Create Post silently fails without image~~ | `createPost()` returns boolean, modal checks result | ✅ Done |
| ~~Clicking post author avatar doesn't navigate to profile~~ | Avatar+username wrapped in `<a data-link>` | ✅ Done |
| ~~Profile always shows nelli-1 regardless of URL~~ | `ProfileView.js` wrong params destructuring | ✅ Done |
| ~~`getMyDogs` missing slug in response~~ | `dogController.ts` + `Dog.ts` missing slug | ✅ Done |
| ~~Navigation shows `nelli-undefined` slug~~ | `getMyDogs` + `toPublicProfile` missing slug | ✅ Done |
| ~~Default avatar image 404~~ | Fixed path references + image exists at `/assets/images/dog_profile_pic.jpg` | ✅ Done |
| ~~Unstyled form inputs in all modals~~ | Universal `.modal` form styles in `styles.css` | ✅ Done (Phase 3.1) |
| ~~No post timestamps in feed~~ | `posts.js` — relative time + click-to-toggle | ✅ Done (Phase 3.2) |
| ~~Mobile header nav wraps/overflows~~ | Bottom nav added, sidebar hidden on mobile | ✅ Done (Phase 3.4) |
| ~~Profile Posts tab empty~~ | 3-column grid with `GET /api/posts/dog/:dogId` | ✅ Done (Phase 3.6) |
| ~~Search button non-functional~~ | Fixed HTML ID mismatch, search works on desktop + mobile bottom nav | ✅ Done (Phase 3.4) |
| ~~Comment button non-functional~~ | Full comment system with backend API | ✅ Done (Phase 3.3) |
| ~~XSS in navigation.js~~ | `escapeHTML()` on dog names/photos in innerHTML | ✅ Done |
| ~~Weak password policy~~ | Backend + frontend validation (8+ chars, upper, lower, number) | ✅ Done |
| ~~HTTP only (no HTTPS)~~ | Cloudflare free tier + custom domain woofapp.fi | ✅ Done |
| Share button non-functional | Action bar button, no implementation | Open (Phase 4+) |
| Messages icon non-functional | Header icon, no backend/frontend | Open (Phase 5) |
| Notifications icon non-functional | Header bell icon, no backend/frontend | Open (Phase 4) |

## Email & Auth Testing

- **Email provider**: Cognito default (50 emails/day from `no-reply@verificationemail.com`). SES integration (`noreply@woofapp.fi`, DKIM verified) is preserved but inactive — AWS account needs billing history for SES production access in eu-north-1.
- **E2E tests**: Consume ~1 email per full run. Tests that need an authenticated user use `adminCreateUser()` (no email sent). Only the registration flow test triggers a real `signUp` email.
- **E2E helpers** (`e2e/helpers/cognito.ts`):
  - `adminCreateUser(user)` — creates CONFIRMED user via admin API, no email sent
  - `adminConfirmUser(email)` — admin-confirms an UNCONFIRMED user
  - `adminDeleteUser(email)` — deletes a Cognito user
  - `adminLoginOnly(page, user)` — admin-creates user + logs in via UI (in `e2e/helpers/auth.ts`)
  - `registerAndLogin(page, user)` — registers via UI (sends email) + admin-confirm + login
- **Mock auth** (`VITE_MOCK_AUTH=true` / `MOCK_COGNITO=true`): For local development without AWS. Frontend generates `mock-cognito-{email}` tokens, backend accepts them as valid cognito_user_id. Never enable in production.

## Security Notes

- XSS: Use `escapeHTML()` for innerHTML; DOM methods (textContent, createTextNode) are inherently safe
- File uploads: Validate type and size before upload
- Auth: AWS Cognito (ID tokens). Backend verifies via `aws-jwt-verify` + JWKS. Frontend uses `amazon-cognito-identity-js` SDK.
- Admin endpoints: Protected by `requireRole('admin')` middleware (Cognito role claim)
- HTTPS: Cloudflare free tier with SSL termination (Flexible mode)
- Passwords: Managed by Cognito (SRP protocol). Requirements enforced in Cognito User Pool policy.
- CORS: Only allows `https://woofapp.fi` origin
- NEVER commit `.env` files or secrets
