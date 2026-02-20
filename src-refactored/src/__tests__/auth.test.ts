/**
 * Authentication Tests
 * Tests token/user state management (public API only).
 * Cognito SDK interactions are NOT tested here — those are covered by E2E tests.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getToken,
  setCurrentUser,
  getCurrentUser,
  clearCurrentUser,
  isAuthenticated
} from '../../js/auth.js';

describe('Authentication Module', () => {
  beforeEach(() => {
    localStorage.clear();
    clearCurrentUser();
  });

  describe('Token Management', () => {
    it('should return token from localStorage', () => {
      localStorage.setItem('auth_token', 'test-jwt-token');
      expect(getToken()).toBe('test-jwt-token');
    });

    it('should return null when no token exists', () => {
      expect(getToken()).toBeNull();
    });
  });

  describe('User State Management', () => {
    it('should save and retrieve current user', () => {
      const testUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
      };
      setCurrentUser(testUser);
      expect(getCurrentUser()).toEqual(testUser);
    });

    it('should clear current user', () => {
      const testUser = { id: '123', email: 'test@example.com' };
      setCurrentUser(testUser);
      clearCurrentUser();
      expect(getCurrentUser()).toBeNull();
    });

    it('should persist user to localStorage', () => {
      const testUser = { id: '123', email: 'test@example.com' };
      setCurrentUser(testUser);

      const retrieved = JSON.parse(localStorage.getItem('current_user') || 'null');
      expect(retrieved).toEqual(testUser);
    });

    it('should restore user from localStorage when in-memory cache is empty', () => {
      const testUser = { id: '123', email: 'test@example.com' };
      localStorage.setItem('current_user', JSON.stringify(testUser));

      // clearCurrentUser wipes in-memory cache, but we re-set localStorage after
      clearCurrentUser();
      localStorage.setItem('current_user', JSON.stringify(testUser));

      expect(getCurrentUser()).toEqual(testUser);
    });
  });

  describe('Authentication Status', () => {
    it('should return true when token exists', () => {
      localStorage.setItem('auth_token', 'test-token');
      expect(isAuthenticated()).toBe(true);
    });

    it('should return false when no token exists', () => {
      expect(isAuthenticated()).toBe(false);
    });

    it('should return false after removing token', () => {
      localStorage.setItem('auth_token', 'test-token');
      localStorage.removeItem('auth_token');
      expect(isAuthenticated()).toBe(false);
    });
  });
});
