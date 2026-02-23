/**
 * Toast Store
 * Svelte 5 $state store for toast notifications.
 * Replaces DOM-manipulation showToast() in utils.js.
 */

export let toasts = $state([]);
let _id = 0;

export function showToast(message, type = 'info') {
    const id = ++_id;
    toasts.push({ id, message, type });
    setTimeout(() => {
        const idx = toasts.findIndex(t => t.id === id);
        if (idx !== -1) toasts.splice(idx, 1);
    }, 3000);
}
