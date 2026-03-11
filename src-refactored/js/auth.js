/**
 * Authentication Module
 * Handles user authentication via AWS Cognito and user state management.
 * When VITE_MOCK_AUTH=true, bypasses Cognito for local development.
 */

import {
    CognitoUserPool,
    CognitoUser,
    AuthenticationDetails,
    CognitoUserAttribute
} from 'amazon-cognito-identity-js';
import { showToast } from './utils.js';
import { CONFIG } from './config.js';
import { t } from './i18n-store.svelte.js';

const MOCK_AUTH = import.meta.env.VITE_MOCK_AUTH === 'true';

// In mock mode, store registered users in memory
const mockUsers = MOCK_AUTH ? new Map() : null;

const userPool = MOCK_AUTH ? null : new CognitoUserPool({
    UserPoolId: CONFIG.COGNITO.USER_POOL_ID,
    ClientId: CONFIG.COGNITO.CLIENT_ID,
});

function getCognitoUser(email) {
    return new CognitoUser({ Username: email, Pool: userPool });
}

/**
 * Map Cognito error codes to safe, user-friendly messages.
 * Avoids leaking whether an email/account exists in the system.
 */
function sanitizeAuthError(err) {
    switch (err.code) {
        case 'UserNotFoundException':
        case 'NotAuthorizedException':
            return t('auth.errIncorrect');
        case 'UsernameExistsException':
            return t('auth.errRegistration');
        case 'InvalidPasswordException':
            return t('auth.errPassword');
        case 'CodeMismatchException':
            return t('auth.errInvalidCode');
        case 'ExpiredCodeException':
            return t('auth.errExpiredCode');
        case 'LimitExceededException':
        case 'TooManyRequestsException':
            return t('auth.errTooMany');
        case 'InvalidParameterException':
            return t('auth.errInvalidInput');
        case 'UserNotConfirmedException':
            return t('auth.errUnconfirmed');
        default:
            return t('auth.errGeneric');
    }
}

// Prevent concurrent refresh calls
let refreshPromise = null;

// Token management — store ID token for synchronous access
function saveToken(token) {
    try {
        localStorage.setItem('auth_token', token);
    } catch (error) {
        console.error('Failed to save token:', error);
    }
}

export function getToken() {
    try {
        return localStorage.getItem('auth_token');
    } catch (error) {
        console.error('Failed to get token:', error);
        return null;
    }
}

function clearToken() {
    try {
        localStorage.removeItem('auth_token');
    } catch (error) {
        console.error('Failed to clear token:', error);
    }
}

// User state management
let currentUser = null;

export function setCurrentUser(user) {
    currentUser = user;
    try {
        localStorage.setItem('current_user', JSON.stringify(user));
    } catch (error) {
        console.error('Failed to save user:', error);
    }
}

export function getCurrentUser() {
    if (currentUser) return currentUser;

    try {
        const stored = localStorage.getItem('current_user');
        currentUser = stored ? JSON.parse(stored) : null;
        return currentUser;
    } catch (error) {
        console.error('Failed to get user:', error);
        return null;
    }
}

export function clearCurrentUser() {
    currentUser = null;
    try {
        localStorage.removeItem('current_user');
    } catch (error) {
        console.error('Failed to clear user:', error);
    }
}

export function isAuthenticated() {
    return !!getToken();
}

/**
 * Register — calls Cognito signUp.
 * Does NOT auto-login; user must verify email first.
 *
 * If the email already exists as an unconfirmed user (e.g. previous failed
 * attempt), we silently resend the confirmation code instead of showing an
 * error. The user sees the same "check your email" message either way, which
 * also prevents account-enumeration attacks.
 */
