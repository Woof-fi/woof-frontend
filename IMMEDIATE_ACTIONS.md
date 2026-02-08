# Woof - Immediate Action Items

**Goal:** Get developer commitment and start building this week

---

## This Week (Days 1-7)

### Day 1-2: Validation & Planning
**Tommi's tasks:**

1. **[ ] Share STARTUP_PLAN.md with your developer**
   - Send him the comprehensive plan
   - Schedule call to discuss
   - Get his feedback on tech stack
   - Confirm his commitment level

2. **[ ] User validation interviews (5-10 dog owners)**
   - Ask about health tracking pain points
   - Ask about connecting with other dog owners
   - Ask about dog park meetup coordination
   - Validate willingness to pay (€2.99/month)
   - Document findings

3. **[ ] Domain research and purchase**
   - Priority 1: `woof.fi` (check if available)
   - Priority 2: `getwoof.com`
   - Priority 3: `woofapp.com`
   - Check availability here: https://www.fi-domain.fi/
   - **Purchase domain this week** (~€20)

4. **[ ] Create pitch deck** (10-15 slides)
   - Problem
   - Solution
   - Market opportunity
   - Product (show prototype screenshots)
   - Business model
   - Team
   - Ask (funding amount)
   - Use your PM skills from Oikotie!

5. **[ ] Competitive analysis**
   - Download and test: 11pets, PetDesk, Pawtrack
   - Document strengths/weaknesses
   - Identify differentiation opportunities

### Day 3-4: Business Setup
**Both together:**

1. **[ ] Equity and role discussion**
   - Equity split (suggest 50/50 or 60/40)
   - Roles and responsibilities
   - Vesting schedule (4 years, 1 year cliff)
   - IP assignment

2. **[ ] Company formation research**
   - Decide: Form company now or wait until funding?
   - If now: Oy Woof Ltd or similar
   - Get business ID (Y-tunnus)
   - Cost: ~€300-500

3. **[ ] Funding research**
   - Business Finland NIY/Tempo requirements
   - Application deadlines
   - Required documents

### Day 5-7: Technical Setup
**Developer's tasks:**

1. **[ ] AWS account setup**
   - Create AWS account
   - Apply for AWS Activate credits (up to $5K free credits)
   - Link: https://aws.amazon.com/activate/
   - Set up billing alerts

2. **[ ] Development environment**
   - Install React Native + Expo
   - Install Node.js + TypeScript
   - Set up PostgreSQL locally
   - Choose IDE (VS Code recommended)

3. **[ ] Architecture validation**
   - Review database schema in STARTUP_PLAN.md
   - Validate API endpoint structure
   - Decide: Serverless (Lambda) vs ECS?
   - Sketch infrastructure diagram

4. **[ ] Project setup**
   - Create GitHub organization/repo
   - Initialize backend repo (Node.js + TypeScript + Express)
   - Initialize mobile repo (React Native + Expo)
   - Set up ESLint, Prettier
   - Write initial README

**Tommi's tasks:**

1. **[ ] UI/UX design**
   - Use existing prototype as base
   - Create Figma account (free)
   - Design key screens:
     - Onboarding/login
     - Dog profile
     - Health diary entry
     - Social feed
     - Dog friends list
   - Keep it simple and clean

2. **[ ] Write user stories** (PM superpower!)
   - As a dog owner, I want to...
   - Prioritize for MVP
   - Share with developer

---

## Week 2: Start Building

### Backend Foundation
**Developer:**
- [ ] Set up Express.js server
- [ ] Configure AWS Cognito
- [ ] Implement signup/login endpoints
- [ ] Set up PostgreSQL database
- [ ] Create Users and Dogs tables
- [ ] Build basic CRUD API for dogs

### Mobile Foundation
**Developer:**
- [ ] Create Expo project
- [ ] Set up navigation (React Navigation)
- [ ] Build login/signup screens
- [ ] Integrate with Cognito
- [ ] Build dog profile creation screen

**Tommi:**
- [ ] User testing of designs
- [ ] Content writing (copy for app)
- [ ] Feedback to developer
- [ ] Plan next week's priorities

---

## Week 3-4: Core Features

### Health Diary
- [ ] Vet visit logging
- [ ] Vaccination tracking
- [ ] Weight tracking
- [ ] Timeline view
- [ ] Photo uploads to S3

### Social Features
- [ ] Dog friends (add/remove)
- [ ] Basic feed view
- [ ] Post creation (photos + text)

**Goal:** Working prototype you can demo to potential investors

---

## Month 2: MVP Completion

See STARTUP_PLAN.md for detailed timeline.

