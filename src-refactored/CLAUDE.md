# Woof Frontend - Project Context

## Overview
Svelte 5 SPA for Woof (dog social network). Built with Vite, deployed to S3 (`woofapp.fi`). Uses Svelte 5 runes exclusively — never Svelte 4 patterns. Vanilla JS modules handle auth, API, and utility concerns; Svelte components own the UI.

## Architecture
- **Auth**: AWS Cognito via `amazon-cognito-identity-js` SDK. Frontend handles signup, login, verification, password reset directly with Cognito. After login, calls `POST /api/auth/sync` to create/find the backend user record.
- **Token management**: Cognito ID token stored in `localStorage` as `auth_token`. `getToken()` is synchronous (reads from localStorage). `refreshSession()` refreshes via Cognito SDK on app init (called from `src/main.ts`).
- **API layer**: `js/api.js` — centralized API calls. Injects `Authorization: Bearer` header using `getToken()`. Import directly in Svelte components; never fetch outside this module.
- **Routing**: `src/router/Router.svelte` — SPA router using path-to-regex matching, popstate, and data-link click interception. Renders view components based on current path.
- **State store**: `js/svelte-store.svelte.js` — Svelte 5 `$state` rune store for cross-component state (authUser, unreadCount, currentDog). Svelte components import from here.
- **Svelte 5 runes**: Use `$props()`, `$state()`, `$derived()`, `$effect()` exclusively. No `writable`, `createEventDispatcher`, or `$on` — those are Svelte 4.
- **Callback props**: Inter-component events use callback props (e.g., `onopenAuthModal = null` in `$props()`). Call with `onopenAuthModal?.()`.
- **No `<style>` blocks**: All CSS lives in `css/styles.css`. Design tokens in `css/tokens.css`. Only add `<style>` if a style genuinely can't live in `styles.css`.
- **Backend**: `https://api.woofapp.fi` (Express on Elastic Beanstalk)

## Key Files

### Svelte Entry
- `src/main.ts` — `mount(App, { target: document.getElementById('app')! })`
- `src/App.svelte` — App shell: imports `Navigation.svelte` + `Router.svelte`, handles auth modal open events
- `src/router/Router.svelte` — SPA router; renders view components

### Svelte Components (`src/components/`)
- `PostCard.svelte` — Post card with optimistic like toggle (reverts on API error), inline comments, fallback images
- `Feed.svelte` — Infinite scroll (IntersectionObserver sentinel), content gate (4 posts for unauth), invite cards at positions 5/25/45
- `Navigation.svelte` — Header + left-panel + bottom nav; 60s unread-count polling; auth-reactive
- `AuthModal.svelte` — 5 modes: login / register / verify / forgot / reset. Mode config as const object, `$derived` active config.
- `CreatePostModal.svelte` — S3 presigned upload, dog select, image preview
- `CreateDogModal.svelte` — Dog creation form
- `EditDogModal.svelte` — Dog profile editing
- `HealthRecordModal.svelte` — Health record add/edit with type-specific fields
- `InviteCard.svelte` — Invite prompt card for feed
- `Search.svelte` — Search panel (delegates to `js/search.js` for rendering)

### Svelte Views (`src/views/`)
- `HomeView.svelte` — Tabbed feed (For You / Following); tab switch triggers Feed re-render
- `ProfileView.svelte` — Hybrid: Svelte scaffold HTML + `profile.js` DOM-fill (intentional; profile.js will be migrated in a future pass)
- `PostDetailView.svelte` — Single post view
- `MessagesView.svelte` — Two-panel messaging with 10s polling

### Vanilla JS (immutable core — never modify these 4)
- `js/api.js` — All API calls
- `js/auth.js` — Cognito token management
- `js/config.js` — App config + Cognito IDs
- `js/utils.js` — escapeHTML, timeAgo, isValidFileType, showToast

### Vanilla JS (support modules)
- `js/svelte-store.svelte.js` — Svelte 5 `$state` store (cross-component state)
- `js/modal-history.js` — pushModalState / popModalState / handleModalPopstate (browser history for back-button modal close)
- `js/modals.js` — Dispatches `window` custom events that Svelte modal components listen to (e.g. `open-auth-modal`)
- `js/navigation.js` — Auth-link DOM sync helper; Navigation.svelte handles nav rendering
- `js/profile.js` — DOM-filling for ProfileView (follow, tabs, health records)
- `js/profile-follow.js` — Follow/unfollow handlers
- `js/profile-health.js` — Health records tab
- `js/profile-social.js` — Followers/following tab
- `js/search.js` — Dog search rendering
- `js/ui.js` — Skeletons, loading states, animateIn, toggleBodyScroll
- `js/onboarding-tour.js` — First-dog onboarding tour

### Dead code (descoped, do not import)
- `js/cart-modal.js` — E-commerce feature, abandoned
- `js/i18n.js` — i18n stub, English-only

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
npm run deploy   # build + S3 sync (s3://woofapp.fi/) — uses full aws path on Windows
```

## Testing

### Unit Tests (Vitest)
```bash
npm test              # Run all unit tests (44 tests, 6 suites)
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
```
E2E tests run against production (`https://woofapp.fi`) by default. Override with `E2E_BASE_URL`.
**Always run E2E in headed mode** so you can observe failures.

**Test helpers:**
- `e2e/helpers/cognito.ts` — Cognito admin operations via AWS CLI
- `e2e/helpers/auth.ts` — Register + login shortcut

**afterEach cleanup order:**
1. `DELETE /api/auth/me` — cascades all DB records
2. `admin-delete-user` via AWS CLI — removes Cognito user

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
- **S3 bucket** `woof-prod-photos`: Public read for viewing photos. Uploads via presigned URLs only.
- **Source maps**: Disabled in production (`vite.config.ts`: `sourcemap: false`).
- **SES**: Domain `woofapp.fi` verified in SES (eu-north-1). MAIL FROM: `mail.woofapp.fi`.
