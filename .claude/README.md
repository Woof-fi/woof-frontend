# Woof - Claude Code Instructions

**Last Updated:** 2026-02-17
**Status:** Phase 0 cleanup complete (0.1-0.4 done), Phase 0.5 browser validation pending

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
cd woof-backend && npm test            # Backend (Jest, 86 tests)

# Build
cd src-refactored && npm run build     # Vite build to dist/
```

## MCP Tools Available

- **Playwright MCP**: Browser automation for visual validation. Configured in `.mcp.json`. Use `browser_navigate`, `browser_snapshot`, `browser_click` etc. to verify the app works in a real browser.

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

### 0.5 - Validate with Playwright ⏳
- Playwright MCP configured in `.mcp.json` (needs session restart to load)
- TODO: Start dev servers, navigate app, verify all flows work

## Phase 1: Stabilize Testing (NEXT)

### 1.1 - Frontend test infrastructure
- Add tests for `api.js` (296 lines, 0% coverage) - mock fetch, verify headers, error handling
- Add tests for `auth.js` login/register (async API flows, token storage)
- Add tests for `router.js` (route matching, navigation)
- Target: 60%+ coverage on core modules

### 1.2 - Backend test gaps
- Add tests for rate limiter behavior
- Add cascade delete tests (admin auth tests already done ✅)

### 1.3 - CI gate
- Add coverage threshold to CI (fail below 50%, increase over time)

## Phase 2: Refactor for Maintainability

### 2.1 - Break up modals.js (716 lines)
- Extract auth modal into `auth-modal.js`
- Extract post creation modal into `create-post-modal.js`
- Keep thin `modals.js` for shared open/close/overlay utilities

### 2.2 - Backend consistency
- Extract JWT generation into shared helper (duplicated in register + login)
- Create ownership verification middleware (repeated in 3 controllers)
- Standardize error response format
- Replace all `console.log` with Pino logger
- Move hardcoded values to config/env (S3 bucket, rate limits, JWT expiry)

### 2.3 - Add feed pagination
- Cursor-based pagination (currently hardcoded LIMIT 50)
- Add index on `posts.created_at`

## Phase 3: Resume Feature Development (only after 0-2 complete)

- Following/friends feed (follows table already exists in DB)
- Profile editing
- Notifications
- Search improvements
- Each feature: write tests -> implement -> verify locally with Playwright -> deploy

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
| Low test coverage (frontend) | `src-refactored/src/__tests__/` | Phase 1 |
| `modals.js` is 716 lines | `src-refactored/js/modals.js` | Phase 2.1 |
| Duplicated JWT generation | `woof-backend/src/controllers/authController.ts` | Phase 2.2 |
| Duplicated ownership checks | `woof-backend/src/controllers/` | Phase 2.2 |
| No feed pagination | `woof-backend/src/controllers/postController.ts` | Phase 2.3 |
| Hardcoded S3 bucket name | `woof-backend/src/controllers/uploadController.ts` | Phase 2.2 |
| Mixed console.log/Pino | `woof-backend/src/db/` | Phase 2.2 |
| Missing DB indexes | `posts.created_at`, `follows` | Phase 2.3 |

## Security Notes

- XSS: Use `escapeHTML()` from utils.js for all user content
- File uploads: Validate type and size before upload
- Auth: JWT-based, 7-day expiry, Bearer token header
- Admin endpoints: Protected by `x-admin-secret` header
- NEVER commit `.env` files or secrets
