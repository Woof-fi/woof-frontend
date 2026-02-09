/**
 * Authentication Module
 * Handles user authentication, token management, and user state
 */

import { showToast } from './utils';
import { CONFIG } from './config';
import type { User, AuthResponse } from '../types/api';

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

/**
 * Save authentication token to localStorage
 */
export function saveToken(token: string): void {
    try {
        localStorage.setItem('auth_token', token);
    } catch (error) {
        console.error('Failed to save token:', error);
    }
}

/**
 * Get authentication token from localStorage
 */
export function getToken(): string | null {
    try {
        return localStorage.getItem('auth_token');
    } catch (error) {
        console.error('Failed to get token:', error);
        return null;
    }
}

/**
 * Clear authentication token from localStorage
 */
export function clearToken(): void {
    try {
        localStorage.removeItem('auth_token');
    } catch (error) {
        console.error('Failed to clear token:', error);
    }
}

// ============================================================================
// USER STATE MANAGEMENT
// ============================================================================

let currentUser: User | null = null;

/**
 * Set current user in memory and localStorage
 */
export function setCurrentUser(user: User): void {
    currentUser = user;
    try {
        localStorage.setItem('current_user', JSON.stringify(user));
    } catch (error) {
        console.error('Failed to save user:', error);
    }
}

/**
 * Get current user from memory or localStorage
 */
export function getCurrentUser(): User | null {
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

/**
 * Clear current user from memory and localStorage
 */
export function clearCurrentUser(): void {
    currentUser = null;
    try {
        localStorage.removeItem('current_user');
    } catch (error) {
        console.error('Failed to clear user:', error);
    }
}

// ============================================================================
// AUTH STATE
// ============================================================================

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
    return !!getToken();
}

/**
 * Logout user
 */
export function logout(): void {
    clearToken();
    clearCurrentUser();
    showToast('Logged out successfully', 'success');
    window.location.href = 'index.html';
}

// ============================================================================
// API CALLS
// ============================================================================

/**
 * Make authenticated API request
 */
async function authRequest<T>(endpoint: string, data: unknown): Promise<T> {
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

    return result as T;
}

/**
 * Register new user
 */
export async function register(email: string, password: string, name: string): Promise<AuthResponse> {
    try {
        const result = await authRequest<AuthResponse>('/api/auth/register', { email, password, name });
        saveToken(result.token);
        setCurrentUser(result.user);
        showToast('Account created successfully!', 'success');
        return result;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Registration failed';
        showToast(message, 'error');
        throw error;
    }
}

/**
 * Login existing user
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
    try {
        const result = await authRequest<AuthResponse>('/api/auth/login', { email, password });
        saveToken(result.token);
        setCurrentUser(result.user);
        showToast('Logged in successfully!', 'success');
        return result;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Login failed';
        showToast(message, 'error');
        throw error;
    }
}
