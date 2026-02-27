# Woof Frontend - Project Context

## Overview
Svelte 5 SPA for Woof (dog social network). Built with Vite, deployed to S3 (`woofapp.fi`). Uses Svelte 5 runes exclusively — never Svelte 4 patterns. Vanilla JS modules handle auth, API, and utility concerns; Svelte components own the UI.

## Architecture
- **Auth**: AWS Cognito via `amazon-cognito-identity-js` SDK. Frontend handles signup, login, verification, password reset directly with Cognito. After login, calls `POST /api/auth/sync` to create/find the backend user record. Also called on app init via `syncUser()` in `App.svelte` whenever a valid session is already present (covers page reloads and returning users).
- **Token management**: Cognito ID token stored in `localStorage` as `auth_token`. `getToken()` is synchronous (reads from localStorage). `refreshSession()` refreshes via Cognito SDK on app init (called from `src/main.ts`).
- **API layer**: `js/api.js` — centralized API calls. Injects `Authorization: Bearer` header using `getToken()`. Import directly in Svelte components; never fetch outside this module. Default `cache: 'no-store'`; pass `cache: 'default'` on stable read endpoints (`getDog`, `getDogBySlug`, `getFollowStatus`) to honour backend Cache-Control headers.
- **Routing**: `src/router/Router.svelte` — SPA router using path-to-regex matching, popstate, and data-link click interception. Renders view components based on current path.
- **State store**: `js/svelte-store.svelte.js` — Svelte 5 `$state` rune store for cross-component state (authUser, unreadCount, currentDog). Svelte components import from here.
- **Svelte 5 runes**: Use `$props()`, `$state()`, `$derived()`, `$effect()` exclusively. No `writable`, `createEventDispatcher`, or `$on` — those are Svelte 4.
- **Callback props**: Inter-component events use callback props (e.g., `onopenAuthModal = null` in `$props()`). Call with `onopenAuthModal?.()`.
- **Component styles**: Live in `<style>` blocks inside each `.svelte` file (Svelte scopes them at build time). Global styles (resets, tokens, layout root) live in `css/global.css`. `css/styles.css` is being incrementally decomposed — do not add new styles there; add them to the relevant component's `<style>` block instead.
- **Design system**: Always use `--woof-*` CSS custom properties for all colors, spacing, radius, shadows, and typography. Never hardcode hex values or pixel sizes that have a token equivalent. Brand primary is `--woof-color-brand-primary` (`#C9403F`). Full reference: `docs/design/index.html` and `docs/design/foundations.md`.
- **Backend**: `https://api.woofapp.fi` (Express on Elastic Beanstalk)

## Key Files

### Svelte Entry
- `src/main.ts` — `mount(App, { target: document.getElementById('app')! })` + service worker update detection (auto-reload toast on new SW activation)
- `src/App.svelte` — App shell: imports `Navigation.svelte` + `Router.svelte`, handles auth modal open events
- `src/router/Router.svelte` — SPA router; renders view components

### Svelte Components (`src/components/`)
- `PostCard.svelte` — Post card with optimistic like toggle (reverts on API error), inline comments, fallback images, clickable territory links
- `Feed.svelte` — Infinite scroll (IntersectionObserver sentinel), content gate (4 posts for unauth), invite cards at positions 5/25/45
- `Navigation.svelte` — Header + nav drawer (fixed sidebar on desktop, slide-in on mobile) + bottom nav; 60s unread-count polling; auth-reactive
- `AuthModal.svelte` — 5 modes: login / register / verify / forgot / reset. Mode config as const object, `$derived` active config.
- `CreatePostModal.svelte` — S3 presigned upload, dog select, image preview
- `CreateDogModal.svelte` — Dog creation form with breed autocomplete + territory autocomplete
- `EditDogModal.svelte` — Dog profile editing with territory autocomplete
- `TerritoryAutocomplete.svelte` — Territory search + browse drill-down (municipality → district → sub_district); used in CreateDogModal and EditDogModal
- `BreedAutocomplete.svelte` — Breed search autocomplete
- `HealthRecordModal.svelte` — Health record add/edit with type-specific fields
- `InviteCard.svelte` — Invite prompt card for feed
- `Search.svelte` — Search panel
- `Toast.svelte` — Renders toast notifications from `js/toast-store.svelte.js`
- `PostOptionsSheet.svelte` — Instagram-style bottom action sheet (own post: delete/share; others: report/bookmark/follow); multi-view: options → report → confirm-delete
- `CommentOptionsSheet.svelte` — Action sheet for comments (own: delete with confirm; others: report)

