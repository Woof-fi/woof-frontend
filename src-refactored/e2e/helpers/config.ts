/**
 * Shared E2E test configuration.
 * Derives API_BASE from E2E_BASE_URL so tests work against both local and production.
 */

const baseURL = process.env.E2E_BASE_URL || 'https://woofapp.fi';

// Local dev: frontend on 8000, backend on 3000
// Production: frontend on woofapp.fi, API on api.woofapp.fi
export const API_BASE = baseURL.includes('localhost')
  ? baseURL.replace(/:\d+$/, ':3000')
  : 'https://api.woofapp.fi';