**Key milestone:** Fully functional MVP ready for beta testing

---

## Month 3: Beta & Funding

- [ ] Private beta with 50-100 users
- [ ] Business Finland NIY application submitted
- [ ] Pitch to angel investors
- [ ] App store submission (iOS + Android)

---

## Critical Decisions This Week

### 1. Domain Name
**Options:**
- woof.fi (Finnish market, .fi extension)
- getwoof.com (global, memorable)
- woofapp.com (clearly an app)

**Decision needed by:** Day 2

### 2. Developer Commitment
**Questions to align on:**
- Full-time or part-time?
- When can he start?
- Salary expectations vs equity?
- His confidence in 3-month MVP timeline?

**Decision needed by:** Day 3

### 3. Company Formation
**Options:**
- Form Oy now (costs €300-500, enables Business Finland application)
- Wait until funding secured
- Build as side project first

**Decision needed by:** Week 2

### 4. Tech Stack Final Confirmation
**Proposed:**
- Frontend: React Native + Expo ✅
- Backend: Node.js + TypeScript + Express ✅
- Database: PostgreSQL (AWS RDS) ✅
- Cloud: AWS ✅
- Auth: AWS Cognito ✅

**Decision needed by:** Day 5 (developer confirms)

---

## Resources to Set Up

### Tools & Services (Week 1)

**Required:**
- [ ] Domain (€20/year)
- [ ] GitHub organization (free)
- [ ] Figma account (free)
- [ ] AWS account (free tier first year)

**Nice to have:**
- [ ] Notion or Linear for project management
- [ ] Slack or Discord for team communication
- [ ] Google Workspace (email @woof.fi)

**Wait until funded:**
- Paid analytics (Mixpanel, Amplitude)
- Paid monitoring (Datadog, New Relic)
- Design tools beyond Figma

### Funding Application Prep

**For Business Finland NIY (start researching):**
- [ ] Company registration (required)
- [ ] Business plan (STARTUP_PLAN.md ✅)
- [ ] Financial projections (create in Week 2)
- [ ] CVs for both co-founders
- [ ] Proof of own financing (€5K-15K)

Typical timeline: 2-3 months from application to decision

---

## Key Metrics to Track (Once Live)

Start simple, add more later:
- Number of users
- Number of dogs created
- Number of health records logged
- Daily active users
- Retention (D1, D7, D30)

**Tool:** Start with AWS CloudWatch, add analytics later

---

## Communication Plan

### With Developer:
- Daily standups (15 min) or async updates
- Weekly planning sessions
- Shared task board (GitHub Projects or Linear)
- Code reviews on all PRs

### With Users (Beta):
- Weekly feedback surveys
- In-app feedback button
- Beta tester Telegram/WhatsApp group
- Monthly video calls with engaged users

---

## Budget (First 3 Months - Bootstrap)

**Minimal Costs:**
- Domain: €20
- AWS: €0-50/month (free tier)
- Design tools: €0 (Figma free)
- **Total: ~€200**

**If form company:**
- Company registration: €300-500
- Accounting: €50-100/month
- **Total: ~€800-1200**

**No salaries yet** - equity only until funding secured

---

## Success Criteria (Week 1)

By end of this week, you should have:
- ✅ Developer committed (or clear next steps)
- ✅ Domain purchased
- ✅ 5-10 user interviews completed
- ✅ Tech stack confirmed
- ✅ AWS account created
- ✅ Git repos initialized
- ✅ Basic UI designs done
- ✅ Pitch deck drafted

**If you have all of above → you're ready to build! 🚀**

---

## Red Flags to Watch For

🚩 Developer not responding to plan
🚩 User interviews show no interest in health diary
🚩 Domain name unavailable and can't find alternative
🚩 Tech stack disagreements
🚩 Equity split can't be agreed

**Mitigation:** Address these ASAP, don't let them linger

---

## When You're Ready to Apply for Funding

**Business Finland NIY checklist:**
1. Company formed (Oy)
2. Business plan ✅ (you have this)
3. Financial projections (revenue, costs, 3 years)
4. Market analysis ✅ (in STARTUP_PLAN.md)
5. Team CVs
6. Description of innovation
7. Own financing secured (€5K-15K)

**Timeline:** 2-3 months from application to funding decision

**Amount:** Typically €30K-75K (50-75% of costs)

**Alternative:** Angel investors from your Oikotie network might be faster

---

## Questions?

As you go through these tasks, keep notes of:
- Questions for developer
- Blockers you hit
- Decisions that need discussion
- Things that are unclear

We can tackle them together when you come back to Claude Code!

**Let's make Woof happen! 🐶**
