# Woof - GitHub Setup Guide

**Question:** Personal GitHub or new organization? How to keep it private?

---

## Recommendation: Create a GitHub Organization ✅

### Why Organization (Not Personal Repo)?

✅ **Professional** - Shows you're serious about this as a startup
✅ **Team access** - Easy to add your developer and future team members
✅ **Separate identity** - Woof has its own GitHub presence, not tied to personal account
✅ **Permission management** - Better control over who sees what
✅ **Scalability** - Can add multiple repos (backend, mobile, docs, infrastructure)
✅ **Transfer-friendly** - If you incorporate (Oy Woof Ltd), the org represents the company

### Organization Structure

```
GitHub Organization: "Woof-App" or "WoofHQ" or "GetWoof"

Repositories (all PRIVATE):
├── woof-backend          # Node.js + TypeScript + Express backend
├── woof-mobile           # React Native + Expo mobile app
├── woof-infrastructure   # AWS infrastructure as code (Terraform/CDK)
├── woof-docs             # Internal documentation
└── woof-design           # Design files, assets, brand guidelines
```

---

## Step-by-Step GitHub Setup

### Step 1: Create GitHub Organization

1. Go to: https://github.com/organizations/plan
2. Choose **Free** plan (includes private repos)
3. Organization name: `WoofApp` or `Woof-HQ` (check availability)
4. Contact email: your email (you're the owner)
5. Organization type: "My personal account"

**Cost: FREE** ✅

### Step 2: Create Private Repositories

For each repo:
1. Go to your organization
2. Click "New repository"
3. Name: `woof-backend`, `woof-mobile`, etc.
4. ⚠️ **Set to PRIVATE** ⚠️
5. Add README: Yes
6. Add .gitignore: Node (for backend), React (for mobile)
7. License: None (or MIT for internal use)
8. Create repository

### Step 3: Add Your Developer as Member

1. Go to organization settings
2. Click "People"
3. Click "Invite member"
4. Enter developer's GitHub username or email
5. Set role: **"Owner"** (you're co-founders) or "Member" (if you want more control)
6. Send invitation

**He'll have access to all private repos once he accepts**

### Step 4: Repository Settings (Security)

For each repo, go to Settings:

**Under "General":**
- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass (once you have CI/CD)
- ✅ Require branches to be up to date

**Under "Branches":**
- Set `main` as default branch
- Add branch protection rule:
  - ✅ Require pull request before merging
  - ✅ Require approvals: 1 (you and dev review each other)
  - ✅ Dismiss stale reviews

**Under "Security":**
- ✅ Enable Dependabot alerts
- ✅ Enable Dependabot security updates

### Step 5: Set Up GitHub Projects (Optional)

For project management:
1. Go to organization
2. Click "Projects"
3. Create new project (Kanban board)
4. Columns: Backlog, To Do, In Progress, Review, Done
5. Link to repositories

**Alternative:** Use Linear, Notion, or Jira instead

---

## Repository Structure Details

### woof-backend (Private)

```
woof-backend/
├── src/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── services/
│   ├── middleware/
│   └── utils/
├── tests/
├── scripts/
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── README.md
└── docker-compose.yml
```

**Important:**
- ✅ `.gitignore` includes `.env` (never commit secrets!)
- ✅ `.env.example` shows what env vars are needed (without values)
- ✅ README explains how to run locally

### woof-mobile (Private)

```
woof-mobile/
├── src/
│   ├── screens/
│   ├── components/
│   ├── navigation/
│   ├── services/
│   ├── utils/
│   └── assets/
├── app.json
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

**Important:**
- ✅ Don't commit `.env` with API keys
- ✅ Don't commit `node_modules/`
- ✅ Don't commit large media files (use Git LFS if needed)

### woof-infrastructure (Private)

For AWS infrastructure as code:
```
woof-infrastructure/
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── scripts/
└── README.md
```

Or use AWS CDK if you prefer TypeScript

### woof-docs (Private)

Internal documentation:
```
woof-docs/
├── architecture/
├── api-specs/
├── design/
└── meeting-notes/
```

---

## Security Best Practices

### Never Commit:
- ❌ `.env` files
- ❌ API keys or secrets
- ❌ AWS credentials
- ❌ Database passwords
- ❌ Private keys (SSH, SSL, etc.)
- ❌ User data

### Always Use:
- ✅ `.env.example` (template without actual values)
- ✅ Environment variables
- ✅ AWS Secrets Manager (for production secrets)
- ✅ `.gitignore` properly configured

### Example `.env.example`:
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/woof_dev

# AWS
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here

# Cognito
COGNITO_USER_POOL_ID=eu-north-1_xxxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

# S3
S3_BUCKET_NAME=woof-uploads-dev
```

Actual `.env` (NOT committed):
```bash
DATABASE_URL=postgresql://woof_user:REAL_PASSWORD@localhost:5432/woof_dev
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
# ... real values ...
```

---

## Alternatives to GitHub Organization

### Option 1: Personal Repo (Not Recommended)
- Your personal account: `tommikivisaari/woof-backend`
- Add developer as collaborator
- ❌ Looks less professional
- ❌ Harder to transfer later
- ❌ Tied to your personal account

### Option 2: Developer's Personal Repo (Not Recommended)
- Developer's account: `developer/woof-backend`
- ❌ What if he leaves?
- ❌ You don't have ownership
- ❌ Risky for IP

### Option 3: GitHub Organization (Recommended) ✅
- Organization: `WoofApp/woof-backend`
- ✅ Both of you are owners
- ✅ Professional
- ✅ Scalable
- ✅ Clear ownership

**Winner: GitHub Organization** 🏆

---

## Intellectual Property (IP)

### Co-Founder Agreement Should Include:
- All code belongs to the company (Woof)
- Contributors assign IP to the company
- Work-for-hire clause

### GitHub Organization Settings:
- Make sure both co-founders are "Owners"
- Equal control over repositories
- Clear license (MIT, Apache 2.0, or proprietary)

**Recommendation:** Add LICENSE file with proprietary license:
```
Copyright (c) 2026 Woof (Oy Woof Ltd)

All rights reserved. This software and associated documentation files
(the "Software") are the proprietary information of Woof.

The Software may not be copied, modified, distributed, or used without
explicit written permission from Woof.
```

---

## When Someone Leaves (Future-Proofing)

If a team member leaves:
1. Remove them from the GitHub organization
2. Revoke their access to AWS, databases, etc.
3. Rotate any secrets they had access to
4. Their past commits remain (they contributed)
5. Organization and code remain with the company

**This is why organization > personal repo**

---

## GitHub Actions (CI/CD)

Once you have code, set up automated testing and deployment:

Example `.github/workflows/backend-ci.yml`:
```yaml
name: Backend CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run lint
```

This runs tests automatically on every push/PR.

---

## Recommended Workflow

### Branching Strategy:
- `main` - Production-ready code
- `develop` - Development branch
- `feature/feature-name` - Feature branches
- `hotfix/bug-name` - Bug fixes

### Development Flow:
1. Create feature branch from `develop`
2. Make changes
3. Push to GitHub
4. Open pull request
5. Code review (other co-founder reviews)
6. Merge to `develop`
7. Test on staging
8. Merge `develop` → `main` for production

**Never push directly to `main`** (use branch protection)

---

## Cost

**GitHub Organization:**
- Free plan: ✅ Private repos ✅ Unlimited collaborators
- Team plan: €4/user/month (only needed if you want advanced features)
- Enterprise: Much more expensive

**Recommendation:** Start with FREE plan ✅

---

## Action Items (This Week)

### For Tommi:
- [ ] Create GitHub organization
  - Name: `WoofApp` (or similar, check availability)
  - Plan: Free
- [ ] Create repositories:
  - [ ] `woof-backend` (private)
  - [ ] `woof-mobile` (private)
  - [ ] `woof-docs` (private)
- [ ] Add README to each repo
- [ ] Invite developer as organization owner

### For Developer (once invited):
- [ ] Accept invitation
- [ ] Clone repositories
- [ ] Set up local development environment
- [ ] Make first commit (project setup)

---

## Questions?

Common questions:

**Q: Can I switch from personal to org later?**
A: Yes, but it's annoying. Better to start with org.

**Q: What if we hire more developers?**
A: Just invite them to the organization. Easy.

**Q: Can we make some repos public later?**
A: Yes, you can change visibility anytime.

**Q: Do we need GitHub Pro?**
A: No, free plan is fine for startups.

**Q: What about GitLab or Bitbucket?**
A: GitHub is industry standard. Stick with it.

---

**Bottom line: Create a GitHub Organization, make all repos private, add your developer as owner. Simple! 🚀**
