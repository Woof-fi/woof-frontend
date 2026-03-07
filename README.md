# Woof - Dog Social Network

A social network where dogs are the main users. Live at [woofapp.fi](https://woofapp.fi).

## Architecture

**Frontend:** Svelte 5 SPA built with Vite, deployed to S3 + Cloudflare (HTTPS, custom domain)
**Backend:** Express + TypeScript + PostgreSQL, deployed on AWS Elastic Beanstalk
**Storage:** S3 for image uploads (presigned URL flow)

### Repos

| Repo | Purpose |
|------|---------|
| `Woof/src-refactored/` | Frontend SPA |
| `woof-backend/` | REST API |

## Design System

A comprehensive design system lives at [`docs/design/`](docs/design/):

| File | Purpose |
|------|---------|
| `index.html` | Interactive reference — all components, tokens, motion |
| `tokens.css` | Production token file (60+ `--woof-` CSS custom properties) |
| `tokens.json` | W3C Design Token format (Figma/Style Dictionary compatible) |
| `components.md` | Component reference |
| `foundations.md` | Color, typography, spacing |
| `motion.md` | Animation guidelines |
| `patterns.md` | Layout and UX patterns |

**Brand:** Woof Crimson `#C9403F` · Warm cream `#FAFAF8` · `--woof-*` token namespace
The CSS layer uses aliased variables (`--color-primary` → `--woof-color-brand-primary`) so no component CSS had to change.

---

## Features

### Working

- **Personalized Feed** - Following (default) + Discover tabs, cursor-based pagination, infinite scroll
- **Multi-Image Posts** - Up to 5 images per post with swipeable carousel, S3 presigned uploads
- **Post Detail** - Single post view at `/post/:id` with full comment thread
- **Comments** - Threaded comments with pagination
- **Dog Profiles** - Avatar, bio, breed/age/territory, posts grid, follower counts, liker list
- **Profile Editing** - Edit dog info + profile photo + territory
- **Health Records** - Vet visits, vaccinations, medications, weight tracking with timeline view
- **Search** - Search dogs by name/breed
- **Follow/Unfollow** - Follow dogs, following feed tab
- **Messaging** - Dog-to-dog DMs with conversation list, polling-based
- **Auth** - AWS Cognito (email verification, password reset, MFA-ready)
- **SPA Routing** - `/dog/:slug`, `/post/:id`, `/messages`, `/territory/*`, deep linking
- **Mobile** - Instagram-style bottom nav, responsive layout
- **Loading Skeletons** - Shimmer cards during feed/profile loading
- **Notifications** - Bell icon + `/notifications` feed, unread badge, mark-all-read
- **Post/Comment Options** - Action sheets for delete, report, bookmark
- **Moderation** - Admin/moderator report queue at `/admin`, AI image flagging (Rekognition), user banning
- **CDN Images** - CloudFront CDN (`cdn.woofapp.fi`) with `_medium`/`_thumb` variants, responsive srcsets
- **PWA** - Installable app, service worker with CacheFirst CDN strategy
- **Dog Parks** - 662+ parks with search, amenity data, visit logging
- **Territories** - Hierarchical territory directory (municipality/district/sub_district) with feeds
- **Breeds** - Breed directory with feeds and stats
- **Share Pages** - OG meta tags for social media link previews (posts, dogs, parks)

### Infrastructure

- **Domain:** woofapp.fi via Cloudflare (free tier SSL/DNS)
- **Frontend:** S3 static hosting (`npm run deploy`)
- **Backend:** Elastic Beanstalk (eu-north-1)
- **Database:** RDS PostgreSQL
- **Images:** S3 presigned URL uploads (`woof-prod-photos` bucket)
- **CDN:** CloudFront (`cdn.woofapp.fi`) — serves Sharp-resized image variants
- **Lambda:** `woof-image-processor` — S3-triggered Sharp resize (medium 600px, thumb 150px)
- **PWA:** Service worker with CacheFirst CDN strategy, installable on mobile/desktop

## Development

### Frontend

```bash
cd src-refactored
npm install
npm run dev          # Vite dev server
npm run build        # TypeScript check + Vite build
npm run test         # Vitest
npm run deploy       # Build + sync to S3
```

### Backend

```bash
cd ../woof-backend
npm install
npm run dev          # Express dev server with ts-node
npm run build        # Compile TypeScript to dist/
npm test             # Jest (450+ tests)
eb deploy            # Deploy to Elastic Beanstalk
```

## Project Structure

```
docs/design/                    # Design system reference (open index.html in browser)
├── index.html                  # Interactive component/token reference
├── tokens.css                  # Canonical token source (also copied to css/)
└── *.md                        # Foundations, components, motion, patterns

src-refactored/                 # Frontend SPA
├── index.html                  # SPA entry — <div id="app"> only
├── css/
│   ├── tokens.css              # Design tokens (--woof-* namespace, Woof Crimson #C9403F)
│   ├── global.css              # Global styles: @import tokens, :root aliases, body reset
│   └── styles.css              # Barrel file importing feature modules (layout, buttons, etc.)
├── js/                         # Vanilla JS modules (stable core)
│   ├── api.js                  # All API calls — never fetch directly from components
│   ├── auth.js                 # Cognito token management
│   ├── config.js               # Cognito IDs + app constants
│   ├── utils.js                # escapeHTML, timeAgo, showToast, imageVariant
│   ├── icons.js                # Font Awesome SVG icon registry (tree-shaken, ~84 icons)
│   ├── file-handler.js         # Shared file validation + preview
│   ├── svelte-store.svelte.js  # Svelte 5 $state store (authUser, currentDog, etc.)
│   ├── modal-store.svelte.js   # Modal/panel visibility store
│   └── motion.js               # prefers-reduced-motion utility
├── src/
│   ├── main.ts                 # Entry: mount(App, { target: #app })
│   ├── App.svelte              # App shell: Navigation + Router
│   ├── router/Router.svelte    # SPA router (path-to-regex, popstate)
│   ├── components/             # ~25 Svelte components
│   └── views/                  # Page-level views (Home, Profile, Messages, etc.)
└── package.json

woof-backend/                   # REST API
├── src/
│   ├── app.ts                  # Express 5 app setup
│   ├── routes/                 # Route definitions
│   ├── controllers/            # Request handlers
│   ├── middleware/              # Auth, validation, rate limiting
│   ├── schemas/                # Zod validation schemas
│   ├── db/migrations/          # SQL migrations (001-030+)
│   └── __tests__/              # Jest test suites (450+ tests)
└── package.json
```

## API Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/sync` | Cognito token | Sync Cognito user to DB |
| GET | `/api/auth/me` | required | Get current user |
| DELETE | `/api/auth/me` | required | Delete account |
| GET | `/api/posts/feed` | optional | Feed (For You / Following) |
| GET | `/api/posts/:id` | optional | Single post |
| GET | `/api/posts/dog/:dogId` | optional | Dog's posts |
| POST | `/api/posts` | required | Create post |
| DELETE | `/api/posts/:id` | required | Delete post |
| POST | `/api/posts/:id/like` | required | Like/unlike |
| GET/POST | `/api/comments/post/:postId` | varies | Comments |
| GET | `/api/dogs/search` | - | Search dogs |
| GET | `/api/dogs/:idOrSlug` | optional | Dog profile |
| POST | `/api/dogs` | required | Create dog |
| PUT | `/api/dogs/:id` | required | Update dog |
| POST/GET | `/api/dogs/:id/follow` | required | Follow/unfollow |
| GET/POST/PUT/DELETE | `/api/dogs/:dogId/health` | required | Health records |
| GET/POST | `/api/messages/*` | required | Messaging |
| POST | `/api/upload/presigned-url` | required | Get S3 upload URL |

## Tests

- **Backend:** 450+ tests (Jest) — auth, posts, dogs, comments, likes, follows, health records, messaging, admin, slugs, reports, bookmarks, territories, breeds, parks, shares, notifications, feed
- **Frontend:** 160+ tests across 14 files (Vitest) + 12 E2E tests (Playwright)

## Roadmap

See [ROADMAP.md](ROADMAP.md) for the full product roadmap.

## License

Personal project - UNLICENSED
