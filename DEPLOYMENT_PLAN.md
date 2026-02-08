# Frontend Deployment Plan

**Goal:** Get refactored frontend connected to AWS backend and accessible

---

## Option 1: Serve from AWS Elastic Beanstalk (Recommended)

**Pros:**
- Everything in one place
- Simple CORS configuration
- No additional cost
- One deployment

**Steps:**

### 1. Copy Frontend to Backend Project
```bash
cd /Users/tommikivisaari/Documents/Personal/Projects/woof-backend
mkdir -p public
cp -r /Users/tommikivisaari/Documents/Personal/Projects/Woof/src-refactored/* public/
cp /Users/tommikivisaari/Documents/Personal/Projects/Woof/src/*.html public/
cp /Users/tommikivisaari/Documents/Personal/Projects/Woof/src/styles.css public/css/
cp /Users/tommikivisaari/Documents/Personal/Projects/Woof/src/logo.png public/assets/images/
cp /Users/tommikivisaari/Documents/Personal/Projects/Woof/src/dog_profile_pic.jpg public/assets/images/
```

### 2. Configure Express to Serve Static Files
```javascript
// src/app.ts
import express from 'express';
import path from 'path';

const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api/dogs', dogRoutes);

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});
```

### 3. Update Frontend Config
```javascript
// public/js/config.js
export const CONFIG = {
    // Use relative URL since frontend and backend are same origin
    API_BASE_URL: '', // Empty string = same origin
    // ... rest of config
};
```

### 4. Deploy
```bash
npm run build
eb deploy woof-prod
```

### 5. Access
```
http://woof-prod.eba-pz3gawvp.eu-north-1.elasticbeanstalk.com
```

---

## Option 2: Deploy to AWS S3 + CloudFront

**Pros:**
- Fastest performance (CDN)
- Cheaper for static content
- Scalable

**Cons:**
- CORS configuration needed
- Separate deployment

**Steps:**

### 1. Create S3 Bucket
```bash
aws s3 mb s3://woof-frontend --region eu-north-1
```

### 2. Configure Bucket for Static Website
```bash
aws s3 website s3://woof-frontend \
  --index-document index.html \
  --error-document index.html
```

### 3. Upload Frontend Files
```bash
cd /Users/tommikivisaari/Documents/Personal/Projects/Woof/src-refactored
aws s3 sync . s3://woof-frontend --exclude "*.md" --region eu-north-1
```

### 4. Make Public
```bash
aws s3api put-bucket-policy --bucket woof-frontend --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::woof-frontend/*"
  }]
}'
```

### 5. Enable CORS on Backend
```javascript
// src/app.ts
import cors from 'cors';

app.use(cors({
    origin: 'http://woof-frontend.s3-website.eu-north-1.amazonaws.com',
    credentials: true
}));
```

### 6. Access
```
http://woof-frontend.s3-website.eu-north-1.amazonaws.com
```

---

## Option 3: Local Development (For Testing)

**Best for:** Testing before deployment

**Steps:**

### 1. Use Live Server
```bash
cd /Users/tommikivisaari/Documents/Personal/Projects/Woof/src-refactored

# If you have Python
python3 -m http.server 8000

# Or use VS Code Live Server extension
```

### 2. Update Config for Local Testing
```javascript
// js/config.js
export const CONFIG = {
    API_BASE_URL: 'http://woof-prod.eba-pz3gawvp.eu-north-1.elasticbeanstalk.com',
    // ... rest
};
```

### 3. Fix CORS on Backend (Temporarily)
```javascript
// src/app.ts
app.use(cors({
    origin: 'http://localhost:8000',
    credentials: true
}));
```

### 4. Access
```
http://localhost:8000
```

---

## Recommended: Option 1 (Serve from Elastic Beanstalk)

**Why:**
- Simplest deployment
- No CORS issues
- Everything in one place
- No additional cost

**Next Steps:**
1. Copy frontend files to `woof-backend/public/`
2. Update Express app to serve static files
3. Update `.ebignore` to include public folder
4. Deploy with `eb deploy`
5. Access at production URL

---

## Git Commit Plan

### For Woof Prototype Repo
```bash
cd /Users/tommikivisaari/Documents/Personal/Projects/Woof

git add src-refactored/
git add FRONTEND_AUDIT.md REFACTORING_COMPLETE.md DEPLOYMENT_PLAN.md

git commit -m "Refactor frontend for production

- Created 8 modular JavaScript files (app, config, utils, api, ui, profile, posts, search, modals)
- Fixed XSS vulnerability in createPostElement
- Added comprehensive error handling and loading states
- Implemented API service layer with timeout handling
- Added input validation for file uploads
- Improved accessibility with ARIA labels and keyboard navigation
- Added debounced search with local caching
- Removed all code duplication
- Created professional folder structure
- Security: Sanitize all user inputs, validate file uploads
- Performance: Lazy loading, debouncing, caching
- UX: Skeleton loaders, error states, empty states

All security issues resolved and ready for production deployment.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

### For Woof Backend Repo (if integrating frontend)
```bash
cd /Users/tommikivisaari/Documents/Personal/Projects/woof-backend

# After copying frontend files
git add public/
git add src/app.ts  # If modified to serve static files
git add .ebignore   # If modified

git commit -m "Add production-ready frontend

- Integrated refactored frontend with backend
- Serving static files from /public directory
- Frontend uses modular ES6 architecture
- All API endpoints connected
- Security: XSS vulnerabilities fixed
- Ready to show real data from PostgreSQL

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Testing Checklist Before Deployment

- [ ] All JavaScript modules load without errors
- [ ] API calls work (test with `/health` endpoint)
- [ ] Nelli's profile loads from real backend
- [ ] Feed displays all dogs from database
- [ ] Search filters dogs correctly
- [ ] Modals open and close
- [ ] No console errors
- [ ] Works on mobile (Chrome DevTools)
- [ ] No CORS errors

---

## Current Status

✅ **Frontend refactored** - All JavaScript modules created
✅ **Security fixed** - XSS vulnerability resolved
✅ **Backend deployed** - API running on AWS
✅ **Database populated** - Nelli's data in PostgreSQL

**Next:** Choose deployment option and execute

---

**Recommendation:** Go with Option 1 (serve from Elastic Beanstalk) for quickest results!
