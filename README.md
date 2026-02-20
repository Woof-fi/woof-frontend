# Woof - Dog Social Network

A social network where dogs are the main users. Live at [woofapp.fi](https://woofapp.fi).

## Architecture

**Frontend:** Vanilla JS SPA built with Vite, deployed to S3 + Cloudflare (HTTPS, custom domain)
**Backend:** Express + TypeScript + PostgreSQL, deployed on AWS Elastic Beanstalk
**Storage:** S3 for image uploads (presigned URL flow)

### Repos

| Repo | Purpose |
|------|---------|
| `Woof/src-refactored/` | Frontend SPA |
| `woof-backend/` | REST API |

## Features

### Working

- **Feed** - For You + Following tabs, cursor-based pagination, infinite scroll
- **Posts** - Image upload to S3, captions, like/comment/share
- **Post Detail** - Single post view at `/post/:id` with full comment thread
- **Comments** - Threaded comments with pagination
- **Dog Profiles** - Avatar, bio, breed/age/location, posts grid, follower counts
- **Profile Editing** - Edit dog info + profile photo
- **Health Records** - Vet visits, vaccinations, medications, weight tracking with timeline view
- **Search** - Search dogs by name/breed
- **Follow/Unfollow** - Follow dogs, following feed tab
- **Messaging** - Dog-to-dog DMs with conversation list, polling-based
- **Auth** - JWT-based register/login/logout with password requirements
- **SPA Routing** - `/dog/:slug`, `/post/:id`, `/messages`, deep linking
- **Mobile** - Instagram-style bottom nav, responsive layout
- **Loading Skeletons** - Shimmer cards during feed/profile loading

### Infrastructure

- **Domain:** woofapp.fi via Cloudflare (free tier SSL/DNS)
- **Frontend:** S3 static hosting (`npm run deploy`)
- **Backend:** Elastic Beanstalk (eu-north-1)
- **Database:** RDS PostgreSQL
- **Images:** S3 presigned URL uploads (`woof-prod-photos` bucket)

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
npm test             # Jest (183 tests)
eb deploy            # Deploy to Elastic Beanstalk
```

## Project Structure

```
Woof/src-refactored/
├── index.html              # Main SPA entry point
├── css/styles.css          # All styles
├── js/
│   ├── app-spa.js          # SPA bootstrap + route registration
│   ├── router.js           # Client-side router
│   ├── api.js              # All API calls
│   ├── auth.js             # JWT token management
│   ├── posts.js            # Feed rendering, likes, comments
│   ├── profile.js          # Dog profile page + health records
│   ├── navigation.js       # Sidebar + bottom nav
│   ├── search.js           # Search panel
│   ├── views/
│   │   ├── HomeView.js     # Feed view
│   │   ├── ProfileView.js  # Dog profile view
│   │   ├── PostDetailView.js # Single post view
│   │   └── MessagesView.js # DM conversations
│   ├── *-modal.js          # Auth, create post/dog, edit dog, health record modals
│   └── utils.js            # Shared utilities
└── package.json

woof-backend/
├── src/
│   ├── app.ts              # Express app setup
│   ├── routes/             # Route definitions
│   ├── controllers/        # Request handlers
│   ├── middleware/          # Auth, validation, rate limiting
│   ├── schemas/            # Zod validation schemas
│   ├── db/
│   │   ├── pool.ts         # PostgreSQL connection
│   │   └── migrations/     # SQL migrations (001-012)
│   └── __tests__/          # Jest test suites
└── package.json
```

## API Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/register` | - | Register |
| POST | `/api/auth/login` | - | Login |
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

- **Backend:** 183 tests across 11 suites (Jest) - auth, posts, dogs, comments, likes, follows, health records, messaging, uploads
- **Frontend:** Vitest with happy-dom

## Next Up

See `ROADMAP.md` for detailed plans. Key upcoming features:

- **Post Detail View** - Shareable post URLs with full comment thread
- **Breed Communities** - Browse/join breed-based communities with breed-filtered feeds
- **Dog-friendly Places** - Map with dog parks, vets, pet stores (Leaflet + OpenStreetMap)
- **Dog Park Check-in** - Check in at places, see who's there
- **CDN + image processing** - CloudFront at `cdn.woofapp.fi`, Sharp for resize/compress/WebP

## License

Personal project - UNLICENSED
