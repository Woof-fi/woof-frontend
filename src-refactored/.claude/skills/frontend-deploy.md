---
name: frontend-deploy
description: Build and deploy Woof frontend to S3 with full quality pipeline
---

# Deploy Woof Frontend

You are deploying the Woof frontend to S3 (`woofapp.fi`).

**IMPORTANT: Never deploy without explicit user approval.**

**CRITICAL: Every step below is MANDATORY. Do not skip any step. Do not combine steps. Complete each one and confirm it passed before moving to the next. If a step fails, stop and fix it before continuing.**

## Pre-Deployment Pipeline

### 1. Code Review (MANDATORY)
Review all changed files for quality. Use `git diff` to see what changed:
- **Svelte 5 best practices**: $props(), $state(), $derived(), $effect() only — no Svelte 4 patterns
- **CSS modular**: styles in `<style>` blocks (not global files), using `--woof-*` design tokens exclusively (no hardcoded hex/px)
- **Component patterns**: callback props (not dispatch), proper {#key} blocks for FA icon swaps (ONLY when icons swap, NOT when same icon stays rendered)
- **API calls**: all through `js/api.js`, never direct fetch
- **Accessibility**: proper ARIA attributes, focus traps on modals
- **No dead code, console.logs, or TODOs** left behind

### 2. Update/Add Tests (MANDATORY)
Assess whether changes need new or updated tests:
- **Unit tests** (`src/__tests__/`): Add tests for new components/logic, update tests for changed behavior, remove tests for deleted features
- **E2E tests** (`e2e/`): Add E2E coverage for new user-facing flows, update for changed behavior
- Tests should cover both happy path and error cases
- If no tests needed, explicitly state why

### 3. Run Unit Tests (MANDATORY)
```bash
cd /c/Users/tommi/Desktop/woof/woof-frontend/src-refactored
npm test
```
All 169+ tests must pass. Report the exact count.

### 4. Build (MANDATORY)
```bash
npm run build
```
Must succeed with no TypeScript or Vite errors. Svelte CSS warnings are acceptable.

### 5. Update Documentation (MANDATORY)
- Update `CLAUDE.md` if new files/components/patterns were added
- Update `MEMORY.md` with current status (test counts, feature summary)
- Update `ROADMAP.md` if a roadmap item was completed
- Update `TESTING.md` if test suites were added
- If no docs needed, explicitly state why

### 6. Commit and Push (MANDATORY)
Commit all changes (including doc updates) and push to GitHub. The deploy script embeds the git commit hash, so the commit must exist before deploying.

### 7. Verify CI Passes (MANDATORY)
Check GitHub Actions status using the credential-based API call pattern from MEMORY.md. The latest commit must show `success`. Do NOT proceed if CI is still running or failed.

### 8. Ask User for Approval (MANDATORY)
Show a summary of:
- What changed (files modified, features added)
- Test results (unit count, pass/fail)
- Build status
- CI status

Then ask: "Ready to deploy to production?"

## Deploy

```bash
npm run deploy
```

This runs `vite build` + `aws s3 sync` to `s3://woofapp.fi/`.

## Verify (MANDATORY)

```bash
npm run verify-deploy
```

Checks that the production JS bundle contains the expected git commit hash.

## Post-Deploy (MANDATORY — do not skip)

### Run E2E Tests Against Production (Desktop + Mobile)
```bash
# This runs BOTH desktop and mobile-chrome projects
npx playwright test --headed
```
E2E tests run against `https://woofapp.fi` by default. Both desktop and mobile viewports must pass. Report exact counts.

### Cloudflare Cache
If changes aren't visible, Cloudflare Worker `woof-spa-router` handles SPA routing (rewrites 404→200). Cache usually clears automatically.

## Rollback

If issues found, redeploy from previous commit:
```bash
git checkout HEAD~1
npm run deploy
git checkout -   # return to latest
```

## Complete When — ALL must be checked

- [ ] Code reviewed for Svelte 5 best practices, CSS modularity, design tokens
- [ ] Tests assessed — added/updated/removed as needed (or explicitly justified why not)
- [ ] All unit tests pass (report exact count)
- [ ] Build succeeds
- [ ] Documentation updated (CLAUDE.md, MEMORY.md, ROADMAP.md as needed)
- [ ] Changes committed and pushed to GitHub
- [ ] CI passes on GitHub (verified via API, not assumed)
- [ ] User approved deployment
- [ ] `npm run deploy` completed
- [ ] `npm run verify-deploy` confirms correct commit
- [ ] E2E tests pass against production (report exact count for desktop + mobile)
- [ ] Site loads at `https://woofapp.fi`

## Lessons Learned

- **Never skip E2E tests** — they catch real production issues that unit tests miss
- **Always verify CI** — don't assume it passes; check via GitHub API
- **Update docs in the same commit** — avoids a second deploy cycle for doc-only changes
- **If deploying both backend + frontend**, deploy backend FIRST (frontend may depend on new API responses)
- **Report exact test counts** — "all tests pass" is not enough; say "169/169 unit, 24/24 E2E"
