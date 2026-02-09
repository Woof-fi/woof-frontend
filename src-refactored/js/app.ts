/**
 * Main Application Entry Point
 * Initializes all modules and functionality
 */

import { CONFIG } from './config';
import { healthCheck } from './api';
import { showToast } from './utils';
import { initInviteModal, checkReferral } from './invite';
// @ts-ignore - JavaScript modules
import { initModals } from './modals.js';
// @ts-ignore - JavaScript modules
import { initFeed } from './posts.js';
// @ts-ignore - JavaScript modules
import { initSearch } from './search.js';

/**
 * Initialize application
 */
async function initApp(): Promise<void> {
    console.log('🚀 Initializing Woof App...');
    console.log('Environment:', import.meta.env.VITE_ENV);
    console.log('API URL:', CONFIG.API_BASE_URL);

    // Initialize core UI functionality
    initModals();

    // Initialize feed (only on pages with feed)
    const feedContainer = document.querySelector('#following, .content');
    if (feedContainer) {
        initFeed();
    }

    // Initialize search
    initSearch();

    // Initialize invite modal
    initInviteModal();

    // Check for referral parameter
    checkReferral();

    // Check API health
    try {
        const isHealthy = await healthCheck();
        if (!isHealthy) {
            showToast('Backend API is unavailable', 'error');
        } else {
            console.log('✅ API health check passed');
        }
    } catch (error) {
        console.warn('⚠️  API health check failed:', error);
    }

    console.log('✅ Woof App initialized successfully');
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Export for debugging
if (import.meta.env.DEV) {
    (window as any).WoofApp = {
        CONFIG,
        reinit: initApp
    };
}
