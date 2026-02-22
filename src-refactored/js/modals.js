/**
 * Modal Coordinator (legacy shim)
 * The push/pop/handle functions are the canonical implementations.
 * All Svelte modal components now use js/modal-history.js directly.
 * This file is kept for backwards compatibility with:
 *   - js/auth-modal.js (still used by modals.test.ts)
 *   - js/search.js (still used by search.test.ts)
 */

import { initAuthModal, openAuthModal, updateUIForAuth, closeAuthModal } from './auth-modal.js';
import { toggleBodyScroll } from './ui.js';

// Re-export for existing consumers (auth-modal.js imports these back from us)
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
 * Initialize legacy modals (auth modal only — others are now Svelte components)
 */
export function initModals() {
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

    closeAuthModal();

    // Dispatch event so all Svelte modals close themselves
    window.dispatchEvent(new CustomEvent('close-all-modals'));

    const searchPanel = document.getElementById('search-panel');
    if (searchPanel && searchPanel.classList.contains('active')) {
        searchPanel.classList.remove('active');
        searchPanel.setAttribute('aria-hidden', 'true');
        toggleBodyScroll(false);
    }
}
