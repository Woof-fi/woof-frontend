# Woof - Claude Code Instructions

**Last Updated:** 2026-02-18
**Status:** Phase 3 in progress (3.1, 3.2, 3.6 complete). See [ROADMAP.md](/ROADMAP.md) for full product roadmap.

## Project Overview

Woof is a dog-centric social network (Instagram for dogs). Dogs are the primary users.

- **Frontend repo**: `/Users/tommikivisaari/Documents/Personal/Projects/Woof` (GitHub: Woof-fi/woof-frontend)
- **Backend repo**: `/Users/tommikivisaari/Documents/Personal/Projects/woof-backend` (GitHub: Woof-fi/woof-backend)
- **Frontend source**: `src-refactored/` is the active directory (SPA, single entry point: `index.html` → `app-spa.js`)
- **Tech stack**: Vite + vanilla JS (frontend), Express + PostgreSQL (backend)
- **Hosting**: S3 (frontend), Elastic Beanstalk (backend), both in eu-north-1
- **Frontend URL**: http://woof-app-frontend-2026.s3-website.eu-north-1.amazonaws.com/
- **Backend URL**: http://woof-prod.eba-pz3gawvp.eu-north-1.elasticbeanstalk.com

## Development

```bash
# Frontend dev server
cd /Users/tommikivisaari/Documents/Personal/Projects/Woof/src-refactored
npm run dev

# Backend dev server
cd /Users/tommikivisaari/Documents/Personal/Projects/woof-backend
npm run dev

# Tests
cd src-refactored && npm test          # Frontend (Vitest, 36 tests)
cd woof-backend && npm test            # Backend (Jest, 120 tests)

# Build
cd src-refactored && npm run build     # Vite build to dist/
```

## MCP Tools Available

- **Playwright MCP**: Browser automation for visual validation. Configured in `Projects/.mcp.json` (moved from `Woof/.mcp.json` so it loads when running from the Projects directory). Use `browser_navigate`, `browser_snapshot`, `browser_click` etc. to verify the app works in a real browser.

## Git Workflow

- Always push to GitHub after commits. Both repos have remotes configured.
- Frontend: `git push origin main` from `/Users/tommikivisaari/Documents/Personal/Projects/Woof`
- Backend: `git push origin main` from `/Users/tommikivisaari/Documents/Personal/Projects/woof-backend`
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

## Phase 3: UX Polish + Core Social Features ← IN PROGRESS

See [ROADMAP.md](/ROADMAP.md) for the full product roadmap with competitor analysis, visual audit findings, and detailed implementation plan.

### 3.1 - Form styling overhaul ✅
- Universal form element styles scoped to `.modal` (inputs, textareas, selects, file inputs)
- `.form-group` spacing (16px), label styling (14px, 600 weight)
- Focus states: blue border + `box-shadow` glow ring using `--color-primary`
- `.modal-header`, `.modal-close`, `.modal-body` structure styles
- Auth tab switcher (`.auth-tabs`, `.auth-tab`) matching feed tab design
- Backdrop blur (`backdrop-filter: blur(4px)`) on modal overlay
- File inputs with dashed border and hover highlight
- Custom select dropdown arrow via SVG `background-image`
- iOS zoom prevention (`font-size: 16px` on mobile inputs)
- Updated `--radius-sm` from 3px to 6px (cascades to all existing uses)
- Added `--radius-lg: 12px` design token
- Removed redundant `#create-post-form` input styles (now handled universally)
- CSS-only change, single file: `styles.css`

### 3.2 - Post timestamps ✅
- `timeAgo()` utility in `utils.js` with full-word format ("2 days ago", "45 minutes ago")
- Timestamp displayed below caption on every post (Instagram-style)
- Click-to-toggle: relative time ↔ full date/time (`February 17, 2026 at 2:33 PM`)
- `<time>` semantic element with `datetime` attribute, `cursor: pointer`
- CSS: 10px uppercase muted text in `.post-timestamp-container`

### 3.6 - Profile Posts tab ✅
- Backend: `GET /api/posts/dog/:dogId` endpoint with cursor-based pagination, `optionalAuth` for `likedByUser`
- `DogIdParamSchema` Zod validation, `getPostsByDog` controller in `postController.ts`
- Frontend: `getDogPosts()` in `api.js`, `loadProfilePosts()` in `profile.js`
- Instagram-style 3-column grid (`posts-grid`) with hover overlay showing like count
- Fallback SVG for broken images, empty state for no posts

**Remaining Phase 3 tasks:**
1. Mobile bottom navigation bar
3. Comments system (backend + frontend)
4. Search / Explore page
5. Loading skeletons
6. Image aspect ratio standardization
7. Misc UX fixes (default avatar, remove placeholder buttons)

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
| Default avatar image 404 | `/assets/images/dog_profile_pic.jpg` missing from S3 | Open |
| ~~Unstyled form inputs in all modals~~ | Universal `.modal` form styles in `styles.css` | ✅ Done (Phase 3.1) |
| ~~No post timestamps in feed~~ | `posts.js` — relative time + click-to-toggle | ✅ Done (Phase 3.2) |
| Mobile header nav wraps/overflows | No bottom nav, no hamburger menu | Open (Phase 3.4) |
| ~~Profile Posts tab empty~~ | 3-column grid with `GET /api/posts/dog/:dogId` | ✅ Done (Phase 3.6) |
| Search button non-functional | Header search icon navigates to `#` | Open (Phase 3.5) |
| Comment button non-functional | Action bar button, no backend/frontend | Open (Phase 3.3) |
| Share button non-functional | Action bar button, no implementation | Open (Phase 4+) |
| Messages icon non-functional | Header icon, no backend/frontend | Open (Phase 5) |
| Notifications icon non-functional | Header bell icon, no backend/frontend | Open (Phase 4) |

## Security Notes

- XSS: Use `escapeHTML()` for innerHTML; DOM methods (textContent, createTextNode) are inherently safe
- File uploads: Validate type and size before upload
- Auth: JWT-based, 7-day expiry, Bearer token header
- Admin endpoints: Protected by `x-admin-secret` header
- NEVER commit `.env` files or secrets
