/**
 * Modal Coordinator
 * Initializes all modals and provides shared close-all functionality.
 * Individual modal logic lives in dedicated modules.
 */

import { initAuthModal, openAuthModal, updateUIForAuth, closeAuthModal } from './auth-modal.js';
import { initCreatePostModal, closeCreatePostModal } from './create-post-modal.js';
import { initCreateDogModal, closeCreateDogModal } from './create-dog-modal.js';
import { initCartModal, closeCartDrawer } from './cart-modal.js';
import { toggleBodyScroll } from './ui.js';

// Re-export for existing consumers (posts.js, modals.test.ts)
export { openAuthModal, updateUIForAuth };

/**
 * Initialize all modals
 */
export function initModals() {
    initCreatePostModal();
    initCreateDogModal();
    initCartModal();
    initAuthModal();
    updateUIForAuth();

    // Global escape key handler
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

/**
 * Close all open modals
 */
function closeAllModals() {
    closeCreatePostModal();
    closeCreateDogModal();
    closeCartDrawer();
    closeAuthModal();

    const searchPanel = document.getElementById('search-panel');
    if (searchPanel && searchPanel.classList.contains('active')) {
        searchPanel.classList.remove('active');
        toggleBodyScroll(false);
    }
}
