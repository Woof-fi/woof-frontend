/**
 * Utility Functions
 * Reusable helper functions for the application
 */
import { showToast as _showToast } from './toast-store.svelte.js';
import { t } from './i18n-store.svelte.js';

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
 * Show toast notification
 * Delegates to toast-store.svelte.js which renders via Toast.svelte component.
 * @param {string} message - Message to show
 * @param {string} type - Type of toast ('success', 'error', 'info')
 */
export function showToast(message, type = 'info') { _showToast(message, type); }

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
