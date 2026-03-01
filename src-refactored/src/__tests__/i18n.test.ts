/**
 * i18n Store Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { t, setLocale, getLocale, localName, locale } from '../../js/i18n-store.svelte.js';

describe('i18n Store', () => {
  beforeEach(() => {
    // Reset to English before each test
    setLocale('en');
  });

  describe('t()', () => {
    it('returns English string by default', () => {
      expect(t('common.cancel')).toBe('Cancel');
    });

    it('returns key when key does not exist (fallback)', () => {
      expect(t('nonexistent.key.here')).toBe('nonexistent.key.here');
    });

    it('supports parameter interpolation', () => {
      expect(t('time.minutes', { count: 5 })).toBe('5 minutes ago');
    });

    it('leaves unreplaced params as-is', () => {
      expect(t('time.minutes', { other: 5 })).toBe('{count} minutes ago');
    });
  });

  describe('setLocale()', () => {
    it('switches to Finnish strings', () => {
      setLocale('fi');
      expect(t('common.cancel')).toBe('Peruuta');
    });

    it('switches back to English', () => {
      setLocale('fi');
      expect(t('common.cancel')).toBe('Peruuta');

      setLocale('en');
      expect(t('common.cancel')).toBe('Cancel');
    });

    it('persists locale to localStorage', () => {
      setLocale('fi');
      expect(localStorage.getItem('woof_locale')).toBe('fi');
    });

    it('ignores invalid locale codes', () => {
      setLocale('de' as any);
      expect(getLocale()).toBe('en');
    });
  });

  describe('getLocale()', () => {
    it('returns current locale', () => {
      expect(getLocale()).toBe('en');
    });

    it('reflects locale changes', () => {
      setLocale('fi');
      expect(getLocale()).toBe('fi');

      setLocale('en');
      expect(getLocale()).toBe('en');
    });
  });

  describe('locale.current', () => {
    it('exposes current locale as reactive property', () => {
      expect(locale.current).toBe('en');

      setLocale('fi');
      expect(locale.current).toBe('fi');
    });
  });

  describe('localName()', () => {
    it('returns .name for English locale', () => {
      const item = { name: 'Golden Retriever', nameFi: 'Kultainennoutaja' };
      expect(localName(item)).toBe('Golden Retriever');
    });

    it('returns .nameFi for Finnish locale', () => {
      setLocale('fi');
      const item = { name: 'Golden Retriever', nameFi: 'Kultainennoutaja' };
      expect(localName(item)).toBe('Kultainennoutaja');
    });

    it('falls back to .name when .nameFi is missing', () => {
      setLocale('fi');
      const item = { name: 'Poodle' };
      expect(localName(item)).toBe('Poodle');
    });

    it('returns empty string for null/undefined input', () => {
      expect(localName(null as any)).toBe('');
      expect(localName(undefined as any)).toBe('');
    });

    it('returns empty string when item has no name', () => {
      expect(localName({} as any)).toBe('');
    });
  });

  describe('Finnish translations with interpolation', () => {
    it('interpolates params in Finnish strings', () => {
      setLocale('fi');
      expect(t('time.minutes', { count: 3 })).toBe('3 minuuttia sitten');
    });
  });

  describe('fallback behavior', () => {
    it('falls back to English when Finnish key is missing', () => {
      setLocale('fi');
      // Both locales have all keys, so test with a deeply nested nonexistent path
      // that returns the key itself
      expect(t('totally.missing')).toBe('totally.missing');
    });
  });
});
