/**
 * Utility Functions
 * Reusable helper functions for the application
 */
import { showToast as _showToast } from './toast-store.svelte.js';
import { t } from './i18n-store.svelte.js';

/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} html - Raw HTML string
 * @returns {string} - Sanitized HTML
 */
export function sanitizeHTML(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
export function escapeHTML(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, char => map[char]);
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Format date to readable string
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date
 */
export function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Format date as relative time ("2 days ago", "45 minutes ago", etc.)
 * @param {Date|string} date - Date to format
 * @returns {string} - Relative time string
 */
export function timeAgo(date) {
    const now = new Date();
    const past = new Date(date);
    const seconds = Math.floor((now - past) / 1000);

    if (seconds < 60) return t('time.justNow');

    const minutes = Math.floor(seconds / 60);
    if (minutes === 1) return t('time.oneMinute');
    if (minutes < 60) return t('time.minutes', { count: minutes });

    const hours = Math.floor(minutes / 60);
    if (hours === 1) return t('time.oneHour');
    if (hours < 24) return t('time.hours', { count: hours });

    const days = Math.floor(hours / 24);
    if (days === 1) return t('time.oneDay');
    if (days < 7) return t('time.days', { count: days });

    const weeks = Math.floor(days / 7);
    if (weeks === 1) return t('time.oneWeek');
    if (weeks < 4) return t('time.weeks', { count: weeks });

    return past.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * Check if element is in viewport
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} - True if in viewport
 */
export function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Generate random username (for demo purposes)
 * @returns {string} - Random username
 */
export function generateUsername() {
    const adjectives = ['happy', 'fluffy', 'playful', 'silly', 'brave'];
    const nouns = ['pup', 'kitty', 'buddy', 'friend', 'pal'];
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNum = Math.floor(Math.random() * 1000);
    return `${randomAdj}_${randomNoun}${randomNum}`;
}

/**
 * Check if running on mobile device
 * @returns {boolean} - True if mobile
 */
export function isMobile() {
    return window.innerWidth <= 768;
}

/**
 * Trap focus within an element (for modals)
 * @param {HTMLElement} element - Element to trap focus in
 */
export function trapFocus(element) {
    const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    element.addEventListener('keydown', function(e) {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
                lastFocusable.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === lastFocusable) {
                firstFocusable.focus();
                e.preventDefault();
            }
        }
    });
}

/**
 * Show toast notification
 * Delegates to toast-store.svelte.js which renders via Toast.svelte component.
 * @param {string} message - Message to show
 * @param {string} type - Type of toast ('success', 'error', 'info')
 */
export function showToast(message, type = 'info') { _showToast(message, type); }

/**
 * Create loading spinner element
 * @returns {HTMLElement} - Loading spinner
 */
export function createLoadingSpinner() {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.setAttribute('role', 'status');
    spinner.setAttribute('aria-label', 'Loading');

    const spinnerInner = document.createElement('div');
    spinnerInner.className = 'spinner';
    spinner.appendChild(spinnerInner);

    return spinner;
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate file type
 * @param {File} file - File to validate
 * @param {string[]} allowedTypes - Allowed MIME types
 * @returns {boolean} - True if valid
 */
export function isValidFileType(file, allowedTypes = ['image/jpeg', 'image/png', 'image/webp']) {
    return allowedTypes.includes(file.type);
}

/**
 * Validate file size
 * @param {File} file - File to validate
 * @param {number} maxSizeMB - Maximum size in MB
 * @returns {boolean} - True if valid
 */
export function isValidFileSize(file, maxSizeMB = 5) {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
}

/**
 * Return a CDN image variant URL.
 * Lambda generates _medium (600px) and _thumb (150px) variants for posts/ images.
 * Inserts the variant suffix before the file extension: photo.jpg → photo_medium.jpg
 * Returns the original URL unchanged for non-CDN URLs (e.g. direct S3, dog profile photos).
 * @param {string} url - Original CDN image URL
 * @param {'medium'|'thumb'} variant - Desired variant
 * @returns {string}
 */
export function imageVariant(url, variant) {
    if (!url || !url.includes('cdn.woofapp.fi')) return url;
    const lastSlash = url.lastIndexOf('/');
    const dot = url.lastIndexOf('.');
    if (dot === -1 || dot < lastSlash) return url;
    return url.slice(0, dot) + `_${variant}` + url.slice(dot);
}