### Svelte Views (`src/views/`)
- `HomeView.svelte` — Tabbed feed (For You / Following); tab switch triggers Feed re-render
- `ProfileView.svelte` — Full Svelte 5: fetches dog, posts, follow status, friends, health records; calls openEditDogModal/openHealthRecordModal from modal-store
- `PostDetailView.svelte` — Single post view
- `MessagesView.svelte` — Two-panel messaging with 10s polling
- `NotificationsView.svelte` — Notification feed at `/notifications`; marks all read on visit; 60s polling via Navigation bell badge
- `AdminView.svelte` — Moderation panel with two sections: Reports (filter tabs pending/reviewed/actioned/dismissed; delete, mark reviewed, dismiss) and Flagged (Rekognition AI-flagged posts; approve or remove)
- `PrivacyView.svelte` — GDPR Privacy Policy at `/privacy`
- `TerritoryView.svelte` — Territory page with hero image, breadcrumb nav, stats, child territories grid, Posts/Dogs tabs; SEO-friendly nested URLs (`/territory/helsinki/oulunkyla/patola`)
- `TermsView.svelte` — Terms of Service at `/terms`

### Vanilla JS (stable core — modify only to add new API functions or utility helpers)
- `js/api.js` — All API calls (add new endpoint functions here; never call fetch directly from components)
- `js/auth.js` — Cognito token management
- `js/config.js` — App config + Cognito IDs
- `js/utils.js` — escapeHTML, timeAgo, isValidFileType, showToast, imageVariant

### Vanilla JS (support modules)
- `js/svelte-store.svelte.js` — Svelte 5 `$state` store (authUser, unreadCount, currentDog + version signals dogVersion/feedVersion/profileVersion/healthVersion)
- `js/modal-store.svelte.js` — Svelte 5 `$state` store for all modal/panel visibility and data; open*/close* functions replace old window custom events
- `js/modal-history.js` — pushModalState / popModalState / handleModalPopstate (browser history for back-button modal close)
- `js/toast-store.svelte.js` — Svelte 5 `$state` toast list; showToast() used via delegation from utils.js
- `js/ui.js` — Skeletons, loading states, animateIn, toggleBodyScroll
- `js/onboarding-tour.js` — First-dog onboarding tour

### Dead code (descoped, do not import)
- `js/cart-modal.js` — E-commerce feature, abandoned
- `js/i18n.js` — i18n stub, English-only
- `js/auth-modal.js` — Legacy DOM-based auth modal; auth is now fully in `AuthModal.svelte`

## Auth Modal States
`src/components/AuthModal.svelte` handles 5 modes via a single `mode` `$state`:
- **login**: Email + password, "Forgot password?" link
- **register**: Email + password + name → on submit switches to verify
- **verify**: Verification code + resend link → on submit switches to login
- **forgot**: Email only → on submit switches to reset
- **reset**: Verification code + new password → on submit switches to login

## Svelte 5 Patterns

### Props
```js
let { id = '', username = '', onopenAuthModal = null } = $props();
```

### State
```js
let liked = $state(false);
let count = $state(0);
```

### Derived
```js
let label = $derived(liked ? 'Unlike' : 'Like');
```

### Effects
```js
$effect(() => {
    // runs after every render where dependencies changed
});
```

### Callback props (NOT createEventDispatcher)
```svelte
<!-- Parent -->
<PostCard onopenAuthModal={() => authModal.open()} />

<!-- Child PostCard -->
let { onopenAuthModal = null } = $props();
onopenAuthModal?.();
```

