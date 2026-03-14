/**
 * UI Helper Functions
 */

/**
 * Toggle body scroll (for modals)
 * @param {boolean} disable - True to disable scroll
 */
export function toggleBodyScroll(disable) {
    if (disable) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}
