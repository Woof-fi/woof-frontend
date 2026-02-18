# Woof Development Roadmap

**Last Updated:** 2026-02-18
**Current State:** Phase 3 in progress (3.1, 3.2, 3.6 complete).

---

## Completed Phases

### Phase 0: Foundation & Cleanup ✅

- [x] Choose backend framework → **Node.js / Express / TypeScript**
- [x] Choose database → **PostgreSQL** (ADR-001: relational model)
- [x] Choose hosting → **AWS** (Elastic Beanstalk + RDS + S3, eu-north-1)
- [x] Decide on frontend framework → **Vanilla JS + Vite** (SPA)
- [x] Initialize git repositories (frontend + backend)
- [x] Set up CI/CD pipeline (GitHub Actions: type-check, tests, build)
- [x] Design database schema (users, dogs, posts, follows, likes)
- [x] Plan relationships and indexes
- [x] Clean up dead code, orphan files, abandoned directories
- [x] Fix build pipeline (Vite single-page build)
- [x] Validate all flows with Playwright

### Phase 1: Core Backend & Refactoring ✅

- [x] REST API structure with Express
- [x] CRUD operations for dogs, posts, users
- [x] Error handling and Pino logging
- [x] Zod request validation
- [x] User registration & login (bcrypt + JWT)
- [x] Logout functionality
- [x] Session management (JWT, 7-day expiry)
- [x] Dog profile CRUD API
- [x] Photo upload to S3 (presigned URLs)
- [x] Privacy (public vs private data, ownership middleware)
- [x] Refactored modals.js (716 → 48 lines, 4 extracted modules)
- [x] Extracted JWT utility, ownership middleware, env config
- [x] Cursor-based feed pagination with infinite scroll
- [x] 95 backend tests

### Phase 2: Social Features ✅

- [x] Feed with For You / Following tabs
- [x] Follow/unfollow dogs API + UI
- [x] Follower/following counts on profiles
- [x] Like/unlike posts API + UI (optimistic updates)
- [x] Like counts in feed
- [x] Post creation with image + caption
- [x] Clickable post avatars linking to profiles
- [x] Profile editing (edit modal, photo change)
- [x] Create Post validation feedback
- [x] 120 backend tests, 36 frontend tests
- [x] Deployed to production (S3 + EB)

---

## Phase 3: UX Polish + Core Social Features ← NEXT

**Goal:** Close the critical UX gaps so the app feels like a real product.

Full details including visual audit, competitor analysis, and architecture decisions in [ROADMAP.md](/ROADMAP.md).

| # | Task | Effort | Impact | Status |
|---|------|--------|--------|--------|
| 3.1 | Form styling overhaul (universal modal form CSS) | Medium | Very High | ✅ Done |
| 3.2 | Post timestamps ("2 days ago", click-to-toggle) | Small | High | ✅ Done |
| 3.3 | Comments system (backend + frontend) | Large | Very High | Pending |
| 3.4 | Mobile bottom navigation bar | Medium | Very High | Pending |
| 3.5 | Search / Explore page | Medium | High | Pending |
| 3.6 | Profile Posts tab (3-col grid + backend endpoint) | Small | High | ✅ Done |
| 3.7 | Loading skeletons (replace "Loading..." text) | Small | Medium | Pending |
| 3.8 | Image aspect ratio standardization (max 4:5) | Small | Medium | Pending |
| 3.9 | Misc UX fixes (default avatar, remove placeholders) | Small | Medium | Pending |

---

## Phase 4: Engagement & Discovery

- [ ] Notification system (likes, comments, follows)
- [ ] Post detail view / single post page
- [ ] Explore page with popular content
- [ ] Double-tap to like
- [ ] Video post support (15-30s clips)

## Phase 5: Social & Community

- [ ] DMs / Messaging between users
- [ ] User/Owner profile page
- [ ] Multi-pet support (multiple dogs per account)
- [ ] Breed communities / groups
- [ ] Photo contests / weekly challenges

## Phase 6: Utility & Differentiation

- [ ] Health records (vet visits, vaccinations, weight tracking)
- [ ] Gallery tab (photo albums)
- [ ] Friends tab (mutual follows)
- [ ] Location tagging on posts
- [ ] Dog-friendly places directory / map
- [ ] Dog park check-in

## Phase 7: Growth & Infrastructure

- [ ] HTTPS / SSL (ALB + ACM certificate)
- [ ] CloudFront CDN for frontend + media
- [ ] Push notifications (PWA)
- [ ] Stories (24h ephemeral content)
- [ ] Stickers / photo filters
- [ ] Gamification (badges, streaks)
- [ ] Email digest / weekly recap
- [ ] Content moderation tools
- [ ] Social login (Google, Apple)
- [ ] i18n / localization (framework exists)
- [ ] Performance optimization & caching

## Phase 8: Marketplace (Future)

- [ ] Product listings
- [ ] Shopping cart & checkout
- [ ] Payment processing
- [ ] Seller/buyer profiles
- [ ] Reviews and ratings

---

## Architectural Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Backend framework | Express + TypeScript | Familiarity, ecosystem |
| Database | PostgreSQL | Relational data (ADR-001) |
| ORM | None (raw SQL with node-postgres) | Full SQL control (ADR-007) |
| Hosting | AWS EB + RDS + S3 | Low overhead (ADR-002) |
| Auth | JWT + bcrypt | Simple, stateless |
| Frontend | Vanilla JS + Vite SPA | Performance, no framework overhead |
| Testing | Jest (backend), Vitest (frontend) | TDD mandatory (ADR-003) |
| Migrations | Sequential SQL files | Version controlled (ADR-008) |
| Region | eu-north-1 (Stockholm) | Cheapest, lowest latency (ADR-009) |
| Feed | Cursor-based pagination | Efficient for infinite scroll |
| REST vs GraphQL | REST | Simpler for current needs |
| Monolith vs Micro | Monolith | Appropriate for current scale |

---

**Last Updated:** 2026-02-18
