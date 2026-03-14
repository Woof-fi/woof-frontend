---
name: frontend-deploy
description: Build and deploy Woof frontend to S3 with full quality pipeline
---

# Deploy Woof Frontend

You are deploying the Woof frontend to S3 (`woofapp.fi`).

**IMPORTANT: Never deploy without explicit user approval.**

## Pre-Deployment Pipeline

### 1. Code Review
Review all changed files for quality:
- **Svelte 5 best practices**: $props(), $state(), $derived(), $effect() only — no Svelte 4 patterns
- **CSS modular**: styles in `<style>` blocks (not global files), using `--woof-*` design tokens exclusively (no hardcoded hex/px)
- **Component patterns**: callback props (not dispatch), proper {#key} blocks for FA icon swaps
- **API calls**: all through `js/api.js`, never direct fetch
- **Accessibility**: proper ARIA attributes, focus traps on modals
- **No dead code, console.logs, or TODOs** left behind

### 2. Update/Add Tests
Assess whether changes need new or updated tests:
- **Unit tests** (`src/__tests__/`): Add tests for new components/logic, update tests for changed behavior, remove tests for deleted features
- **E2E tests** (`e2e/`): Add E2E coverage for new user-facing flows, update for changed behavior
- Tests should cover both happy path and error cases

### 3. Run Unit Tests
```bash
cd C:\Users\tommi\Desktop\woof\woof-frontend\src-refactored
npm test
```
All 160+ tests must pass.

### 4. Build
```bash
npm run build
```
Must succeed with no TypeScript or Vite errors.

### 5. Update Documentation
- Update `CLAUDE.md` if new files/components/patterns were added
- Update `MEMORY.md` with current status (test counts, feature summary)
- Update any other relevant docs

### 6. Commit and Push
Commit all changes and push to GitHub. The deploy script embeds the git commit hash, so the commit must exist before deploying.

### 7. Verify CI Passes
Check GitHub Actions status using the `gh` CLI or credential-based API call pattern from MEMORY.md. All checks must pass.

### 8. Ask User for Approval
Show test/build results and ask: "Ready to deploy to production?"

## Deploy

```bash
npm run deploy
```

This runs `vite build` + `aws s3 sync` to `s3://woofapp.fi/`.

## Verify

```bash
npm run verify-deploy
```

Checks that the production JS bundle contains the expected git commit hash.

## Post-Deploy

### Run E2E Tests Against Production (Desktop + Mobile)
```bash
# Desktop viewport (default)
npm run test:e2e:headed

# Mobile viewport
npx playwright test --headed --project=mobile-chrome
```
E2E tests run against `https://woofapp.fi` by default. Both desktop and mobile viewports must pass.

### Cloudflare Cache
If changes aren't visible, Cloudflare Worker `woof-spa-router` handles SPA routing (rewrites 404→200). Cache usually clears automatically.

## Rollback

If issues found, redeploy from previous commit:
```bash
git checkout HEAD~1
npm run deploy
git checkout -   # return to latest
```

## Complete When

- [ ] Code reviewed for Svelte 5 best practices, CSS modularity, design tokens
- [ ] Tests added/updated/removed as needed (unit + E2E)
- [ ] All unit tests pass
- [ ] Build succeeds
- [ ] Documentation updated (CLAUDE.md, MEMORY.md)
- [ ] Changes committed and pushed to GitHub
- [ ] CI passes on GitHub
- [ ] User approved deployment
- [ ] `npm run deploy` completed
- [ ] `npm run verify-deploy` confirms correct commit
- [ ] E2E tests pass against production (desktop viewport)
- [ ] E2E tests pass against production (mobile viewport)
- [ ] Site loads at `https://woofapp.fi`
