# Frontend Testing Strategy

**Goal:** Ensure frontend quality with appropriate test coverage

---

## Testing Pyramid

```
        /\
       /E2E\         <- Few, slow, expensive (Cypress/Playwright)
      /------\
     /Integration\   <- Some, medium speed (Jest + DOM Testing Library)
    /------------\
   /  Unit Tests  \  <- Many, fast, cheap (Jest)
  /----------------\
```

---

## 1. Unit Tests (Jest) - Recommended Now ✅

**What to Test:**
- Utility functions (utils.js)
- API service layer (api.js)
- Individual components

**Setup:**
```bash
cd /Users/tommikivisaari/Documents/Personal/Projects/Woof
npm init -y
npm install --save-dev jest @babel/preset-env jsdom
```

**Example Test:**
```javascript
// __tests__/utils.test.js
import { escapeHTML, sanitizeHTML, isValidEmail } from '../src-refactored/js/utils.js';

describe('escapeHTML', () => {
    test('should escape HTML special characters', () => {
        const input = '<script>alert("xss")</script>';
        const expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;';
        expect(escapeHTML(input)).toBe(expected);
    });

    test('should handle normal text', () => {
        expect(escapeHTML('Hello World')).toBe('Hello World');
    });
});

describe('isValidEmail', () => {
    test('should validate correct emails', () => {
        expect(isValidEmail('test@example.com')).toBe(true);
        expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    test('should reject invalid emails', () => {
        expect(isValidEmail('invalid')).toBe(false);
        expect(isValidEmail('missing@')).toBe(false);
        expect(isValidEmail('@domain.com')).toBe(false);
    });
});
```

**Coverage Goal:** 70%+ for utils, api, and core logic

---

## 2. Integration Tests (Jest + JSDOM) - Next Phase

**What to Test:**
- API calls with mock fetch
- UI state changes
- Modal interactions

**Example:**
```javascript
// __tests__/api.test.js
import { getDog, createDog } from '../src-refactored/js/api.js';

// Mock fetch
global.fetch = jest.fn();

describe('API Service', () => {
    beforeEach(() => {
        fetch.mockClear();
    });

    test('getDog should fetch dog data', async () => {
        const mockDog = { id: '123', name: 'Nelli', breed: 'Miniature Schnauzer' };
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ dog: mockDog })
        });

        const dog = await getDog('123');
        expect(dog).toEqual(mockDog);
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/dogs/123'),
            expect.any(Object)
        );
    });

    test('should handle API errors', async () => {
        fetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
            json: async () => ({ error: 'Not found' })
        });

        await expect(getDog('invalid')).rejects.toThrow();
    });
});
```

---

## 3. End-to-End Tests (Cypress) - Future

**What to Test:**
- Complete user flows
- Cross-browser compatibility
- Real API integration

**Example:**
```javascript
// cypress/e2e/profile.cy.js
describe('Dog Profile Page', () => {
    beforeEach(() => {
        cy.visit('/nelli.html');
    });

    it('should load Nelli\'s profile from API', () => {
        cy.get('.profile h3').should('contain', 'Nelli');
        cy.get('.profile-info').should('contain', 'Miniature Schnauzer');
        cy.get('.profile-info').should('contain', '5 years');
    });

    it('should switch between tabs', () => {
        cy.get('[data-tab="gallery"]').click();
        cy.get('#gallery').should('be.visible');

        cy.get('[data-tab="friends"]').click();
        cy.get('#friends').should('be.visible');
    });

    it('should handle API errors gracefully', () => {
        cy.intercept('GET', '/api/dogs/*', { statusCode: 500 });
        cy.visit('/nelli.html');
        cy.get('.error-state').should('be.visible');
        cy.get('.btn-retry').should('exist');
    });
});
```

---

## Recommended Approach

### Phase 1: Unit Tests (NOW) ✅
**Priority:** HIGH
**Effort:** 2-3 hours
**Coverage:** Core utilities and API layer

```bash
npm install --save-dev jest @babel/preset-env
npm test
```

