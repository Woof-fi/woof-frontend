# Woof Frontend — Project Context

> **Active source directory:** `src-refactored/`
> Full context file: `src-refactored/CLAUDE.md` (read that for details on every module)

---

## Quick Reference

**Stack:** Svelte 5 SPA · Vite · AWS Cognito · S3 presigned uploads
**Live:** [woofapp.fi](https://woofapp.fi) (S3 + Cloudflare)
**Backend:** `https://api.woofapp.fi` (Express on EB, see `../woof-backend/CLAUDE.md`)

## Mandatory Skills — Use These, Not Raw Commands

```
/endpoint   — look up or scaffold a new API call in api.js
/deploy     — build + S3 sync (handles full aws path on Windows)
```

Always use the skills above instead of running `npm run deploy` directly.

## Key Conventions

- **Svelte 5 runes only** — use `$props()`, `$state()`, `$derived()`, `$effect()`. Never Svelte 4 patterns (`writable`, `createEventDispatcher`, `$on`).
- **Callback props** — inter-component events use callback props (e.g. `onopenAuthModal = null`), not `createEventDispatcher`.
- **Auth token** in `localStorage` as `auth_token`; read via `getToken()` from `js/auth.js` (synchronous).
- **All API calls** go through `js/api.js` — never fetch directly from components.
- **State sharing** — use `js/svelte-store.svelte.js` (setAuthUser, setUnreadCount, setCurrentDog) from Svelte components; `js/store.js` for legacy vanilla modules.
- **No `<style>` blocks** — all styles live in `css/styles.css`; design tokens in `css/tokens.css`.
- **XSS safety** — Svelte escapes template interpolations automatically; use `escapeHTML()` from `utils.js` in any remaining vanilla JS `innerHTML` contexts.

## Folder Map

```
src-refactored/
├── index.html              # SPA entry — <div id="app"> only
├── css/
│   ├── tokens.css          # Design tokens (--woof-* namespace, Woof Orange #EF4621)
│   └── styles.css          # All styles (no <style> blocks in components)
├── js/                     # Vanilla JS modules (immutable core + support)
│   ├── api.js              # ALL API calls — never modify from components
│   ├── auth.js             # Cognito token management — never modify
│   ├── config.js           # Cognito IDs + app constants — never modify
│   ├── utils.js            # escapeHTML, timeAgo, isValidFileType, showToast
│   ├── svelte-store.svelte.js  # Svelte 5 $state store (authUser, unreadCount, currentDog)
│   ├── modal-history.js    # pushModalState / popModalState / handleModalPopstate
│   ├── modals.js           # Dispatches window custom events to Svelte modal components
│   ├── navigation.js       # Auth-link DOM sync helper (Svelte Navigation handles the rest)
│   ├── profile.js          # DOM-filling for ProfileView (hybrid approach)
│   ├── profile-follow.js   # Follow/unfollow handlers
│   ├── profile-health.js   # Health records tab
│   ├── profile-social.js   # Followers/following tab
│   ├── search.js           # Dog search (called from Search.svelte)
│   ├── ui.js               # Skeletons, loading states, animateIn, toggleBodyScroll
│   └── onboarding-tour.js  # First-dog onboarding tour
├── src/
│   ├── main.ts             # Entry: mount(App, { target: #app })
│   ├── App.svelte          # App shell: Navigation + Router
│   ├── router/
│   │   └── Router.svelte   # SPA router (pathToRegex, popstate, data-link clicks)
│   ├── components/
│   │   ├── PostCard.svelte         # Post card with optimistic like + comments
│   │   ├── Feed.svelte             # Infinite scroll feed + content gate
│   │   ├── Navigation.svelte       # Header + left panel + bottom nav
│   │   ├── AuthModal.svelte        # 5-state auth modal (login/register/verify/forgot/reset)
│   │   ├── CreatePostModal.svelte  # Post creation with image upload
│   │   ├── CreateDogModal.svelte   # Dog creation form
│   │   ├── EditDogModal.svelte     # Dog profile editing
│   │   ├── HealthRecordModal.svelte # Health record add/edit
│   │   ├── InviteCard.svelte       # Invite prompt shown in feed
│   │   └── Search.svelte           # Search panel
│   └── views/
│       ├── HomeView.svelte         # Tabbed feed (For You / Following)
│       ├── ProfileView.svelte      # Dog profile (hybrid: Svelte scaffold + profile.js fill)
│       ├── PostDetailView.svelte   # Single post view
│       └── MessagesView.svelte     # Two-panel messaging
└── package.json
```

## Deploy

```bash
cd src-refactored
npm run build    # tsc + vite build
npm run deploy   # build + S3 sync (uses full aws path — see package.json)
```

## Testing

```bash
npm test                  # Vitest unit tests (44 tests, 6 suites)
npm run test:e2e:headed   # Playwright E2E against production (always headed)
```

E2E tests create real Cognito users. Cleanup runs automatically via `DELETE /api/auth/me`.
**If cleanup fails**: use SSM via backend CLAUDE.md to remove orphaned users.

## Cognito Config

- User Pool: `eu-north-1_99e6Bvwmy`
- Client ID: `2mr6ff413juuaeffjdramib5dk`
- Region: `eu-north-1`
- Configurable via `VITE_COGNITO_USER_POOL_ID` / `VITE_COGNITO_CLIENT_ID`
