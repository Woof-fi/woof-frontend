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
 */
export async function register(email, password, name) {
    if (MOCK_AUTH) {
        mockUsers.set(email, { email, password, name });
        showToast('Account created! (mock mode — no email sent)', 'success');
        return { user: { username: email } };
    }

    const attributes = [
        new CognitoUserAttribute({ Name: 'email', Value: email }),
        new CognitoUserAttribute({ Name: 'name', Value: name }),
    ];

    return new Promise((resolve, reject) => {
        userPool.signUp(email, password, attributes, null, (err, result) => {
            if (err) {
                showToast(err.message || 'Registration failed', 'error');
                reject(err);
                return;
            }
            showToast('Account created! Check your email for a verification code.', 'success');
            resolve(result);
        });
    });
}

/**
 * Confirm registration with the verification code sent via email
 */
export async function confirmRegistration(email, code) {
    if (MOCK_AUTH) {
        showToast('Email verified! (mock mode)', 'success');
        return 'SUCCESS';
    }

    const cognitoUser = getCognitoUser(email);

    return new Promise((resolve, reject) => {
        cognitoUser.confirmRegistration(code, true, (err, result) => {
            if (err) {
                showToast(err.message || 'Verification failed', 'error');
                reject(err);
                return;
            }
            showToast('Email verified! You can now log in.', 'success');
            resolve(result);
        });
    });
}

/**
 * Resend the verification code to the user's email
 */
export async function resendConfirmationCode(email) {
    if (MOCK_AUTH) {
        showToast('Verification code resent! (mock mode)', 'success');
        return {};
    }

    const cognitoUser = getCognitoUser(email);

    return new Promise((resolve, reject) => {
        cognitoUser.resendConfirmationCode((err, result) => {
            if (err) {
                showToast(err.message || 'Failed to resend code', 'error');
                reject(err);
                return;
            }
            showToast('Verification code resent! Check your email.', 'success');
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

        showToast('Logged in successfully! (mock mode)', 'success');
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
                showToast(err.message || 'Login failed', 'error');
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

    showToast('Logged in successfully!', 'success');
    return session;
}

/**
 * Initiate forgot-password flow — sends reset code to email
 */
export async function forgotPassword(email) {
    if (MOCK_AUTH) {
        showToast('Password reset code sent! (mock mode)', 'success');
        return {};
    }

    const cognitoUser = getCognitoUser(email);

    return new Promise((resolve, reject) => {
        cognitoUser.forgotPassword({
            onSuccess: (data) => {
                showToast('Password reset code sent! Check your email.', 'success');
                resolve(data);
            },
            onFailure: (err) => {
                showToast(err.message || 'Failed to send reset code', 'error');
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
        showToast('Password reset successful! (mock mode)', 'success');
        return;
    }

    const cognitoUser = getCognitoUser(email);

    return new Promise((resolve, reject) => {
        cognitoUser.confirmPassword(code, newPassword, {
            onSuccess: () => {
                showToast('Password reset successful! You can now log in.', 'success');
                resolve();
            },
            onFailure: (err) => {
                showToast(err.message || 'Password reset failed', 'error');
                reject(err);
            },
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
    showToast('Logged out successfully', 'success');
    window.location.href = '/';
}

/**
 * Refresh the Cognito session and update stored token.
 * Call on app init to keep the token fresh.
 * @returns {Promise<boolean>} true if session is valid
 */
export async function refreshSession() {
    if (MOCK_AUTH) {
        return !!getToken();
    }

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
}