**Files to Test:**
1. `utils.js` - All utility functions
2. `api.js` - All API methods with mocked fetch
3. `config.js` - Configuration validation

### Phase 2: Integration Tests (SOON)
**Priority:** MEDIUM
**Effort:** 3-4 hours
**Coverage:** Component interactions

**Files to Test:**
1. `profile.js` - Profile loading and rendering
2. `posts.js` - Feed and post creation
3. `search.js` - Search functionality
4. `modals.js` - Modal behavior

### Phase 3: E2E Tests (LATER)
**Priority:** LOW (only after more features)
**Effort:** 4-6 hours
**Coverage:** Critical user journeys

**User Flows to Test:**
1. View dog profile
2. Browse feed
3. Search for dogs
4. Create post
5. Add to shopping cart

---

## Why Not Behat for Frontend?

**Behat:**
- PHP-based
- Designed for backend BDD
- Doesn't run JavaScript
- Can't test browser interactions

**Better Alternatives:**
- **Cypress** - Modern, fast, great DX
- **Playwright** - Cross-browser, powerful
- **Puppeteer** - Google's tool, reliable

---

## Test Coverage Goals

| Type | Current | Target | Priority |
|------|---------|--------|----------|
| Unit Tests | 0% | 70%+ | HIGH |
| Integration Tests | 0% | 50%+ | MEDIUM |
| E2E Tests | 0% | Critical flows | LOW |

---

## Quick Start: Add Jest Tests Now

### 1. Install Dependencies
```bash
cd /Users/tommikivisaari/Documents/Personal/Projects/Woof
npm init -y
npm install --save-dev jest @babel/preset-env @babel/plugin-transform-modules-commonjs
```

### 2. Configure Jest
```javascript
// jest.config.js
export default {
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.js$': '@babel/jest',
    },
    moduleNameMapper: {
        '\\.(css|less|scss)$': '<rootDir>/__mocks__/styleMock.js',
    },
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    }
};
```

### 3. Create First Test
```javascript
// __tests__/utils.test.js
import { escapeHTML } from '../src-refactored/js/utils.js';

test('escapeHTML prevents XSS', () => {
    const malicious = '<script>alert("xss")</script>';
    const safe = escapeHTML(malicious);
    expect(safe).not.toContain('<script>');
    expect(safe).toContain('&lt;script&gt;');
});
```

### 4. Run Tests
```bash
npm test
npm test -- --coverage
```

---

## Backend vs Frontend Testing

| Aspect | Backend (Jest + Supertest) | Frontend (Jest + Cypress) |
|--------|----------------------------|---------------------------|
| **What** | API endpoints, business logic | UI components, user flows |
| **How** | HTTP requests to Express | DOM manipulation, clicks |
| **Speed** | Very fast | Slower (browser-based) |
| **Coverage** | 70%+ required | 60%+ sufficient |

---

## Recommendation

**For Now:**
1. ✅ Add Jest unit tests for `utils.js` and `api.js`
2. ✅ Test XSS prevention works
3. ✅ Test API error handling
4. ⏳ Skip E2E until you have more features

**Later (when adding auth):**
5. ⏳ Add Cypress for login/signup flows
6. ⏳ Test authenticated routes

---

## Example Test Suite Structure

```
woof-frontend/
├── __tests__/
│   ├── utils.test.js          # Utility function tests
│   ├── api.test.js            # API service tests
│   ├── profile.test.js        # Profile functionality
│   ├── posts.test.js          # Posts functionality
│   └── search.test.js         # Search functionality
│
├── cypress/                    # E2E tests (future)
│   └── e2e/
│       ├── profile.cy.js
│       ├── feed.cy.js
│       └── search.cy.js
│
├── jest.config.js
└── package.json
```

---

## Conclusion

**Answer:** Use **Jest for unit/integration tests** (not Behat)

**Next Step:** Add Jest tests for critical functions (utils.js, api.js)

**Later:** Add Cypress E2E tests for user journeys

This gives you the same professional testing approach as your backend (37+ tests) but appropriate for frontend code!

---

**Last Updated:** 2026-02-08
