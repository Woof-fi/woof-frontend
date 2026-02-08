# Woof MVP - Revised Scope

**Based on:** Tommi's clarification - include BOTH health diary AND social features, exclude store

---

## MVP = Social Network + Health Diary (NO Store)

You're right - the original prototype had the right balance! Let's keep the social features that make Woof special.

---

## Core Value Propositions

1. **Dog-centric social network** - Dogs have profiles, make friends, share their lives
2. **Health tracking** - Never forget vet visits, vaccinations, medications
3. **Meetup coordination** - Find dog friends and plan park visits together

---

## MVP Features (Must-Have)

### 1. Authentication & Onboarding ✅
- Sign up with Google
- Sign up with Apple (iOS requirement)
- Email/password option
- Simple onboarding flow
- Create first dog profile during onboarding

### 2. Dog Profiles ✅
**Public info:**
- Name, breed, age, weight
- Profile photo
- Bio/description
- Location (city/neighborhood)
- Dog friends list (visible)

**Private info (owner only):**
- Health records (see section 3)
- Private notes

**Features:**
- Create dog profile
- Edit profile
- Multiple dogs per owner
- Share profile (link or QR code?)

### 3. Health Diary ✅
**Private section of dog profile**

Track:
- **Vet visits** (date, clinic, reason, notes, cost, photos)
- **Vaccinations** (type, date, next due date, reminder)
- **Medications** (name, dose, frequency, start/end date)
- **Weight tracking** (date, weight, chart over time)
- **General health notes** (allergies, conditions, diet)

Features:
- Add health record
- Timeline view of all health events
- Reminders (vaccination due, medication time)
- Export health report (PDF for vet visits)
- Photo attachments

### 4. Social Feed ✅
**The heart of the social experience**

Features:
- Create post (photo + text caption)
- View feed of posts from dog friends
- Like posts
- Comment on posts
- Share posts
- Photo/video support
- Timeline view (chronological for MVP, algorithm later)

Post types:
- Regular post (photo + caption)
- Health milestone ("Got vaccinated today!")
- Meetup invitation ("Who wants to visit the park?")

### 5. Dog Friends ✅
**Core social feature**

Features:
- Send friend request
- Accept/decline friend requests
- View friend list
- Remove friend
- Friend suggestions (based on location, breed, age)
- See friend's profile and posts

### 6. Meetup Coordination ✅
**What makes Woof special - connecting dogs IRL**

Features:
- Create meetup post
  - Location (dog park name or address)
  - Date/time
  - Dogs invited (all friends or select)
- RSVP to meetups
- Meetup feed/calendar
- Reminders before meetup
- Check-in at meetup (photo post)

Simple for MVP:
- Meetups are just special posts
- RSVP via comments or button
- Don't need maps integration yet (just text location)

### 7. Discovery ✅
**Find other dogs nearby**

Features:
- Browse dogs in your city/area
- Filter by breed, age, size
- Send friend request from discovery
- Search by name or breed

Simple for MVP:
- Text-based location (city/neighborhood)
- No maps integration yet
- Basic filters

### 8. Notifications ✅
**Keep users engaged**

Notifications for:
- New friend request
- Friend request accepted
- Someone liked your post
- Someone commented on your post
- Meetup invitation
- Health reminder (vaccination due)
- Medication reminder

Types:
- Push notifications (mobile)
- In-app notifications
- Email (optional, user preference)

### 9. Settings & Privacy ✅
**User control**

Features:
- Profile visibility (public, friends-only, private)
- Notification preferences
- Privacy settings (who can see posts, send requests)
- Block/report users
- Account deletion

### 10. Mobile App Essentials ✅
**Core app features**

