# Woof Frontend - Claude Code Instructions

**Last Updated:** 2026-02-08
**Status:** Closed Beta Ready

## Project Overview

Woof frontend is a social media platform for pets (Instagram for animals).
- **Frontend**: Vanilla JavaScript (ES6 modules) + HTML + CSS
- **Backend API**: http://woof-prod.eba-pz3gawvp.eu-north-1.elasticbeanstalk.com
- **Deployment**: AWS S3 Static Website
- **Website**: http://woof-app-frontend-2026.s3-website.eu-north-1.amazonaws.com

## Current State

### Production (AWS S3)
- **Bucket**: woof-app-frontend-2026
- **Region**: eu-north-1
- **URL**: http://woof-app-frontend-2026.s3-website.eu-north-1.amazonaws.com
- **Status**: ✅ Deployed and working

### Local Development
- **Directory**: `/Users/tommikivisaari/Documents/Personal/Projects/Woof/src-refactored`
- **Server**: `python3 -m http.server 8000`
- **URL**: http://localhost:8000

### Architecture
**Modular JavaScript (9 files):**
1. `config.js` - Configuration (API URL, feature flags, IDs)
2. `utils.js` - Utilities (escapeHTML, validation, toast)
3. `api.js` - API service layer (getAllDogs, getDog, etc.)
4. `ui.js` - UI management (loading, error, empty states)
5. `profile.js` - Profile page logic
6. `posts.js` - Feed and posts logic
7. `search.js` - Search functionality
8. `modals.js` - Modal management
9. `app.js` - Main initialization

**HTML Pages:**
- `index.html` - Feed (Following & For You)
- `nelli.html` - Nelli's profile
- `map.html` - Map placeholder
- `store.html` - Descoped for Phase 1

## Phase 1 Features (Closed Beta)

**✅ Implemented:**
- View feed of dog posts
- View dog profiles (Nelli, Luna, Max)
- Search functionality
- Create post modal (frontend only)
- Responsive design (mobile + desktop)
- XSS prevention
- Error handling and loading states

**❌ Descoped:**
- Store/Shopping cart
- Google Maps (needs API key)
- File uploads to S3
- Authentication
- Comments/messaging

## Development Workflow

### Local Development
```bash
cd /Users/tommikivisaari/Documents/Personal/Projects/Woof/src-refactored
python3 -m http.server 8000
# Visit http://localhost:8000
```

### Deploy to S3
```bash
cd /Users/tommikivisaari/Documents/Personal/Projects/Woof/src-refactored
aws s3 sync . s3://woof-app-frontend-2026/ \
  --exclude ".DS_Store" \
  --exclude "*.md" \
  --exclude ".git*"
```

### Test Production
```bash
curl http://woof-app-frontend-2026.s3-website.eu-north-1.amazonaws.com/
```

### Update Configuration
Edit `js/config.js`:
```javascript
export const CONFIG = {
    API_BASE_URL: 'http://woof-prod.eba-pz3gawvp.eu-north-1.elasticbeanstalk.com',
    FEATURES: {
        GOOGLE_MAPS: false,
        SHOPPING_CART: false, // Descoped for Phase 1
        CREATE_POST: true,
        SEARCH: true
    }
};
```

## Common Tasks

### Add New Feature
1. Update `config.js` if needed (feature flags, IDs)
2. Create/update module file (e.g., `posts.js`)
3. Import in `app.js` if needed
4. Test locally
5. Deploy to S3

### Fix Bug
1. Reproduce locally
2. Check browser console for errors
3. Fix in appropriate module
4. Test locally
5. Deploy to S3

### Update Content
1. Edit HTML files for structure
2. Edit `css/styles.css` for styling
3. Edit `js/*` for behavior
4. Deploy to S3

## Troubleshooting

### Images Not Loading
**Problem:** Infinite errors in console about missing images
**Fix:** Image paths must use `assets/images/` (relative, no leading slash)

**Incorrect:**
```javascript
img.src = '/assets/images/dog.jpg'; // Infinite loop!
```

**Correct:**
```javascript
img.src = 'assets/images/dog_profile_pic.jpg';
img.onerror = function() {
    if (this.src !== 'assets/images/dog_profile_pic.jpg') {
        this.src = 'assets/images/dog_profile_pic.jpg';
    }
};
```