export async function register(email, password, name) {
    if (MOCK_AUTH) {
        mockUsers.set(email, { email, password, name });
        showToast(t('auth.accountCreated'), 'success');
        return { user: { username: email } };
    }

    const attributes = [
        new CognitoUserAttribute({ Name: 'email', Value: email }),
        new CognitoUserAttribute({ Name: 'name', Value: name }),
    ];

    return new Promise((resolve, reject) => {
        userPool.signUp(email, password, attributes, null, async (err, result) => {
            if (err) {
                if (err.code === 'UsernameExistsException') {
                    // User exists — try to resend verification code.
                    // If the account is unconfirmed this lets them complete signup.
                    // If already confirmed, resend will fail silently and the user
                    // can use "forgot password" from the login screen.
                    try {
                        const cognitoUser = getCognitoUser(email);
                        await new Promise((res, rej) => {
                            cognitoUser.resendConfirmationCode((resendErr) => {
                                resendErr ? rej(resendErr) : res();
                            });
                        });
                    } catch {
                        // Resend failed (user already confirmed, or other issue).
                        // Show the same generic message to avoid leaking info.
                    }
                    showToast(t('auth.checkEmail'), 'success');
                    resolve({ user: { username: email } });
                    return;
                }

                showToast(sanitizeAuthError(err), 'error');
                reject(err);
                return;
            }
            showToast(t('auth.accountCreated'), 'success');
            resolve(result);
        });
    });
}

/**
 * Confirm registration with the verification code sent via email
 */
export async function confirmRegistration(email, code) {
    if (MOCK_AUTH) {
        showToast(t('auth.emailVerified'), 'success');
        return 'SUCCESS';
    }

    const cognitoUser = getCognitoUser(email);

    return new Promise((resolve, reject) => {
        cognitoUser.confirmRegistration(code, true, (err, result) => {
            if (err) {
                showToast(sanitizeAuthError(err), 'error');
                reject(err);
                return;
            }
            resolve(result);
        });
    });
}

/**
 * Resend the verification code to the user's email
 */
export async function resendConfirmationCode(email) {
    if (MOCK_AUTH) {
        showToast(t('auth.codeResentFull'), 'success');
        return {};
    }

    const cognitoUser = getCognitoUser(email);

    return new Promise((resolve, reject) => {
        cognitoUser.resendConfirmationCode((err, result) => {
            if (err) {
                showToast(sanitizeAuthError(err), 'error');
                reject(err);
                return;
            }
            showToast(t('auth.codeResentFull'), 'success');
            resolve(result);
        });
    });
}

/**
 * Login — authenticates with Cognito, then syncs user record to backend
 */