- Responsive design (mobile-first)
- Offline viewing (cached data)
- Photo upload from camera or gallery
- Image compression (don't upload huge files)
- Pull to refresh
- Loading states
- Error handling

---

## Explicitly OUT of MVP ❌

### Store/Marketplace
- ❌ Product listings
- ❌ Shopping cart
- ❌ Payments
- ❌ Seller accounts
**Rationale:** Too complex, not core value, monetize differently

### Maps Integration
- ❌ Google Maps for territories
- ❌ GPS check-ins
- ❌ Map view of dogs/meetups
**Rationale:** Nice to have, but MVP can work with text-based locations. Add in v2.

### Advanced Social Features
- ❌ Direct messaging (1-on-1 chat)
- ❌ Group chats
- ❌ Stories/ephemeral content
- ❌ Live video
- ❌ Advanced photo filters
**Rationale:** Keep it simple, focus on posts and meetups

### Veterinarian Accounts
- ❌ Vet clinic profiles
- ❌ Appointment booking
- ❌ Professional features
**Rationale:** B2B features come after consumer adoption

### Gamification
- ❌ Achievements/badges
- ❌ Leaderboards
- ❌ Challenges
**Rationale:** Fun but not essential for MVP

### Territory System
- ❌ Defined territories (parks, neighborhoods)
- ❌ Territory check-ins
- ❌ Territory activity feeds
**Rationale:** Complex, can add post-MVP if users want it

---

## Updated Database Schema

Adding social features to the health diary schema:

```sql
-- Users (existing)
-- Dogs (existing)
-- Vet Visits (existing)
-- Vaccinations (existing)
-- Medications (existing)
-- Weight Records (existing)
-- Reminders (existing)
-- Photos (existing)

-- NEW: Posts (Social Feed)
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  dog_id UUID REFERENCES dogs(id),
  content TEXT,
  image_url TEXT,
  video_url TEXT,
  post_type VARCHAR(50) DEFAULT 'regular', -- regular, milestone, meetup
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- NEW: Post Likes
CREATE TABLE post_likes (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id),
  dog_id UUID REFERENCES dogs(id), -- which dog liked it
  created_at TIMESTAMP,
  UNIQUE(post_id, dog_id) -- can't like twice
);

-- NEW: Post Comments
CREATE TABLE post_comments (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id),
  dog_id UUID REFERENCES dogs(id), -- which dog commented
  user_id UUID REFERENCES users(id), -- the human writing
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP
);

-- NEW: Dog Friends (Relationships)
CREATE TABLE dog_friendships (
  id UUID PRIMARY KEY,
  dog_id_1 UUID REFERENCES dogs(id),
  dog_id_2 UUID REFERENCES dogs(id),
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, declined, blocked
  requester_dog_id UUID REFERENCES dogs(id), -- who sent the request
  created_at TIMESTAMP,
  accepted_at TIMESTAMP,
  UNIQUE(dog_id_1, dog_id_2),
  CHECK (dog_id_1 < dog_id_2) -- ensure no duplicate pairs
);

-- NEW: Meetups
CREATE TABLE meetups (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id), -- meetups are special posts
  location_text VARCHAR(255), -- "Keskuspuisto Dog Park, Helsinki"
  meetup_date TIMESTAMP,
  created_by_dog_id UUID REFERENCES dogs(id),
  created_at TIMESTAMP
);

-- NEW: Meetup RSVPs
CREATE TABLE meetup_rsvps (
  id UUID PRIMARY KEY,
  meetup_id UUID REFERENCES meetups(id),
  dog_id UUID REFERENCES dogs(id),
  status VARCHAR(20) DEFAULT 'going', -- going, maybe, not_going
  created_at TIMESTAMP,
  UNIQUE(meetup_id, dog_id)
);

-- NEW: Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  notification_type VARCHAR(50), -- friend_request, post_like, comment, etc.
  related_dog_id UUID REFERENCES dogs(id), -- which dog is involved
  related_post_id UUID REFERENCES posts(id), -- if related to post
  related_user_id UUID REFERENCES users(id), -- who did the action
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP
);
```

---

## Updated API Endpoints

```
EXISTING:
- Authentication endpoints
- Dog CRUD endpoints
- Health records endpoints (vet visits, vaccinations, medications, weight)
- Reminders endpoints
- Photo upload endpoints

NEW (Social Features):

Posts & Feed:
GET    /api/feed                    # Get feed for current user (friends' posts)
GET    /api/dogs/:id/posts          # Get posts by specific dog
POST   /api/posts                   # Create new post
PUT    /api/posts/:id               # Edit post
DELETE /api/posts/:id               # Delete post
POST   /api/posts/:id/like          # Like a post
DELETE /api/posts/:id/like          # Unlike a post
GET    /api/posts/:id/likes         # Get who liked a post
POST   /api/posts/:id/comments      # Add comment
GET    /api/posts/:id/comments      # Get comments
DELETE /api/comments/:id            # Delete comment

Friends:
GET    /api/dogs/:id/friends        # Get friends list
GET    /api/dogs/:id/friend-requests # Get pending friend requests
POST   /api/dogs/:id/friend-request  # Send friend request
PUT    /api/friend-requests/:id     # Accept/decline request
DELETE /api/friendships/:id         # Remove friend
GET    /api/dogs/:id/friend-suggestions # Suggest friends

Discovery:
GET    /api/discover                # Browse dogs nearby
GET    /api/search?q=husky          # Search dogs

Meetups:
GET    /api/meetups                 # Upcoming meetups
POST   /api/meetups                 # Create meetup
GET    /api/meetups/:id             # Get meetup details
POST   /api/meetups/:id/rsvp        # RSVP to meetup
PUT    /api/meetups/:id/rsvp        # Update RSVP

Notifications:
GET    /api/notifications           # Get notifications
PUT    /api/notifications/:id/read  # Mark as read
PUT    /api/notifications/read-all  # Mark all as read
```

---

## User Flows (MVP)

### 1. Onboarding Flow
1. Download app
2. Sign up (Google/Apple/Email)
3. Create dog profile (name, breed, photo)
4. Allow notifications
5. Find friends (skip or invite)
6. See feed tutorial
7. → Home feed

### 2. Add Dog Friend
1. Discover or search for dog
2. View dog's profile
3. Send friend request
4. (Other user) Receives notification
5. (Other user) Accepts request
6. Now see each other's posts in feed

### 3. Create Post
1. Tap "Create Post" button
2. Take photo or choose from gallery
3. Write caption
4. Post
5. → Appears in friends' feeds

### 4. Plan Meetup
1. Create post (meetup type)
2. Add location text
3. Add date/time
4. Post
5. Friends see it in feed
6. Friends RSVP
7. Reminders sent before meetup

### 5. Log Health Record
1. Go to dog profile
2. Tap "Health" tab (private)
3. Tap "Add record"
4. Choose type (vet visit, vaccination, etc.)
5. Fill in details
6. Save
7. → Reminder created if applicable

---

## Screen List (MVP)

### Authentication
- Login
- Sign up
- Forgot password

### Onboarding
- Welcome
- Create dog profile
- Find friends
- Tutorial

### Main Tabs
- **Feed** (home)
- **Discover** (find dogs)
- **Notifications**
- **Profile** (current user's dogs)

### Feed
- Feed timeline
- Create post modal
- Post detail (comments)

### Dog Profile
- Public profile view
- Edit profile
- Gallery tab
- Friends tab
- Health tab (private)

### Health Diary
- Health timeline
- Add vet visit
- Add vaccination
- Add medication
- Add weight
- Export health report

### Friends
- Friends list
- Friend requests
- Friend suggestions
- Friend profile

### Meetups
- Upcoming meetups
- Create meetup
- Meetup detail
- RSVP list

### Settings
- Account settings
- Privacy settings
- Notification settings
- Help & support

**Total: ~25-30 screens** (reasonable for MVP)

---

## Development Priorities

### Sprint 1 (Weeks 1-2): Foundation
- Auth (signup, login)
- Dog profile CRUD
- Basic navigation

### Sprint 2 (Weeks 3-4): Health Diary
- Vet visits
- Vaccinations
- Medications
- Weight tracking
- Reminders

### Sprint 3 (Weeks 5-6): Social Core
- Create posts
- Feed view
- Like posts
- Comments

### Sprint 4 (Weeks 7-8): Friends & Discovery
- Friend requests
- Friends list
- Discover dogs
- Friend suggestions

### Sprint 5 (Weeks 9-10): Meetups & Polish
- Meetup creation
- RSVP system
- Notifications
- UI polish

### Sprint 6 (Weeks 11-12): Beta & Launch
- Bug fixes
- Performance optimization
- App store submission
- Beta testing

**Total: 12 weeks = 3 months to MVP** ✅

---

## Success Metrics

### Engagement (Core)
- Daily active users (DAU)
- Posts per user per week
- Friend requests sent
- Meetups created/attended

### Health Diary (Core)
- Health records logged per user
- Reminder completion rate
- Export PDF usage

### Social (Core)
- Average friends per dog
- Post engagement rate (likes, comments)
- Meetup RSVP rate

### Retention
- D1, D7, D30 retention
- Weekly active users (WAU)

**Target for Beta:**
- 100 users
- 50 DAU
- 10+ posts/day
- 5+ meetups/week

---

## Why This Scope Works

✅ **Clear value props:** Social + health tracking + meetups
✅ **Realistic timeline:** 3 months with 2 developers
✅ **Differentiated:** Not just another pet tracker OR social network
✅ **Fundable:** Clear user need and monetization path
✅ **Scalable:** Can add maps, territories, store later

This is your MVP. Let's build it! 🐶

---

## Next: Show This to Your Developer

Ask him:
1. Is 3-month timeline realistic?
2. Any concerns about the tech stack?
3. Which features should we prioritize first?
4. When can he start?

Then let's start building! 🚀
