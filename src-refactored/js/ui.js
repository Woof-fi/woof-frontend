/**
 * UI Helper Functions
 * Manages UI state, loading states, and common UI interactions
 */

import { createLoadingSpinner } from './utils.js';

/**
 * Show loading state for an element
 * @param {HTMLElement} element - Element to show loading state
 */
export function showLoading(element) {
    if (!element) return;

    element.dataset.originalContent = element.innerHTML;
    element.innerHTML = '';
    element.appendChild(createLoadingSpinner());
    element.classList.add('is-loading');
    element.setAttribute('aria-busy', 'true');
}

/**
 * Hide loading state for an element
 * @param {HTMLElement} element - Element to hide loading state
 */
export function hideLoading(element) {
    if (!element) return;

    const spinner = element.querySelector('.loading-spinner');
    if (spinner) {
        spinner.remove();
    }

    if (element.dataset.originalContent) {
        element.innerHTML = element.dataset.originalContent;
        delete element.dataset.originalContent;
    }

    element.classList.remove('is-loading');
    element.setAttribute('aria-busy', 'false');
}

/**
 * Show error state for an element
 * @param {HTMLElement} element - Element to show error state
 * @param {string} message - Error message
 * @param {Function} retryCallback - Function to call on retry
 */
export function showError(element, message, retryCallback = null) {
    if (!element) return;

    element.classList.add('has-error');
    element.innerHTML = `
        <div class="error-state" role="alert">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
            ${retryCallback ? '<button class="btn-retry" aria-label="Retry">Try Again</button>' : ''}
        </div>
    `;

    if (retryCallback) {
        const retryBtn = element.querySelector('.btn-retry');
        retryBtn?.addEventListener('click', retryCallback);
    }
}

/**
 * Show empty state for an element
 * @param {HTMLElement} element - Element to show empty state
 * @param {string} message - Empty state message
 * @param {string} icon - Font Awesome icon class
 */
export function showEmptyState(element, message, icon = 'fa-inbox') {
    if (!element) return;

    element.classList.add('is-empty');
    element.innerHTML = `
        <div class="empty-state">
            <i class="fas ${icon}"></i>
            <p>${message}</p>
        </div>
    `;
}

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

/**
 * Focus first focusable element
 * @param {HTMLElement} container - Container element
 */
export function focusFirstElement(container) {
    const focusable = container.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();
}

/**
 * Smooth scroll to element
 * @param {HTMLElement} element - Element to scroll to
 */
export function scrollToElement(element) {
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Toggle element visibility
 * @param {HTMLElement} element - Element to toggle
 * @param {boolean} show - True to show, false to hide
 */
export function toggleElement(element, show) {
    if (!element) return;

    if (show) {
        element.style.display = '';
        element.removeAttribute('aria-hidden');
    } else {
        element.style.display = 'none';
        element.setAttribute('aria-hidden', 'true');
    }
}

/**
 * Animate element addition
 * @param {HTMLElement} element - Element to animate
 */
export function animateIn(element) {
    if (!element) return;

    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';

    requestAnimationFrame(() => {
        element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';

        // Clean up inline styles after animation to release GPU compositing layers.
        // Using setTimeout because transitionend doesn't fire reliably when
        // many elements animate simultaneously (browser batches/skips transitions).
        setTimeout(() => {
            element.style.transition = '';
            element.style.opacity = '';
            element.style.transform = '';
        }, 350);
    });
}

/**
 * Animate element removal
 * @param {HTMLElement} element - Element to animate
 * @param {Function} callback - Callback after animation
 */
export function animateOut(element, callback) {
    if (!element) return;

    element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    element.style.opacity = '0';
    element.style.transform = 'translateY(-20px)';

    setTimeout(() => {
        if (callback) callback();
    }, 300);
}

/**
 * Create skeleton loading element
 * @param {string} type - Type of skeleton ('text', 'image', 'circle')
 * @returns {HTMLElement} - Skeleton element
 */
export function createSkeleton(type = 'text') {
    const skeleton = document.createElement('div');
    skeleton.className = `skeleton skeleton-${type}`;
    skeleton.setAttribute('aria-hidden', 'true');
    return skeleton;
}

/**
 * Show skeleton loading for profile
 * @param {HTMLElement} container - Container element
 */
export function showProfileSkeleton(container) {
    if (!container) return;

    container.innerHTML = `
        <div class="profile-skeleton">
            ${createSkeleton('circle').outerHTML}
            <div class="skeleton-details">
                ${createSkeleton('text').outerHTML}
                ${createSkeleton('text').outerHTML}
                ${createSkeleton('text').outerHTML}
            </div>
        </div>
    `;
}

/**
 * Show skeleton loading for feed
 * @param {HTMLElement} container - Container element
 * @param {number} count - Number of skeleton posts
 */
export function showFeedSkeleton(container, count = 3) {
    if (!container) return;

    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const postSkeleton = document.createElement('div');
        postSkeleton.className = 'post-skeleton';
        postSkeleton.innerHTML = `
            <div class="post-header-skeleton">
                ${createSkeleton('circle').outerHTML}
                ${createSkeleton('text').outerHTML}
            </div>
            ${createSkeleton('image').outerHTML}
            <div class="post-actions-skeleton">
                ${createSkeleton('text').outerHTML}
            </div>
        `;
        container.appendChild(postSkeleton);
    }
}
