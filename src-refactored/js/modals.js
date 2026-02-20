/**
 * Modal Coordinator
 * Initializes all modals and provides shared close-all functionality.
 * Manages browser history so the back button closes modals on mobile.
 */

import { initAuthModal, openAuthModal, updateUIForAuth, closeAuthModal } from './auth-modal.js';
import { initCreatePostModal, closeCreatePostModal } from './create-post-modal.js';
import { initCreateDogModal, closeCreateDogModal } from './create-dog-modal.js';
import { initCartModal, closeCartDrawer } from './cart-modal.js';
import { initEditDogModal, closeEditDogModal } from './edit-dog-modal.js';
import { initHealthRecordModal, closeHealthRecordModal } from './health-record-modal.js';
import { toggleBodyScroll } from './ui.js';

// Re-export for existing consumers (posts.js, modals.test.ts)
export { openAuthModal, updateUIForAuth };

// Track whether a modal pushed a history state
let modalStateActive = false;
// Prevent close from triggering history.back() when popstate already fired
let closingFromPopstate = false;
// Set when popModalState calls history.back() so the router skips the resulting popstate
let poppingModalState = false;

/**
 * Push a history state when opening a modal.
 * Call this from each modal/panel open function.
 */
export function pushModalState() {
    if (!modalStateActive) {
        history.pushState({ modal: true }, '', window.location.pathname + window.location.search);
        modalStateActive = true;
    }
}

/**
 * Pop the modal history state when closing programmatically (close button, overlay click).
 * Call this from each modal/panel close function.
 */
export function popModalState() {
    if (modalStateActive && !closingFromPopstate) {
        modalStateActive = false;
        poppingModalState = true;
        history.back();
    }
    closingFromPopstate = false;
}

/**
 * Check if popstate should be handled as a modal close.
 * Called from the router's popstate handler.
 * @returns {boolean} true if a modal was closed (router should skip routing)
 */
export function handleModalPopstate() {
    // Modal was closed programmatically and history.back() fired — skip routing
    if (poppingModalState) {
        poppingModalState = false;
        return true;
    }
    // User pressed browser back while modal is open — close it
    if (modalStateActive) {
        modalStateActive = false;
        closingFromPopstate = true;
        closeAllModals();
        return true;
    }
    return false;
}

/**
 * Initialize all modals
 */
export function initModals() {
    initCreatePostModal();
    initCreateDogModal();
    initEditDogModal();
    initCartModal();
    initHealthRecordModal();
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
    // Pop history state if closing via Escape key (not from popstate)
    if (!closingFromPopstate && modalStateActive) {
        modalStateActive = false;
        poppingModalState = true;
        history.back();
    }
    closingFromPopstate = false;

    closeCreatePostModal();
    closeCreateDogModal();
    closeEditDogModal();
    closeCartDrawer();
    closeHealthRecordModal();
    closeAuthModal();

    const searchPanel = document.getElementById('search-panel');
    if (searchPanel && searchPanel.classList.contains('active')) {
        searchPanel.classList.remove('active');
        searchPanel.setAttribute('aria-hidden', 'true');
        toggleBodyScroll(false);
    }
}
