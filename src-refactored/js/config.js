/**
 * Application Configuration
 * Centralized configuration for API endpoints and app settings
 */

export const CONFIG = {
    // API Configuration
    API_BASE_URL: import.meta.env.VITE_API_URL || 'https://api.woofapp.fi',
    API_TIMEOUT: 10000, // 10 seconds

    // AWS Cognito Configuration
    COGNITO: {
        USER_POOL_ID: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'eu-north-1_99e6Bvwmy',
        CLIENT_ID: import.meta.env.VITE_COGNITO_CLIENT_ID || '2mr6ff413juuaeffjdramib5dk',
    },

    // UI Configuration
    RESPONSIVE_BREAKPOINT: 768, // Mobile breakpoint in pixels
    MODAL_ANIMATION_DURATION: 300, // ms

    // Feature Flags
    FEATURES: {
        GOOGLE_MAPS: false, // Disabled until we add API key
        SHOPPING_CART: false, // Descoped for closed beta (Phase 1)
        CREATE_POST: true,
        SEARCH: true
    }
};

// Freeze config to prevent accidental modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.COGNITO);
Object.freeze(CONFIG.FEATURES);
