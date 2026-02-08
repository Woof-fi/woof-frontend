# Woof Startup Plan 🚀

**Status:** Startup mode - seeking developer commitment and preparing for funding
**Updated:** 2026-02-07

---

## Executive Summary

**What:** Dog health diary and tracking app that helps pet owners manage their dog's health records, appointments, and milestones.

**Why:** Pet owners lack a simple, dedicated tool to track vet visits, vaccinations, medications, and health history. This creates real problems when switching vets, traveling, or managing chronic conditions.

**Market Opportunity:**
- 50M+ dogs in Europe
- Growing pet care spending (€40B+ in Europe annually)
- Digital health tracking trend
- Underserved market (existing pet apps are fragmented)

**MVP Strategy:** Start with health diary core, add social features later.

**Team:**
- Tommi Kivisaari (Product Lead - PM since 2016, Lead PM at Oikotie)
- [Developer name] (Tech Lead - top developer in Finland)

**Ask:** Pre-seed funding for 12-18 month runway to build MVP and acquire first 10K users.

---

## Table of Contents
1. [Product Vision](#product-vision)
2. [Technical Architecture](#technical-architecture)
3. [MVP Scope](#mvp-scope)
4. [Development Timeline](#development-timeline)
5. [Go-to-Market Strategy](#go-to-market-strategy)
6. [Business Model](#business-model)
7. [Competitive Analysis](#competitive-analysis)
8. [Team & Roles](#team-roles)
9. [Funding Requirements](#funding-requirements)
10. [Risks & Mitigations](#risks-mitigations)

---

## Product Vision

### The Problem
Pet owners struggle to:
- Remember vaccination schedules
- Track medication doses
- Keep vet visit history organized
- Share health records with new vets
- Monitor weight and growth
- Remember when they last treated for fleas/ticks

**Current "solutions":**
- Paper records (lost, damaged, disorganized)
- Notes in phone (unstructured, no reminders)
- Spreadsheets (cumbersome, not mobile-friendly)
- Generic health apps (not pet-specific)

### The Solution
**Woof: Your dog's digital health diary**

A mobile-first app that:
- Tracks all health records in one place
- Sends smart reminders
- Generates shareable health reports for vets
- Provides health insights and trends
- Connects with veterinary clinics (future)

### Long-term Vision
Phase 1: Health diary (MVP)
Phase 2: Social features (dog profiles, friends)
Phase 3: Territory/local discovery
Phase 4: Marketplace and services
Phase 5: Veterinary platform integration

---

## Technical Architecture

### Recommended Stack

#### Cloud Platform: **AWS** ✅
**Why AWS over GCP:**
- ✅ More mature services ecosystem
- ✅ Better documentation and community
- ✅ Easier to find AWS-experienced developers
- ✅ Better startup credits program (AWS Activate)
- ✅ Superior mobile backend services (Amplify)
- ✅ More comprehensive auth options (Cognito)

**AWS Services to use:**
- **Compute:** AWS Lambda + API Gateway (serverless) or ECS (containerized)
- **Database:** RDS (PostgreSQL) for structured data
- **Storage:** S3 for images/files
- **Auth:** Amazon Cognito (Google login, Apple login, email)
- **Push Notifications:** SNS + Firebase Cloud Messaging
- **CDN:** CloudFront
- **Monitoring:** CloudWatch
- **Email:** SES (reminders, notifications)

#### Frontend Framework: **React Native** ✅
**Why React Native:**
- ✅ Single codebase for iOS + Android
- ✅ Fast development
- ✅ Excellent performance for this use case
- ✅ Huge ecosystem and community
- ✅ Web version possible (React Native Web)
- ✅ Easy to find React Native developers
- ✅ TypeScript support

**Alternative considered:** Flutter - Also good, but smaller talent pool in Finland

**NOT Angular:** Angular is overkill for mobile-first apps, better for enterprise web apps

#### Backend: **Node.js + TypeScript + Express** ✅
**Why:**
- ✅ JavaScript everywhere (frontend and backend)
- ✅ Fast development
- ✅ Great AWS integration
- ✅ Large developer pool
- ✅ Excellent for APIs
- ✅ TypeScript adds safety

**Architecture:** RESTful API (GraphQL could be added later if needed)

#### Database: **PostgreSQL (AWS RDS)** ✅
**Why:**
- ✅ Relational data (users, dogs, health records)
- ✅ ACID compliance (important for health data)
- ✅ Great for reporting and analytics
- ✅ Mature and reliable
- ✅ Built-in JSON support for flexible fields

#### Authentication: **AWS Cognito** ✅
**Features:**
- Google Sign-In ✅
- Apple Sign-In ✅ (required for iOS)
- Email/password ✅
- Social login management
- MFA support
- User pools and groups

#### Mobile Development: **React Native + Expo** ✅
**Why Expo:**
- ✅ Faster development
- ✅ Easy updates (OTA)
- ✅ Built-in push notifications
- ✅ Simpler build process
- ✅ Can eject if needed

---

## MVP Scope

### MVP = Health Diary Core

**Phase 1 (Months 1-3): Core Health Tracking**

#### Must-Have Features:
1. **Authentication**
   - Sign up with Google
   - Sign up with Apple (required for iOS)
   - Email/password option
   - Profile management

2. **Dog Profiles**
   - Create dog profile (name, breed, birthdate, weight, photo)
   - Edit profile
   - Multiple dogs per account
   - Archive/delete dog

3. **Health Records**
   - Log vet visits (date, clinic, reason, notes, cost)
   - Track vaccinations (type, date, next due date)
   - Medication log (name, dose, frequency, start/end date)
   - Weight tracking (date, weight, chart)
   - General health notes
   - Photo attachments

4. **Reminders**
   - Vaccination reminders
   - Medication reminders
   - Custom reminders (vet appointment, flea treatment, etc.)
   - Push notifications

5. **Timeline View**
   - Chronological view of all health events
   - Filter by type (vet visits, vaccinations, etc.)
   - Search functionality

6. **Export/Share**
   - Generate PDF health report
   - Share via email
   - Print-friendly format

7. **Basic Mobile App**
   - iOS app
   - Android app
   - Responsive design
   - Offline support (view data without internet)

#### Nice-to-Have (if time permits):
- Photo gallery/timeline
- Weight trends and charts
- Health insights ("Next vaccination due in 2 weeks")
- Multi-language (Finnish, English)

#### Explicitly OUT of MVP:
- ❌ Social features (feed, friends, posts)
- ❌ Territory/maps
- ❌ Marketplace/store
- ❌ Messaging
- ❌ Veterinarian accounts (comes in Phase 2)
- ❌ Web admin interface (mobile-first only)

---

## Technical Implementation Plan

### Database Schema (Core Tables)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  cognito_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Dogs
CREATE TABLE dogs (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  breed VARCHAR(255),
  birthdate DATE,
  weight_kg DECIMAL(5,2),
  profile_photo_url TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Vet Visits
CREATE TABLE vet_visits (
  id UUID PRIMARY KEY,
  dog_id UUID REFERENCES dogs(id),
  visit_date DATE NOT NULL,
  clinic_name VARCHAR(255),
  reason TEXT,
  notes TEXT,
  cost_eur DECIMAL(10,2),
  created_at TIMESTAMP
);

-- Vaccinations
CREATE TABLE vaccinations (
  id UUID PRIMARY KEY,
  dog_id UUID REFERENCES dogs(id),
  vaccine_type VARCHAR(255) NOT NULL,
  administered_date DATE NOT NULL,
  next_due_date DATE,
  clinic_name VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP
);

-- Medications
CREATE TABLE medications (
  id UUID PRIMARY KEY,
  dog_id UUID REFERENCES dogs(id),
  medication_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(255),
  frequency VARCHAR(255),
  start_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP
);

-- Weight History
CREATE TABLE weight_records (
  id UUID PRIMARY KEY,
  dog_id UUID REFERENCES dogs(id),
  weight_kg DECIMAL(5,2) NOT NULL,
  measured_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP
);

-- Reminders
CREATE TABLE reminders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  dog_id UUID REFERENCES dogs(id),
  reminder_type VARCHAR(50),
  title VARCHAR(255),
  description TEXT,
  due_date DATE NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  notify_days_before INTEGER DEFAULT 7,
  created_at TIMESTAMP
);

-- Photos
CREATE TABLE photos (
  id UUID PRIMARY KEY,
  dog_id UUID REFERENCES dogs(id),
  s3_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  taken_date DATE,
  created_at TIMESTAMP
);
```

### API Endpoints (MVP)

```
Authentication:
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/google
POST   /api/auth/apple
GET    /api/auth/me
POST   /api/auth/refresh

Dogs:
GET    /api/dogs
POST   /api/dogs
GET    /api/dogs/:id
PUT    /api/dogs/:id
DELETE /api/dogs/:id
POST   /api/dogs/:id/photo

Health Records:
GET    /api/dogs/:id/vet-visits
POST   /api/dogs/:id/vet-visits
PUT    /api/vet-visits/:id
DELETE /api/vet-visits/:id

GET    /api/dogs/:id/vaccinations
POST   /api/dogs/:id/vaccinations
PUT    /api/vaccinations/:id
DELETE /api/vaccinations/:id

GET    /api/dogs/:id/medications
POST   /api/dogs/:id/medications
PUT    /api/medications/:id
DELETE /api/medications/:id

GET    /api/dogs/:id/weight
POST   /api/dogs/:id/weight
DELETE /api/weight/:id

GET    /api/dogs/:id/timeline
GET    /api/dogs/:id/health-report (PDF generation)

Reminders:
GET    /api/reminders
POST   /api/reminders
PUT    /api/reminders/:id
DELETE /api/reminders/:id
POST   /api/reminders/:id/complete
```

### Infrastructure Setup

**Domain:**
- Primary: `woof.fi` (check availability) or `getwoof.com`
- Email: `hello@woof.fi`, `support@woof.fi`

**AWS Account Structure:**
- Development environment
- Staging environment
- Production environment

**CI/CD:**
- GitHub Actions for automated testing and deployment
- Deploy backend to AWS ECS or Lambda
- Deploy mobile apps via Expo EAS

**Monitoring:**
- CloudWatch for logs and metrics
- Sentry for error tracking
- Mixpanel or Amplitude for analytics

---

## Development Timeline

### Month 1: Foundation & Setup
**Weeks 1-2:**
- [ ] Domain purchase and setup
- [ ] AWS account setup and configuration
- [ ] Set up development environments
- [ ] Initialize git repositories (backend, mobile)
- [ ] Database schema design and creation
- [ ] Set up CI/CD pipelines
- [ ] Configure AWS Cognito
- [ ] Design app UI/UX (wireframes, mockups)

**Weeks 3-4:**
- [ ] Build authentication (signup, login, Google, Apple)
- [ ] Backend API structure and base endpoints
- [ ] React Native project setup with Expo
- [ ] Basic navigation structure
- [ ] User profile management

**Milestone 1:** User can sign up, log in, and manage their profile

### Month 2: Core Features
**Weeks 5-6:**
- [ ] Dog profile CRUD (create, read, update, delete)
- [ ] Photo upload to S3
- [ ] Vet visit tracking
- [ ] Vaccination tracking
- [ ] Weight tracking

**Weeks 7-8:**
- [ ] Medication tracking
- [ ] Timeline view
- [ ] Basic reminders system
- [ ] Push notification setup
- [ ] Data export (PDF generation)

**Milestone 2:** Full health diary functionality working

### Month 3: Polish & Launch Prep
**Weeks 9-10:**
- [ ] UI/UX refinement
- [ ] Offline support
- [ ] Error handling and edge cases
- [ ] Performance optimization
- [ ] Security audit
- [ ] GDPR compliance

**Weeks 11-12:**
- [ ] Beta testing (friends and family)
- [ ] Bug fixes
- [ ] App Store submission (iOS)
- [ ] Play Store submission (Android)
- [ ] Marketing materials
- [ ] Landing page
- [ ] Soft launch

**Milestone 3:** MVP launched in app stores

### Month 4-6: Growth & Iteration
- User feedback and iterations
- Add nice-to-have features
- Veterinarian accounts (Phase 2 start)
- Social features (if validated)
- Scale infrastructure as needed

---

## Go-to-Market Strategy

### Target Audience (MVP)
**Primary:** Dog owners who visit vet regularly
- Age: 25-45
- Location: Finland (initial), then Nordics
- Tech-savvy, smartphone users
- Care about their dog's health
- Multiple vet visits per year

**Secondary:** Breeders and dog trainers

### Launch Strategy

**Phase 1: Private Beta (Month 3)**
- 50-100 users (friends, family, dog owner communities)
- Gather feedback
- Iterate quickly

**Phase 2: Public Beta (Month 4)**
- Submit to app stores
- Launch landing page
- Social media presence (Instagram, Facebook)
- Dog owner Facebook groups and forums
- Veterinary clinic partnerships (ask to recommend app)

**Phase 3: Growth (Month 5-12)**
- Content marketing (blog about dog health)
- SEO optimization
- Partnerships with pet stores
- Veterinarian referrals
- Influencer partnerships (pet influencers)
- Paid ads (Facebook, Instagram) if budget allows

### Success Metrics
- 1,000 users by Month 6
- 10,000 users by Month 12
- 30% MAU/DAU ratio
- 10+ health records per active user
- 4.5+ star rating in app stores

---

## Business Model

### Revenue Streams (Prioritized)

**Phase 1 (Months 1-12): Free with ads**
- Free for all users
- Optional non-intrusive ads
- Build user base first
- **Goal:** 10K+ users before monetizing aggressively

**Phase 2 (Year 2): Freemium**
- Free tier: Basic health diary
- Premium tier (€2.99/month or €24.99/year):
  - Unlimited dogs
  - Advanced health insights
  - Priority support
  - Ad-free experience
  - PDF exports with branding

**Phase 3 (Year 2-3): B2B Revenue**
- Veterinarian accounts (€49/month per clinic):
  - Clinic profile page
  - Ability to post health tips
  - Patient management integration
  - Appointment booking
  - Access to anonymized health trends
- Pet insurance partnerships (referral fees)
- Pet pharmacy partnerships

**Phase 4 (Year 3+): Marketplace**
- Commission on services (grooming, training, walking)
- Product sales (commission-based)

### Pricing Strategy
- Start FREE to acquire users
- Premium tier at low price point (€2.99/month)
- B2B pricing higher (€49-99/month)

---

## Competitive Analysis

### Direct Competitors

**1. 11pets.com**
- Established pet health tracker
- Older UI, not mobile-first
- **Our advantage:** Better UX, mobile-first, social features roadmap

**2. PetDesk**
- Focus on vet clinic communication
- **Our advantage:** Owner-centric, better health diary

**3. Pawtrack**
- More focused on GPS tracking
- **Our advantage:** Health diary focus

### Indirect Competitors
- Generic note apps (Notes, Evernote)
- Spreadsheets
- Paper records

### Competitive Advantages
1. **Mobile-first design** - Built for smartphones from day one
2. **Superior UX** - Clean, intuitive, modern
3. **Reminders** - Proactive health management
4. **Social roadmap** - Path to community features
5. **Local focus** - Finnish market first, Nordic expansion
6. **Veterinarian integration** - Future B2B opportunity

---

## Team & Roles

### Core Team

**Tommi Kivisaari - Co-founder, CEO/CPO**
- Product vision and strategy
- PM since 2016, Lead PM at Oikotie Asunnot
- User research and validation
- Fundraising and business development
- Go-to-market strategy

**[Developer Name] - Co-founder, CTO**
- Technical architecture and implementation
- Backend development
- DevOps and infrastructure
- Team building (future)

### Equity Split (Suggested)
- 50/50 split or based on negotiation
- 4-year vesting with 1-year cliff

### Future Hires (Year 1-2)
- Mobile developer (React Native) - Month 6-9
- Designer (UI/UX) - Month 6-9
- Marketing/Growth - Month 9-12
- Backend developer - Month 12-18

---

## Funding Requirements

### Bootstrap Phase (Current)
**Goal:** Build MVP with minimal cost
- Domain: €20/year
- AWS (free tier first year): €0-100/month
- Design tools (Figma): €0-15/month
- Total: <€2,000 for first 3 months

### Pre-Seed Round (Target: €100K-200K)
**Use of funds:**
- Founders' salaries (2 people x 6-12 months): €60K-120K
- First hire (developer or designer): €20K-40K
- Marketing and user acquisition: €10K-20K
- Infrastructure and tools: €5K-10K
- Legal and admin: €5K-10K

**Milestones to raise on:**
- Working MVP ✅
- 1,000+ beta users
- Strong engagement metrics
- Clear path to revenue

### Funding Sources (Finland)
1. **Business Finland** - Startup grants and NIY funding
2. **Icebreaker.vc** - Pre-seed/seed fund in Helsinki
3. **Inventure** - Early stage VC
4. **Superhero Capital** - Nordic early stage
5. **Angel investors** - Leverage Oikotie network
6. **EU grants** - Horizon Europe SME Instrument

### Alternative: Revenue-Based Financing
- Clearbanc, Lighter Capital
- Less dilution, but requires revenue

---

## Risks & Mitigations

### Risk 1: Low user adoption
**Mitigation:**
- Validate with user interviews before building
- Start with pet owner communities
- Partner with vets for distribution
- Focus on one pain point (health diary)

### Risk 2: Competitor launches similar product
**Mitigation:**
- Move fast, launch MVP in 3 months
- Focus on UX differentiation
- Build community and brand
- Social features as moat (later)

### Risk 3: Developer doesn't commit
**Mitigation:**
- Build working prototype yourself (validate demand)
- Clear project plan (this document)
- Equity and vision alignment
- Alternative: Hire contract developer initially

### Risk 4: Regulatory (health data, GDPR)
**Mitigation:**
- GDPR compliance from day one
- Pet health data less regulated than human health
- Privacy policy and terms of service
- Data encryption and security best practices

### Risk 5: Can't monetize free users
**Mitigation:**
- Freemium model proven in pet space
- B2B veterinarian accounts as backup
- Ads as initial revenue
- Keep costs low (serverless architecture)

---

## Next Steps (This Week)

### For Tommi:
1. **[ ] Share this plan with developer** - Get feedback and commitment
2. **[ ] Domain research** - Check woof.fi, getwoof.com, other options
3. **[ ] User validation** - Interview 10 dog owners about health tracking pain
4. **[ ] Research funding** - Business Finland NIY application requirements
5. **[ ] Competitive research** - Test 11pets, PetDesk, others
6. **[ ] Create pitch deck** - For developer and potential funders

### For Developer (once committed):
1. **[ ] AWS account setup** - Apply for AWS Activate credits
2. **[ ] Tech stack validation** - Confirm React Native + Node.js + PostgreSQL
3. **[ ] Architecture planning** - Serverless vs containerized backend
4. **[ ] Database schema review** - Validate the schema above
5. **[ ] Development environment setup** - Local dev, staging, production

### Together:
1. **[ ] Finalize equity split and roles**
2. **[ ] Company formation** - Oy Woof Ltd or similar
3. **[ ] Sign co-founder agreement**
4. **[ ] Set up git repositories**
5. **[ ] Create 3-month sprint plan**
6. **[ ] Design UI mockups** - Use existing prototype as base

---

## Success Criteria

### Month 3 (MVP Launch):
- ✅ Working iOS and Android apps in stores
- ✅ 100+ beta users actively using
- ✅ Core health diary features working
- ✅ Sub-1s API response times
- ✅ 99.9% uptime
- ✅ 4.5+ star rating

### Month 6 (Early Traction):
- ✅ 1,000+ users
- ✅ 50+ active daily users
- ✅ 10+ health records per active user
- ✅ User feedback incorporated
- ✅ Funding secured or revenue started

### Month 12 (Product-Market Fit):
- ✅ 10,000+ users
- ✅ 30%+ MAU/DAU
- ✅ Net Promoter Score >50
- ✅ €5K+ MRR (from premium or B2B)
- ✅ Team expanded to 3-4 people
- ✅ Nordic expansion started

---

## Appendix A: Why React Native over Flutter or Native

### React Native Pros:
- Larger developer pool in Finland
- JavaScript/TypeScript (same as backend)
- Expo speeds up development significantly
- Mature ecosystem
- Great performance for this app type
- Web version possible

### React Native Cons:
- Some native modules need configuration
- Bridge can cause performance issues (rare for this app)

### Flutter Pros:
- Better performance (compiled to native)
- Beautiful UI out of the box
- Google backing

### Flutter Cons:
- Smaller talent pool
- Dart language (different from backend)
- Less mature ecosystem

### Native (Swift/Kotlin) Pros:
- Best performance
- Platform-specific features

### Native Cons:
- 2x development time
- Need iOS AND Android developers
- Higher cost

**Decision: React Native with Expo** ✅

---

## Appendix B: Domain Options

To research and purchase:
1. woof.fi (preferred - Finnish focus)
2. getwoof.com
3. woofapp.com
4. woofhealth.com
5. mywoof.app
6. woofbook.com

Criteria:
- Short and memorable
- Easy to spell
- .fi for Finnish market or .com for global
- Available on App Store and Play Store

---

## Appendix C: Funding Application Checklist

For Business Finland NIY (Tempo) grant:

Required:
- [ ] Company registered in Finland (Oy)
- [ ] Business plan (this document)
- [ ] Financial projections (3 years)
- [ ] Team CVs
- [ ] Proof of own financing (€5K-15K)
- [ ] Market analysis
- [ ] Competitive analysis
- [ ] IP and innovation description
- [ ] Risk analysis

Typical grant: €30K-75K (50-75% of eligible costs)

---

**This is your startup blueprint. Let's build Woof! 🐶🚀**
