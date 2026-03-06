/**
 * Toast Store
 * Svelte 5 $state store for toast notifications.
 * Replaces DOM-manipulation showToast() in utils.js.
 */

export let toasts = $state([]);
let _id = 0;

/**
 * Show a toast notification.
 * @param {string} message - Toast text
 * @param {'info'|'success'|'error'} type - Toast style
 * @param {{ label: string, href: string }|null} action - Optional clickable link
 */
export function showToast(message, type = 'info', action = null) {
    // Sanitize action: only allow internal paths
    if (action && (!action.href || !action.href.startsWith('/'))) {
        action = null;
    }
    const id = ++_id;
    toasts.push({ id, message, type, action });
    setTimeout(() => {
        const idx = toasts.findIndex(t => t.id === id);
        if (idx !== -1) toasts.splice(idx, 1);
    }, action ? 5000 : 3000);
}