export async function login(email, password) {
    if (MOCK_AUTH) {
        const fakeToken = `mock-cognito-${email}`;
        saveToken(fakeToken);

        // Sync user to backend
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/auth/sync`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${fakeToken}`,
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            if (response.ok) {
                setCurrentUser(data.user);
            }
        } catch (error) {
            console.error('User sync failed:', error);
        }

        showToast(t('auth.loggedIn'), 'success');
        return { getIdToken: () => ({ getJwtToken: () => fakeToken }) };
    }

    const authDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
    });
    const cognitoUser = getCognitoUser(email);

    const session = await new Promise((resolve, reject) => {
        cognitoUser.authenticateUser(authDetails, {
            onSuccess: (session) => resolve(session),
            onFailure: (err) => {
                showToast(sanitizeAuthError(err), 'error');
                reject(err);
            },
        });
    });

    // Store ID token for synchronous getToken() access
    const idToken = session.getIdToken().getJwtToken();
    saveToken(idToken);

    // Sync user to backend (creates DB record if first login)
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/auth/sync`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json();
        if (response.ok) {
            setCurrentUser(data.user);
        }
    } catch (error) {
        console.error('User sync failed:', error);
    }

    showToast(t('auth.loggedIn'), 'success');
    return session;
}

/**
 * Initiate forgot-password flow — sends reset code to email
 */
export async function forgotPassword(email) {
    if (MOCK_AUTH) {
        showToast(t('auth.resetCodeSent'), 'success');
        return {};
    }

    const cognitoUser = getCognitoUser(email);

    return new Promise((resolve, reject) => {
        cognitoUser.forgotPassword({
            onSuccess: (data) => {
                showToast(t('auth.resetCodeSent'), 'success');
                resolve(data);
            },
            onFailure: (err) => {
                if (err.code === 'UserNotFoundException') {
                    // Don't reveal that the account doesn't exist
                    showToast(t('auth.resetCodeSent'), 'success');
                    resolve({});
                    return;
                }
                showToast(sanitizeAuthError(err), 'error');
                reject(err);
            },
        });
    });
}

/**
 * Confirm new password using the reset code
 */
export async function confirmNewPassword(email, code, newPassword) {
    if (MOCK_AUTH) {
        showToast(t('auth.passwordResetSuccess'), 'success');
        return;
    }

    const cognitoUser = getCognitoUser(email);

    return new Promise((resolve, reject) => {
        cognitoUser.confirmPassword(code, newPassword, {
            onSuccess: () => {
                showToast(t('auth.passwordResetSuccess'), 'success');
                resolve();
            },
            onFailure: (err) => {
                showToast(sanitizeAuthError(err), 'error');
                reject(err);
            },
        });
    });
}

/**
 * Change password for the currently authenticated user.
 * Requires a valid Cognito session (user must be logged in).
 * @param {string} oldPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
export async function changePassword(oldPassword, newPassword) {
    if (MOCK_AUTH) {
        showToast(t('settings.passwordChanged'), 'success');
        return;
    }

    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
        throw new Error('No authenticated user');
    }

    // Cognito requires an active session for changePassword
    await new Promise((resolve, reject) => {
        cognitoUser.getSession((err, session) => {
            if (err || !session?.isValid()) {
                reject(err || new Error('Invalid session'));
                return;
            }
            resolve(session);
        });
    });

    return new Promise((resolve, reject) => {
        cognitoUser.changePassword(oldPassword, newPassword, (err, result) => {
            if (err) {
                showToast(sanitizeAuthError(err), 'error');
                reject(err);
                return;
            }
            showToast(t('settings.passwordChanged'), 'success');
            resolve(result);
        });
    });
}

/**
 * Logout — signs out of Cognito and clears local state
 */
export function logout() {
    if (!MOCK_AUTH) {
        const cognitoUser = userPool.getCurrentUser();
        if (cognitoUser) {
            cognitoUser.signOut();
        }
    }
    clearToken();
    clearCurrentUser();
    showToast(t('auth.loggedOut'), 'success');
    window.location.href = '/';
}

/**
 * Refresh the Cognito session and update stored token.
 * Call on app init to keep the token fresh.
 * Deduplicates concurrent calls — safe to call from multiple places at once.
 * @returns {Promise<boolean>} true if session is valid
 */
export async function refreshSession() {
    if (MOCK_AUTH) {
        return !!getToken();
    }

    // Deduplicate concurrent refresh calls
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        const cognitoUser = userPool.getCurrentUser();
        if (!cognitoUser) return false;

        return new Promise((resolve) => {
            cognitoUser.getSession((err, session) => {
                if (err || !session || !session.isValid()) {
                    clearToken();
                    clearCurrentUser();
                    resolve(false);
                    return;
                }
                saveToken(session.getIdToken().getJwtToken());
                resolve(true);
            });
        });
    })();

    try {
        return await refreshPromise;
    } finally {
        refreshPromise = null;
    }
}

/**
 * Callback invoked when the session cannot be recovered.
 * Set by App.svelte so the auth module can clear Svelte reactive state
 * without importing the Svelte store (avoids circular dependency).
 * @type {(() => void) | null}
 */
let onSessionCleared = null;

/** Register a callback for session-cleared events. */
export function setOnSessionCleared(cb) {
    onSessionCleared = cb;
}

/**
 * Handle an expired/invalid session detected by the API layer.
 * Attempts to refresh. If refresh fails, clears auth state and notifies the user.
 * @returns {Promise<boolean>} true if session was successfully refreshed
 */
export async function handleSessionExpired() {
    const refreshed = await refreshSession();
    if (!refreshed) {
        clearToken();
        clearCurrentUser();
        onSessionCleared?.();
        showToast(t('auth.sessionExpired'), 'info');
        return false;
    }
    return true;
}
