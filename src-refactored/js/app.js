/**
 * Main Application Entry Point
 * Initializes all modules and functionality
 */

import { CONFIG } from './config.js';
import { healthCheck } from './api.js';
import { initProfile, initProfileTabs } from './profile.js';
import { initFeed, initFeedTabs } from './posts.js';
import { initSearch } from './search.js';
import { initModals } from './modals.js';
import { showToast } from './utils.js';

/**
 * Initialize application
 */
async function initApp() {
    console.log('Initializing Woof App...');

    // Check API health
    try {
        const isHealthy = await healthCheck();
        if (!isHealthy) {
            showToast('Backend API is unavailable', 'error');
        }
    } catch (error) {
        console.warn('API health check failed:', error);
    }

    // Initialize common functionality
    initModals();
    initSearch();

    // Initialize page-specific functionality
    const currentPage = getCurrentPage();

    switch (currentPage) {
        case 'index':
            await initHomePage();
            break;
        case 'nelli':
        case 'profile':
            await initProfilePage();
            break;
        case 'map':
            initMapPage();
            break;
        case 'store':
            initStorePage();
            break;
        default:
            console.log(`Page '${currentPage}' has no specific initialization`);
    }

    console.log('Woof App initialized successfully');
}

/**
 * Get current page name from URL
 * @returns {string} - Page name
 */
function getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1);

    if (filename === '' || filename === 'index.html') {
        return 'index';
    }

    return filename.replace('.html', '');
}

/**
 * Initialize home/feed page
 */
async function initHomePage() {
    console.log('Initializing home page');

    initFeedTabs();
    await initFeed();
}

/**
 * Initialize profile page
 */
async function initProfilePage() {
    console.log('Initializing profile page');

    // Get dog ID from URL or use default (Nelli)
    const urlParams = new URLSearchParams(window.location.search);
    const dogId = urlParams.get('id') || CONFIG.DOGS.NELLI;

    initProfileTabs();
    await initProfile(dogId);
}

/**
 * Initialize map page
 */
function initMapPage() {
    console.log('Initializing map page');

    if (!CONFIG.FEATURES.GOOGLE_MAPS) {
        console.log('Google Maps feature disabled');
        return;
    }

    // Initialize map when Google Maps loads
    if (typeof google !== 'undefined') {
        initMap();
    } else {
        window.initMap = initMap;
    }
}

/**
 * Initialize Google Map
 */
function initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    const map = new google.maps.Map(mapElement, {
        center: { lat: 60.232043945670185, lng: 24.95346683558198 },
        zoom: 14,
    });

    // TODO: Add markers for dog locations
}

/**
 * Initialize store page
 */
function initStorePage() {
    console.log('Initializing store page');

    // Store functionality is handled by modals.js (cart)
    // No additional initialization needed
}

/**
 * Handle errors globally
 */
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Don't show toast for every error - only for critical ones
});

/**
 * Handle unhandled promise rejections
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Export for debugging
if (process.env.NODE_ENV === 'development') {
    window.WoofApp = {
        CONFIG,
        reinit: initApp
    };
}
