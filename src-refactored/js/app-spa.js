/**
 * Main Application Entry Point - SPA Version
 * Single Page Application with client-side routing
 */

import { CONFIG } from './config.js';
import { healthCheck } from './api.js';
import { initModals } from './modals.js';
import { initSearch } from './search.js';
import { showToast } from './utils.js';
import router from './router.js';
import ViewManager from './views/ViewManager.js';
import HomeView from './views/HomeView.js';
import ProfileView from './views/ProfileView.js';
import PostDetailView from './views/PostDetailView.js';
import MessagesView from './views/MessagesView.js';
import { initNavigation } from './navigation.js';

// Create view manager
const viewManager = new ViewManager('#app');

/**
 * Initialize application
 */
async function initApp() {
    console.log('Initializing Woof SPA...');

    // Check API health
    try {
        const isHealthy = await healthCheck();
        if (!isHealthy) {
            showToast('Backend API is unavailable', 'error');
        }
    } catch (error) {
        console.warn('API health check failed:', error);
    }

    // Initialize common functionality (runs once, persists across views)
    initModals();
    initSearch();
    await initNavigation();

    // Define routes
    router
        .on('/', async ({ params, query }) => {
            await viewManager.render(HomeView, { params, query });
        })
        .on('/dog/:slug', async ({ params, query }) => {
            await viewManager.render(ProfileView, { params, query });
        })
        .on('/post/:id', async ({ params, query }) => {
            await viewManager.render(PostDetailView, { params, query });
        })
        .on('/messages', async ({ params, query }) => {
            await viewManager.render(MessagesView, { params, query });
        })
        .on('/messages/:id', async ({ params, query }) => {
            await viewManager.render(MessagesView, { params, query });
        })
        .notFound(async ({ path }) => {
            console.warn('404 - Page not found:', path);
            // Redirect to home for now
            router.navigate('/');
        })
        .start();

    console.log('Woof SPA initialized successfully');
}

/**
 * Handle errors globally
 */
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
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
window.WoofApp = {
    CONFIG,
    router,
    viewManager,
    reinit: initApp
};
