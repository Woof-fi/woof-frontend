/**
 * Authentication Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveToken,
  getToken,
  clearToken,
  setCurrentUser,
  getCurrentUser,
  clearCurrentUser,
  isAuthenticated
} from '../../js/auth.js';

describe('Authentication Module', () => {
  beforeEach(() => {
    // Clear both localStorage and in-memory cache
    localStorage.clear();
    clearToken();
    clearCurrentUser();
  });

  describe('Token Management', () => {
    it('should save and retrieve token', () => {
      const testToken = 'test-jwt-token';
      saveToken(testToken);
      expect(getToken()).toBe(testToken);
    });

    it('should return null when no token exists', () => {
      expect(getToken()).toBeNull();
    });

    it('should clear token', () => {
      saveToken('test-token');
      clearToken();
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

      // Verify data is in localStorage
      const retrieved = JSON.parse(localStorage.getItem('current_user') || 'null');
      expect(retrieved).toEqual(testUser);
    });
  });

  describe('Authentication Status', () => {
    it('should return true when token exists', () => {
      saveToken('test-token');
      expect(isAuthenticated()).toBe(true);
    });

    it('should return false when no token exists', () => {
      expect(isAuthenticated()).toBe(false);
    });

    it('should return false after clearing token', () => {
      saveToken('test-token');
      clearToken();
      expect(isAuthenticated()).toBe(false);
    });
  });
});
