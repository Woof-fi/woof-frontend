# Frontend Modernization Plan

## ✅ Backend Modernization - COMPLETED

All critical backend improvements have been implemented and deployed:

### Security
- ✅ Helmet security headers
- ✅ Proper CORS configuration (whitelist only)
- ✅ Comprehensive rate limiting on all endpoints
- ✅ Input validation with Zod on all routes

### Logging & Monitoring
- ✅ Structured logging with Pino
- ✅ HTTP request logging with request IDs
- ✅ PII redaction (passwords, tokens)
- ✅ Enhanced health check with DB status

### Error Handling
- ✅ Graceful shutdown on SIGTERM/SIGINT
- ✅ Proper error handling with request tracing
- ✅ Uncaught exception handlers

---

## 🚧 Frontend Modernization - TODO

### Phase 1: Add Build System (High Priority)

**Goal**: Add Vite for modern build pipeline

```bash
cd /Users/tommikivisaari/Documents/Personal/Projects/Woof/src-refactored

# Install Vite and TypeScript
npm install --save-dev vite @vitejs/plugin-legacy typescript

# Install types
npm install --save-dev @types/node
```

**Create `vite.config.ts`:**

```typescript
import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  root: '.',
  publicDir: 'assets',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: '/index.html',
        nelli: '/nelli.html',
        map: '/map.html',
        store: '/store.html'
      }
    }
  },
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],
  server: {
    port: 8000,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
```

**Update `package.json`:**

```json
{
  "name": "woof-frontend",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy": "npm run build && aws s3 sync dist/ s3://woof-app-frontend-2026/ --delete"
  },
  "devDependencies": {
    "@vitejs/plugin-legacy": "^6.0.0",
    "@types/node": "^22.0.0",
    "typescript": "^5.9.0",
    "vite": "^6.0.0"
  }
}
```

**Create `.env` files:**

```.env.development
VITE_API_URL=http://localhost:3000
VITE_ENV=development
```

```.env.production
VITE_API_URL=http://woof-prod.eba-pz3gawvp.eu-north-1.elasticbeanstalk.com
VITE_ENV=production
```

**Update `js/config.js` to `js/config.ts`:**

```typescript
export const CONFIG = {
    API_BASE_URL: import.meta.env.VITE_API_URL,
    API_TIMEOUT: 10000,
    // ... rest of config
};
```

---

### Phase 2: Migrate to TypeScript (Medium Priority)

**Goal**: Add type safety to catch bugs at compile time

**Steps:**

1. **Rename files**: `.js` → `.ts`
   ```bash
   cd js
   mv api.js api.ts
   mv auth.js auth.ts
   mv config.js config.ts
   # ... etc
   ```

2. **Create `tsconfig.json`:**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "types": ["vite/client"]
  },
  "include": ["js/**/*", "*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

3. **Create type definitions:**

```typescript
// types/api.ts
export interface User {
    id: string;
    email: string;
    name: string;
    dogs: Dog[];
    primaryDogId: string | null;
}

export interface Dog {
    id: string;
    name: string;
    breed: string;
    age: number;
    profilePhoto: string | null;
    location: string;
    bio: string | null;
}

export interface Post {
    id: string;
    dogId: string;
    imageUrl: string;
    caption: string | null;
    createdAt: string;
    dogName: string;
    dogPhoto: string | null;
}

export interface AuthResponse {
    user: User;
    token: string;
}
```

4. **Update API functions with types:**

```typescript
// api.ts
import type { User, Dog, Post, AuthResponse } from '../types/api';

export async function login(email: string, password: string): Promise<AuthResponse> {
    const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    return data as AuthResponse;
}

export async function getAllDogs(): Promise<Dog[]> {
    const data = await apiRequest('/api/dogs');
    return (data.dogs || []) as Dog[];
}
```

---

### Phase 3: State Management (Medium Priority)

**Goal**: Replace scattered localStorage with proper state management

```bash
npm install zustand
```

**Create `stores/auth.ts`:**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/api';
import * as api from '../api';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => void;
    setUser: (user: User) => void;
}

export const useAuth = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            login: async (email, password) => {
                const { user, token } = await api.login(email, password);
                set({ user, token, isAuthenticated: true });
            },

            register: async (email, password, name) => {
                const { user, token } = await api.register(email, password, name);
                set({ user, token, isAuthenticated: true });
            },

            logout: () => {
                set({ user: null, token: null, isAuthenticated: false });
            },

            setUser: (user) => {
                set({ user });
            }
        }),
        {
            name: 'woof-auth',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated
            })
        }
    )
);
```

---

### Phase 4: Environment Variables (Critical)

**Current Issue**: API URL hardcoded in source

**Fix**: Use Vite's environment variable system

```typescript
// Before (WRONG):
API_BASE_URL: 'http://woof-prod.eba-pz3gawvp.eu-north-1.elasticbeanstalk.com'

// After (CORRECT):
API_BASE_URL: import.meta.env.VITE_API_URL
```

---

### Phase 5: Performance Optimizations

1. **Image Optimization**
   ```bash
   npm install --save-dev vite-plugin-image-optimizer
   ```

2. **Code Splitting**
   - Vite automatically handles this

3. **CSS Modules**
   ```typescript
   // Rename styles.css → styles.module.css
   import styles from './styles.module.css';
   element.className = styles.post;
   ```

---

## 🎯 Quick Start (After Frontend Setup)

```bash
# Development
cd src-refactored
npm install
npm run dev
# Open http://localhost:8000

# Production build
npm run build

# Deploy to S3
npm run deploy
```

---

## 📊 Migration Checklist

- [ ] Install Vite and dependencies
- [ ] Create vite.config.ts
- [ ] Add .env files
- [ ] Update package.json scripts
- [ ] Test local dev server (npm run dev)
- [ ] Rename .js files to .ts
- [ ] Add type definitions
- [ ] Fix TypeScript errors
- [ ] Add zustand for state management
- [ ] Test production build
- [ ] Deploy to S3
- [ ] Update CloudFront (if using CDN)

---

## 💡 Benefits After Migration

| Feature | Before | After |
|---------|--------|-------|
| Build time | N/A (no build) | ~2s (Vite) |
| Hot reload | Manual refresh | Instant HMR |
| Type safety | None | Full TypeScript |
| Bundle size | ~150KB | ~80KB (minified + tree-shaken) |
| Browser support | Modern only | Modern + Legacy (via polyfills) |
| Environment vars | Hardcoded | Proper .env management |
| Cache busting | Manual | Automatic (content hash) |

---

## 🔧 Troubleshooting

### Issue: "import.meta is not defined"
**Solution**: Ensure `type: "module"` in package.json

### Issue: Types not found
**Solution**: Install @types packages:
```bash
npm install --save-dev @types/node
```

### Issue: Vite dev server not starting
**Solution**: Check port 8000 is available:
```bash
lsof -i :8000
```

---

## 📚 Resources

- [Vite Documentation](https://vite.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [Zod Documentation](https://zod.dev/) (already using on backend)

---

**Status**: Backend modernization complete ✅
**Next**: Frontend modernization (can be done incrementally)
**Estimated time**: 4-6 hours for complete migration
