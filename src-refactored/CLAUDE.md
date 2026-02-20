# Woof Frontend - Project Context

## Overview
Vanilla JavaScript SPA for Woof (dog social network). Built with Vite, deployed to S3 (`woofapp.fi`). No framework - plain JS modules with a custom router and view manager.

## Architecture
- **Auth**: AWS Cognito via `amazon-cognito-identity-js` SDK. Frontend handles signup, login, verification, password reset directly with Cognito. After login, calls `POST /api/auth/sync` to create/find the backend user record.
- **Token management**: Cognito ID token stored in `localStorage` as `auth_token`. `getToken()` is synchronous (reads from localStorage). `refreshSession()` refreshes via Cognito SDK on app init.
- **API layer**: `js/api.js` - centralized API calls. Injects `Authorization: Bearer` header using `getToken()`. No changes needed when auth provider changes.
- **Routing**: Custom client-side router in `js/router.js`. Views in `js/views/`.
- **Backend**: `https://api.woofapp.fi` (Express on Elastic Beanstalk)

## Key Files
- `js/auth.js` - Cognito auth (register, confirmRegistration, login, forgotPassword, confirmNewPassword, logout, refreshSession)
- `js/auth-modal.js` - Auth modal with 5 states (login, register, verify, forgot, reset)
- `js/config.js` - App config including Cognito User Pool ID and Client ID
- `js/api.js` - All API calls (dogs, posts, follows, likes, comments, health records, messages, upload)
- `js/app-spa.js` - App entry point, router setup, calls `refreshSession()` on init
- `js/views/` - View components (HomeView, ProfileView, PostDetailView, MessagesView)

## Auth Modal States
The auth modal (`js/auth-modal.js`) handles 5 states:
- **login**: Email + password, "Forgot password?" link
- **register**: Email + password + name, password requirements shown (on submit -> switches to verify)
- **verify**: Verification code + resend link (on submit -> switches to login)
- **forgot**: Email only (on submit -> switches to reset)
- **reset**: Verification code + new password (on submit -> switches to login)

## Cognito Configuration
- User Pool ID: `eu-north-1_99e6Bvwmy`
- Client ID: `2mr6ff413juuaeffjdramib5dk`
- Region: `eu-north-1`
- Password policy: 8+ chars, uppercase, lowercase, number, special character
- Configurable via Vite env vars: `VITE_COGNITO_USER_POOL_ID`, `VITE_COGNITO_CLIENT_ID`

## Build & Deploy
```bash
npm run dev      # Vite dev server
npm run build    # tsc && vite build
npm run deploy   # Build + sync to S3 (s3://woofapp.fi/)
```

## Testing

### Unit Tests (Vitest)
```bash
npm test              # Run all unit tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```
Unit tests are in `src/__tests__/`. They use `happy-dom` as the DOM environment. Auth tests only test the public API (`getToken`, `setCurrentUser`, `getCurrentUser`, `isAuthenticated`). Cognito SDK calls are NOT unit-tested — they're covered by E2E tests.

### E2E Tests (Playwright)
```bash
npm run test:e2e          # Run all E2E tests (headless)
npm run test:e2e:headed   # Run with visible Chrome browser
npm run test:e2e:auth     # Auth tests only
npm run test:e2e:dog      # Dog CRUD tests only
```
E2E tests are in `e2e/`. They run against production (`https://woofapp.fi`) by default, override with `E2E_BASE_URL` env var. Tests create real Cognito users and clean them up after each test using `aws cognito-idp admin-delete-user`.

**Test helpers:**
- `e2e/helpers/cognito.ts` - Cognito admin operations (confirm, delete users via AWS CLI)
- `e2e/helpers/auth.ts` - Register + login shortcut for tests that need an authenticated user

**How auth E2E tests work:**
1. Register via UI form (creates UNCONFIRMED Cognito user)
2. `admin-confirm-sign-up` via AWS CLI (bypasses email verification)
3. Login via UI form
4. Test features
5. `admin-delete-user` in afterEach cleanup

**Requirements:** AWS CLI configured with credentials that can manage the Cognito User Pool.

## Workflow
1. Make code changes
2. Run unit tests: `npm test`
3. Build and deploy: `npm run deploy`
4. Run E2E tests in headed mode: `npm run test:e2e:headed`
5. Verify all tests pass
6. Commit to git

## Environment Variables
Create `.env` for local development:
```
VITE_API_URL=http://localhost:3000
VITE_COGNITO_USER_POOL_ID=eu-north-1_99e6Bvwmy
VITE_COGNITO_CLIENT_ID=2mr6ff413juuaeffjdramib5dk
```

Production uses hardcoded defaults in `js/config.js` (no `.env` needed for S3 deploy).
