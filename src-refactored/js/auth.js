/**
 * Authentication Module
 * Handles user authentication, token management, and user state
 */

import { showToast } from './utils.js';
import { CONFIG } from './config.js';

// Token management
export function saveToken(token) {
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

export function clearToken() {
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

// Check if user is logged in
export function isAuthenticated() {
    return !!getToken();
}

// Logout
export function logout() {
    clearToken();
    clearCurrentUser();
    showToast('Logged out successfully', 'success');
    window.location.href = 'index.html';
}

// API calls
async function authRequest(endpoint, data) {
    const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'Request failed');
    }

    return result;
}

export async function register(email, password, name) {
    try {
        const result = await authRequest('/api/auth/register', { email, password, name });
        saveToken(result.token);
        setCurrentUser(result.user);
        showToast('Account created successfully!', 'success');
        return result;
    } catch (error) {
        showToast(error.message, 'error');
        throw error;
    }
}

export async function login(email, password) {
    try {
        const result = await authRequest('/api/auth/login', { email, password });
        saveToken(result.token);
        setCurrentUser(result.user);
        showToast('Logged in successfully!', 'success');
        return result;
    } catch (error) {
        showToast(error.message, 'error');
        throw error;
    }
}
