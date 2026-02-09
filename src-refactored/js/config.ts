/**
 * Application Configuration
 * Centralized configuration for API endpoints and app settings
 */

interface Config {
    // API Configuration
    readonly API_BASE_URL: string;
    readonly API_TIMEOUT: number;

    // Known Dog IDs (from seed data)
    readonly DOGS: {
        readonly NELLI: string;
        readonly LUNA: string;
        readonly MAX: string;
    };

    // Known User IDs (from seed data)
    readonly USERS: {
        readonly TOMMI: string;
        readonly USER2: string;
        readonly USER3: string;
    };

    // UI Configuration
    readonly RESPONSIVE_BREAKPOINT: number;
    readonly MODAL_ANIMATION_DURATION: number;

    // Feature Flags
    readonly FEATURES: {
        readonly GOOGLE_MAPS: boolean;
        readonly SHOPPING_CART: boolean;
        readonly CREATE_POST: boolean;
        readonly SEARCH: boolean;
    };
}

export const CONFIG: Config = {
    // API Configuration - Use environment variables
    API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    API_TIMEOUT: 10000, // 10 seconds

    // Known Dog IDs (from seed data)
    DOGS: {
        NELLI: '10000000-0000-0000-0000-000000000001',
        LUNA: '10000000-0000-0000-0000-000000000002',
        MAX: '10000000-0000-0000-0000-000000000003'
    },

    // Known User IDs (from seed data)
    USERS: {
        TOMMI: '11111111-1111-1111-1111-111111111111',
        USER2: '22222222-2222-2222-2222-222222222222',
        USER3: '33333333-3333-3333-3333-333333333333'
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
} as const;

// Log environment on startup (development only)
if (import.meta.env.DEV) {
    console.log('🚀 Woof Frontend');
    console.log('Environment:', import.meta.env.VITE_ENV);
    console.log('API URL:', CONFIG.API_BASE_URL);
}
