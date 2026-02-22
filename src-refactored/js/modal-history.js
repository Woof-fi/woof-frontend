/**
 * Modal History
 * Browser history management for modal back-button closing.
 * Extracted from modals.js so Svelte components can import without
 * pulling in all the vanilla-JS modal initialisation code.
 */

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
        // Dispatch event so all Svelte modals close themselves
        window.dispatchEvent(new CustomEvent('close-all-modals'));
        return true;
    }
    return false;
}