## Cognito Configuration
- User Pool ID: `eu-north-1_99e6Bvwmy`
- Client ID: `2mr6ff413juuaeffjdramib5dk`
- Region: `eu-north-1`
- Password policy: 8+ chars, uppercase, lowercase, number, special character
- Email sending: via Amazon SES (from `noreply@woofapp.fi`)
- Configurable via Vite env vars: `VITE_COGNITO_USER_POOL_ID`, `VITE_COGNITO_CLIENT_ID`

## Build & Deploy
```bash
npm run dev      # Vite dev server (needs backend running on :3000 or VITE_API_URL set)
npm run build    # tsc --noEmit && vite build
npm run deploy   # build + S3 sync (s3://woofapp.fi/)
```

**PWA:** Configured in `vite.config.ts` via `vite-plugin-pwa` (`generateSW` strategy). Icons committed to `assets/icons/` (apple-touch-icon, icon-192x192, icon-512x512) — these are source-controlled and copied to `dist/icons/` on build. Service worker precaches app shell; runtime-caches CDN images with CacheFirst 7 days. Meta tags added to `index.html`. `.gitignore` has `!src-refactored/assets/icons/*.png` exception to preserve them past the global `*.png` ignore rule.

## Testing

### Unit Tests (Vitest)
```bash
npm test              # Run all unit tests (90 tests, 7 suites)
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```
Unit tests in `src/__tests__/`. Use `happy-dom`. Component tests use `@testing-library/svelte`.

**Critical vitest.config.ts settings:**
- `plugins: [svelte()]` — required to compile `.svelte` files
- `resolve: { conditions: ['browser'] }` — prevents Svelte resolving to its SSR/server build
- `environment: 'happy-dom'`

**Test mock patterns:**
- Mock `../../../js/api.js` and `../../../js/auth.js` with `vi.mock()`
- Use `mockReturnValue(false)` (not `mockReturnValueOnce`) when a component calls `isAuthenticated()` both during render AND in an event handler — `Once` is consumed at render time

### E2E Tests (Playwright)
```bash
npm run test:e2e          # Run all E2E tests (headless)
npm run test:e2e:headed   # Run with visible Chrome browser (preferred)
npm run test:e2e:auth     # Auth tests only
npm run test:e2e:dog      # Dog CRUD tests only
npx playwright test e2e/posts.spec.ts --headed  # Posts tests only
```
E2E tests run against production (`https://woofapp.fi`) by default. Override with `E2E_BASE_URL`.
**Always run E2E in headed mode** so you can observe failures.

**Test helpers:**
- `e2e/helpers/cognito.ts` — Cognito admin operations via AWS CLI
- `e2e/helpers/auth.ts` — Register + login shortcut

**afterEach cleanup order:**
1. `DELETE /api/auth/me` — cascades all DB records (dogs, posts, etc.)
2. `admin-delete-user` via AWS CLI — removes Cognito user

**Multi-user tests (e.g. author + viewer):** Use an `extraCleanup` array at describe scope. Push `{ user, token }` immediately after `loginUser()` — before any assertions — so `afterEach` can clean up even when tests fail mid-run. See `e2e/posts.spec.ts` for the pattern.

## Workflow
1. Make code changes in `src/`
2. Run unit tests: `npm test`
3. If backend changes: deploy backend first
4. Build and deploy frontend: `npm run deploy`
5. Run E2E tests: `npm run test:e2e:headed`
6. Commit to git and push

## Environment Variables
Create `.env` for local development:
```
VITE_API_URL=http://localhost:3000
VITE_COGNITO_USER_POOL_ID=eu-north-1_99e6Bvwmy
VITE_COGNITO_CLIENT_ID=2mr6ff413juuaeffjdramib5dk
```
Production uses hardcoded defaults in `js/config.js`.

## Infrastructure Notes
- **S3 bucket** `woof-prod-photos`: No public access — photos served exclusively via CloudFront CDN (`cdn.woofapp.fi`). Uploads via presigned PUT URLs only.
- **Source maps**: Disabled in production (`vite.config.ts`: `sourcemap: false`).
- **SES**: Domain `woofapp.fi` verified in SES (eu-north-1). MAIL FROM: `mail.woofapp.fi`.
