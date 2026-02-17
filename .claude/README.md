# Woof - Claude Code Instructions

**Last Updated:** 2026-02-17
**Status:** Needs cleanup before further development

## Project Overview

Woof is a dog-centric social network (Instagram for dogs). Dogs are the primary users.

- **Frontend repo**: `/Users/tommikivisaari/Documents/Personal/Projects/Woof` (GitHub: Woof-fi/woof-frontend)
- **Backend repo**: `/Users/tommikivisaari/Documents/Personal/Projects/woof-backend` (GitHub: Woof-fi/woof-backend)
- **Frontend source**: `src-refactored/` is the active directory
- **Tech stack**: Vite + vanilla JS/TS (frontend), Express + PostgreSQL (backend)
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
cd src-refactored && npm test          # Frontend (Vitest, 21 tests)
cd woof-backend && npm test            # Backend (Jest, 81 tests)

# Build
cd src-refactored && npm run build     # Vite build to dist/
```

## MCP Tools Available

- **Playwright MCP**: Browser automation for visual validation. Use `browser_navigate`, `browser_snapshot`, `browser_click` etc. to verify the app works in a real browser. Configured in headed mode (visible Chrome window).

## Git Workflow

- Always push to GitHub after commits. Both repos have remotes configured.
- Frontend: `git push origin main` from `/Users/tommikivisaari/Documents/Personal/Projects/Woof`
- Backend: `git push origin main` from `/Users/tommikivisaari/Documents/Personal/Projects/woof-backend`
- CI runs on push (GitHub Actions: type-check, tests, build)

---

# CLEANUP PLAN (Execute in order)

## Analysis Summary (2026-02-17)

The codebase accumulated technical debt from rapid Phase 2 development. The core problem: every module exists in both `.js` and `.ts` versions that have diverged. The `.js` files are what actually runs, the `.ts` files are dead code. Other issues: dead code, abandoned directories, half-finished SPA conversion, removed middleware, low test coverage (27% frontend).

## Phase 0: Clean Up Foundation (DO THIS FIRST)

### 0.1 - Resolve .js/.ts file duality
The following `.ts` files in `src-refactored/js/` have diverged `.js` counterparts. The `.js` versions are what actually runs. Delete the dead `.ts` files:
- `js/app.ts` (dead - `app.js` is used, plus `app-spa.js` exists)
- `js/auth.ts` (dead - redirects to `index.html` instead of `/`, missing fixes)
- `js/api.ts` (dead - `.js` version is used)
- `js/config.ts` (dead - `.js` version is used)
- `js/utils.ts` (dead - thin wrapper, `.js` has full implementation)
- `js/invite.ts` (dead - no `.js` counterpart imports it)
Keep `types/api.ts` for type documentation.

### 0.2 - Remove dead code and abandoned directories
- Delete `woof-frontend/` directory (abandoned Vite template, never used)
- Delete or archive `src/` directory (original static prototype, superseded by `src-refactored/`)
- Delete `nelli.html`, `map.html`, `store.html` (SPA router handles these now)
- Delete `index-old.html`
- Remove `initFeedTabs()` from `posts.js` (feed tabs were removed but function remains)
- Remove `app-spa.js` OR `app.js` (keep whichever is the real entry point - `app-spa.js` is the SPA version)
- Remove unused utils: `generateSlug()` if unused
- Clean `i18n.js` if it's just a stub
- Update Vite config to single-page (remove multi-page entries for deleted HTML files)

### 0.3 - Fix the build pipeline
- Verify `npm run build` produces working `dist/` output
- Deploy should use `dist/` not raw source sync to S3
- Verify Vite dev server proxies API calls correctly

### 0.4 - Fix backend middleware
- Re-enable `optionalAuth` on feed endpoint in `woof-backend/src/routes/posts.ts`
- Verify `JWT_SECRET` is set in Elastic Beanstalk environment
- Remove or protect admin endpoints (add auth or delete if one-time use)

### 0.5 - Validate with Playwright
- Start dev servers
- Use Playwright MCP to navigate the app
- Verify: home feed loads, login/register works, post creation works, dog profiles work, logout works
- Fix any issues found

## Phase 1: Stabilize Testing

### 1.1 - Frontend test infrastructure
- Set up proper fetch mocking in `setup.ts` with configurable responses
- Add tests for `api.js` (296 lines, 0% coverage) - mock fetch, verify headers, error handling
- Add tests for `auth.js` login/register (async API flows, token storage)
- Add tests for `router.js` (route matching, navigation)
- Target: 60%+ coverage on core modules

### 1.2 - Backend test gaps
- Add tests for admin endpoint authorization
- Add tests for rate limiter behavior
- Add cascade delete tests

### 1.3 - CI gate
- Add coverage threshold to CI (fail below 50%, increase over time)

## Phase 2: Refactor for Maintainability

### 2.1 - Break up modals.js (746 lines)
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
| Duplicate .js/.ts files | `src-refactored/js/` | Phase 0.1 |
| Dead `woof-frontend/` dir | project root | Phase 0.2 |
| Dead `src/` prototype dir | project root | Phase 0.2 |
| Orphan HTML pages (nelli, map, store) | `src-refactored/` | Phase 0.2 |
| `initFeedTabs()` dead code | `posts.js` | Phase 0.2 |
| Feed endpoint missing middleware | `woof-backend/src/routes/posts.ts` | Phase 0.4 |
| Admin routes unprotected | `woof-backend/src/routes/admin.ts` | Phase 0.4 |
| 27% test coverage (frontend) | `src-refactored/src/__tests__/` | Phase 1 |
| `modals.js` is 746 lines | `src-refactored/js/modals.js` | Phase 2.1 |
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
- NEVER commit `.env` files or secrets