### API Calls Failing
**Problem:** Cannot fetch data from backend
**Check:**
1. Backend is running: `curl http://woof-prod.eba-pz3gawvp.eu-north-1.elasticbeanstalk.com/health`
2. API_BASE_URL in `config.js` is correct
3. CORS is enabled (backend allows all origins in dev)
4. Browser console for network errors

### JavaScript Not Loading
**Problem:** Blank page or console errors
**Check:**
1. ES6 modules require `type="module"` in script tag
2. All imports use `.js` extension
3. Files are uploaded to S3
4. Browser supports ES6 modules (all modern browsers)

### Deploy Not Working
**Problem:** S3 sync fails
**Check:**
1. AWS credentials configured: `aws sts get-caller-identity`
2. Bucket exists: `aws s3 ls | grep woof`
3. Permissions: Bucket policy allows public read
4. Website hosting enabled: `aws s3api get-bucket-website --bucket woof-app-frontend-2026`

## Security

### XSS Prevention ✅
- Use `escapeHTML()` for all user-generated content
- Use DOM methods (createElement, textContent) instead of innerHTML
- Validate file uploads (type, size)

**Example:**
```javascript
import { escapeHTML } from './utils.js';

const username = escapeHTML(dog.name); // Safe
const caption = escapeHTML(post.caption); // Safe

const element = document.createElement('p');
element.textContent = username; // Safe - no HTML parsing
```

### File Upload Validation ✅
```javascript
import { isValidFileType, isValidFileSize } from './utils.js';

if (!isValidFileType(file)) {
    showToast('Invalid file type', 'error');
    return;
}

if (!isValidFileSize(file, 5)) { // 5MB limit
    showToast('File too large', 'error');
    return;
}
```

## Backend Integration

### API Endpoints Used
```javascript
// Get all dogs
GET /api/dogs
Response: { dogs: [...], total: 3 }

// Get single dog
GET /api/dogs/:id
Response: { dog: {...} }

// Health check
GET /health
Response: { status: 'OK' }
```

### Data Models
```javascript
// Dog object from API
{
    id: '10000000-0000-0000-0000-000000000001',
    name: 'Nelli',
    breed: 'Miniature Schnauzer',
    age: 5,
    profilePhoto: '/dog_profile_pic.jpg',
    location: 'Patola, Helsinki',
    bio: '5 gold medals in being the best dog...'
}
```

## Testing

### Manual Testing Checklist
- [ ] Feed loads with 3 dogs (Nelli, Luna, Max)
- [ ] Profile page shows dog details
- [ ] Search panel opens and closes
- [ ] Create post modal opens and closes
- [ ] Responsive design works on mobile
- [ ] Images load without errors
- [ ] Error states show properly
- [ ] Loading states appear and disappear

### Browser Console Checks
```javascript
// Should see no errors
// Should see successful API calls
// Network tab should show 200 responses
```

## Next Steps (Future Phases)

### Phase 2: Full MVP
- [ ] User authentication (login/signup)
- [ ] Real file uploads to S3
- [ ] Posts API integration
- [ ] Comments functionality
- [ ] Following/followers

### Phase 3: Enhanced Features
- [ ] Google Maps integration
- [ ] Shopping cart (restore from descoped)
- [ ] Health tracking
- [ ] Events and meetups

### Phase 4: Polish
- [ ] CloudFront CDN
- [ ] Custom domain
- [ ] Service Worker (PWA)
- [ ] Image optimization
- [ ] Analytics

## Resources

### Documentation
- [FRONTEND_AUDIT.md](../FRONTEND_AUDIT.md) - Security audit
- [REFACTORING_COMPLETE.md](../REFACTORING_COMPLETE.md) - Refactoring summary
- [TESTING_STRATEGY.md](../TESTING_STRATEGY.md) - Testing approach

### AWS Resources
- **S3 Bucket**: woof-app-frontend-2026
- **Backend API**: woof-prod.eba-pz3gawvp.eu-north-1.elasticbeanstalk.com
- **Region**: eu-north-1

### Git Repository
- **Location**: `/Users/tommikivisaari/Documents/Personal/Projects/Woof`
- **Status**: Committed locally
- **Branch**: main
- **Remote**: Not configured (optional)

---

**Quick Reference:**
- Deploy: `aws s3 sync . s3://woof-app-frontend-2026/`
- Test: `curl http://woof-app-frontend-2026.s3-website.eu-north-1.amazonaws.com/`
- Dev: `python3 -m http.server 8000`
- Backend API: http://woof-prod.eba-pz3gawvp.eu-north-1.elasticbeanstalk.com
