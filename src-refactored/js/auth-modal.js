/**
 * Auth Modal
 * Handles login/register/verify/forgot-password/reset modal and auth UI state
 */

import { toggleBodyScroll } from './ui.js';
import {
    login,
    register,
    confirmRegistration,
    resendConfirmationCode,
    forgotPassword,
    confirmNewPassword,
    isAuthenticated,
    logout
} from './auth.js';
import { updateProfileNavigation } from './navigation.js';
import { pushModalState, popModalState } from './modals.js';

/**
 * Initialize auth modal
 */
export function initAuthModal() {
    const authModal = document.getElementById('auth-modal');
    const authForm = document.getElementById('auth-form');
    const authTabs = document.querySelectorAll('.auth-tab');
    const authModalTitle = document.getElementById('auth-modal-title');
    const authSubmit = document.getElementById('auth-submit');

    // Form groups
    const emailGroup = document.getElementById('auth-email-group');
    const passwordGroup = document.getElementById('auth-password-group');
    const nameGroup = document.getElementById('auth-name-group');
    const verifyGroup = document.getElementById('auth-verify-group');
    const newPasswordGroup = document.getElementById('auth-new-password-group');
    const passwordReqs = document.getElementById('password-requirements');
    const newPasswordReqs = document.getElementById('new-password-requirements');

    // Secondary actions
    const forgotLink = document.getElementById('auth-forgot-link');
    const resendGroup = document.getElementById('auth-resend-group');
    const backGroup = document.getElementById('auth-back-group');

    // Inputs
    const passwordInput = document.getElementById('auth-password');
    const newPasswordInput = document.getElementById('auth-new-password');

    if (!authModal || !authForm) return;

    // State: 'login' | 'register' | 'verify' | 'forgot' | 'reset'
    let currentMode = 'login';
    let pendingEmail = ''; // email stored across verify/reset flows

    // Visibility map for each mode
    const modeConfig = {
        login: {
            title: 'Login',
            submit: 'Sign In',
            tabs: true,
            email: true,
            password: true,
            name: false,
            verify: false,
            newPassword: false,
            pwReqs: false,
            newPwReqs: false,
            forgotLink: true,
            resendLink: false,
            backLink: false,
        },
        register: {
            title: 'Register',
            submit: 'Sign Up',
            tabs: true,
            email: true,
            password: true,
            name: true,
            verify: false,
            newPassword: false,
            pwReqs: true,
            newPwReqs: false,
            forgotLink: false,
            resendLink: false,
            backLink: false,
        },
        verify: {
            title: 'Verify Email',
            submit: 'Verify',
            tabs: false,
            email: false,
            password: false,
            name: false,
            verify: true,
            newPassword: false,
            pwReqs: false,
            newPwReqs: false,
            forgotLink: false,
            resendLink: true,
            backLink: true,
        },
        forgot: {
            title: 'Forgot Password',
            submit: 'Send Reset Code',
            tabs: false,
            email: true,
            password: false,
            name: false,
            verify: false,
            newPassword: false,
            pwReqs: false,
            newPwReqs: false,
            forgotLink: false,
            resendLink: false,
            backLink: true,
        },
        reset: {
            title: 'Reset Password',
            submit: 'Reset Password',
            tabs: false,
            email: false,
            password: false,
            name: false,
            verify: true,
            newPassword: true,
            pwReqs: false,
            newPwReqs: true,
            forgotLink: false,
            resendLink: false,
            backLink: true,
        },
    };

    function switchMode(mode) {
        currentMode = mode;
        const cfg = modeConfig[mode];

        authModalTitle.textContent = cfg.title;
        authSubmit.textContent = cfg.submit;

        // Tabs
        const tabsContainer = document.getElementById('auth-tabs');
        if (tabsContainer) tabsContainer.style.display = cfg.tabs ? '' : 'none';

        // Form groups
        if (emailGroup) emailGroup.style.display = cfg.email ? '' : 'none';
        if (passwordGroup) passwordGroup.style.display = cfg.password ? '' : 'none';
        if (nameGroup) nameGroup.style.display = cfg.name ? '' : 'none';
        if (verifyGroup) verifyGroup.style.display = cfg.verify ? '' : 'none';
        if (newPasswordGroup) newPasswordGroup.style.display = cfg.newPassword ? '' : 'none';
        if (passwordReqs) passwordReqs.style.display = cfg.pwReqs ? '' : 'none';
        if (newPasswordReqs) newPasswordReqs.style.display = cfg.newPwReqs ? '' : 'none';

        // Toggle required attributes — hidden required fields block form submission on mobile
        const emailInput = document.getElementById('auth-email');
        if (emailInput) emailInput.required = cfg.email;
        if (passwordInput) passwordInput.required = cfg.password;
        const verifyInput = document.getElementById('auth-verify-code');
        if (verifyInput) verifyInput.required = cfg.verify;
        if (newPasswordInput) newPasswordInput.required = !!cfg.newPassword;

        // Secondary actions
        if (forgotLink) forgotLink.style.display = cfg.forgotLink ? '' : 'none';
        if (resendGroup) resendGroup.style.display = cfg.resendLink ? '' : 'none';
        if (backGroup) backGroup.style.display = cfg.backLink ? '' : 'none';

        // Update active tab if tabs are visible
        if (cfg.tabs) {
            authTabs.forEach(t => {
                t.classList.toggle('active', t.dataset.tab === mode);
            });
        }

        // Reset password requirement indicators when switching modes
        if (cfg.pwReqs) updatePasswordRequirements();
        if (cfg.newPwReqs) updateNewPasswordRequirements();
    }

    // Password validation helpers
    function checkPasswordRules(val) {
        return {
            length: val.length >= 8,
            uppercase: /[A-Z]/.test(val),
            lowercase: /[a-z]/.test(val),
            number: /[0-9]/.test(val),
            symbol: /[^A-Za-z0-9]/.test(val),
        };
    }

    function updatePasswordRequirements() {
        if (!passwordReqs || !passwordInput) return;
        const rules = checkPasswordRules(passwordInput.value);
        const el = (id) => document.getElementById(id);
        if (el('req-length')) el('req-length').classList.toggle('met', rules.length);
        if (el('req-uppercase')) el('req-uppercase').classList.toggle('met', rules.uppercase);
        if (el('req-lowercase')) el('req-lowercase').classList.toggle('met', rules.lowercase);
        if (el('req-number')) el('req-number').classList.toggle('met', rules.number);
        if (el('req-symbol')) el('req-symbol').classList.toggle('met', rules.symbol);
    }

    function updateNewPasswordRequirements() {
        if (!newPasswordReqs || !newPasswordInput) return;
        const rules = checkPasswordRules(newPasswordInput.value);
        const el = (id) => document.getElementById(id);
        if (el('new-req-length')) el('new-req-length').classList.toggle('met', rules.length);
        if (el('new-req-uppercase')) el('new-req-uppercase').classList.toggle('met', rules.uppercase);
        if (el('new-req-lowercase')) el('new-req-lowercase').classList.toggle('met', rules.lowercase);
        if (el('new-req-number')) el('new-req-number').classList.toggle('met', rules.number);
        if (el('new-req-symbol')) el('new-req-symbol').classList.toggle('met', rules.symbol);
    }

    // Real-time password validation
    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            if (currentMode === 'register') updatePasswordRequirements();
        });
    }
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', () => {
            if (currentMode === 'reset') updateNewPasswordRequirements();
        });
    }

    // Set initial mode so all form groups have correct visibility
    switchMode('login');

    // Tab switching
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            switchMode(tab.dataset.tab);
        });
    });

    // Forgot password link
    const forgotBtn = document.getElementById('forgot-password-btn');
    if (forgotBtn) {
        forgotBtn.addEventListener('click', (e) => {
            e.preventDefault();
            switchMode('forgot');
        });
    }

    // Resend code link
    const resendBtn = document.getElementById('resend-code-btn');
    if (resendBtn) {
        resendBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (!pendingEmail) return;
            try {
                await resendConfirmationCode(pendingEmail);
            } catch (error) {
                console.error('Resend code error:', error);
            }
        });
    }

    // Back to login link
    const backBtn = document.getElementById('back-to-login-btn');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            switchMode('login');
        });
    }

    // Form submission
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        const name = document.getElementById('auth-name').value;
        const verifyCode = document.getElementById('auth-verify-code').value;
        const newPassword = document.getElementById('auth-new-password')?.value;

        const originalText = authSubmit.textContent;
        authSubmit.disabled = true;

        try {
            switch (currentMode) {
                case 'login': {
                    authSubmit.textContent = 'Logging in...';
                    await login(email, password);
                    closeAuthModal();
                    authForm.reset();
                    await updateProfileNavigation();
                    await updateUIForAuth();
                    window.dispatchEvent(new CustomEvent('auth-state-changed'));
                    break;
                }

                case 'register': {
                    authSubmit.textContent = 'Registering...';
                    await register(email, password, name);
                    // Store email for verify step, switch to verify mode
                    pendingEmail = email;
                    authForm.reset();
                    switchMode('verify');
                    break;
                }

                case 'verify': {
                    authSubmit.textContent = 'Verifying...';
                    await confirmRegistration(pendingEmail, verifyCode);
                    authForm.reset();
                    switchMode('login');
                    break;
                }

                case 'forgot': {
                    authSubmit.textContent = 'Sending...';
                    await forgotPassword(email);
                    pendingEmail = email;
                    authForm.reset();
                    switchMode('reset');
                    break;
                }

                case 'reset': {
                    authSubmit.textContent = 'Resetting...';
                    await confirmNewPassword(pendingEmail, verifyCode, newPassword);
                    authForm.reset();
                    switchMode('login');
                    break;
                }
            }
        } catch (error) {
            console.error('Auth error:', error);
        } finally {
            authSubmit.disabled = false;
            authSubmit.textContent = originalText;
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
