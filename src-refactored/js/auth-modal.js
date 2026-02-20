/**
 * Auth Modal
 * Handles login/register modal and auth UI state
 */

import { toggleBodyScroll } from './ui.js';
import { login, register, isAuthenticated, logout } from './auth.js';
import { updateProfileNavigation } from './navigation.js';
import { pushModalState, popModalState } from './modals.js';

/**
 * Initialize auth modal
 */
export function initAuthModal() {
    const authModal = document.getElementById('auth-modal');
    const authForm = document.getElementById('auth-form');
    const authTabs = document.querySelectorAll('.auth-tab');
    const nameGroup = document.getElementById('auth-name-group');
    const authSubmit = document.getElementById('auth-submit');
    const authModalTitle = document.getElementById('auth-modal-title');

    if (!authModal || !authForm) return;

    let currentMode = 'login'; // 'login' or 'register'
    const passwordInput = document.getElementById('auth-password');
    const passwordReqs = document.getElementById('password-requirements');

    // Real-time password validation (register mode only)
    function updatePasswordRequirements() {
        if (currentMode !== 'register' || !passwordReqs) return;
        const val = passwordInput.value;
        const checks = {
            'req-length': val.length >= 8,
            'req-uppercase': /[A-Z]/.test(val),
            'req-lowercase': /[a-z]/.test(val),
            'req-number': /[0-9]/.test(val)
        };
        for (const [id, met] of Object.entries(checks)) {
            const el = document.getElementById(id);
            if (el) el.classList.toggle('met', met);
        }
    }

    if (passwordInput) {
        passwordInput.addEventListener('input', updatePasswordRequirements);
    }

    // Tab switching
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active tab
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Switch mode
            const mode = tab.dataset.tab;
            currentMode = mode;

            // Update UI based on mode
            if (mode === 'register') {
                nameGroup.style.display = 'block';
                authSubmit.textContent = 'Sign Up';
                authModalTitle.textContent = 'Register';
                if (passwordReqs) passwordReqs.style.display = '';
                updatePasswordRequirements();
            } else {
                nameGroup.style.display = 'none';
                authSubmit.textContent = 'Sign In';
                authModalTitle.textContent = 'Login';
                if (passwordReqs) passwordReqs.style.display = 'none';
            }
        });
    });

    // Form submission
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        const name = document.getElementById('auth-name').value;

        const submitButton = authForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = currentMode === 'login' ? 'Logging in...' : 'Registering...';

        try {
            if (currentMode === 'register') {
                await register(email, password, name);
            } else {
                await login(email, password);
            }

            closeAuthModal();
            authForm.reset();

            // Update navigation after successful auth
            await updateProfileNavigation();
            await updateUIForAuth();

            // Notify other modules (e.g., removes content gate from feed)
            window.dispatchEvent(new CustomEvent('auth-state-changed'));
        } catch (error) {
            // Error already shown by login()/register()
            console.error('Auth error:', error);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });

    // Close buttons
    const closeButtons = authModal.querySelectorAll('.modal-close');
    closeButtons.forEach(button => {
        button.addEventListener('click', closeAuthModal);
    });

    // Close on outside click
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
            closeAuthModal();
        }
    });
}

/**
 * Open auth modal
 */
export function openAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.style.display = 'block';
        modal.removeAttribute('aria-hidden');
        toggleBodyScroll(true);
        pushModalState();
    }
}

/**
 * Close auth modal
 */
export function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (!modal || modal.style.display === 'none') return;

    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    toggleBodyScroll(false);
    popModalState();
}

/**
 * Update UI based on authentication state
 */
export async function updateUIForAuth() {
    // Update auth link in header
    const authLinks = document.querySelectorAll('.auth-link');

    authLinks.forEach(authLink => {
        if (!authLink) return;

        if (isAuthenticated()) {
            authLink.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
            authLink.onclick = (e) => {
                e.preventDefault();
                if (confirm('Are you sure you want to logout?')) {
                    logout();
                }
            };
        } else {
            authLink.innerHTML = '<i class="fas fa-user-circle"></i> Login';
            authLink.onclick = (e) => {
                e.preventDefault();
                openAuthModal();
            };
        }
    });

    // Update navigation visibility
    const messagesLinks = document.querySelectorAll('a[aria-label="Messages"]');

    if (isAuthenticated()) {
        messagesLinks.forEach(link => {
            link.style.display = '';
        });
    } else {
        messagesLinks.forEach(link => {
            link.style.display = 'none';
        });
    }

    // Profile navigation is handled dynamically by navigation.js
    await updateProfileNavigation();
}
