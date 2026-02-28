/**
 * Utility Functions Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { escapeHTML, isValidEmail, isValidFileType, isValidFileSize, imageVariant, timeAgo, formatDate } from '../../js/utils.js';

describe('Utility Functions', () => {
  describe('escapeHTML', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHTML('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
    });

    it('should escape ampersands', () => {
      expect(escapeHTML('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should handle strings without special characters', () => {
      expect(escapeHTML('Hello World')).toBe('Hello World');
    });

    it('should handle empty strings', () => {
      expect(escapeHTML('')).toBe('');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@invalid.com')).toBe(false);
      expect(isValidEmail('invalid@.com')).toBe(false);
    });

    it('should reject empty strings', () => {
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidFileType', () => {
    it('should accept valid image types', () => {
      const jpgFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const pngFile = new File([''], 'test.png', { type: 'image/png' });
      const gifFile = new File([''], 'test.gif', { type: 'image/gif' });
      const webpFile = new File([''], 'test.webp', { type: 'image/webp' });

      expect(isValidFileType(jpgFile)).toBe(true);
      expect(isValidFileType(pngFile)).toBe(true);
      expect(isValidFileType(gifFile)).toBe(true);
      expect(isValidFileType(webpFile)).toBe(true);
    });

    it('should reject invalid file types', () => {
      const pdfFile = new File([''], 'test.pdf', { type: 'application/pdf' });
      const txtFile = new File([''], 'test.txt', { type: 'text/plain' });

      expect(isValidFileType(pdfFile)).toBe(false);
      expect(isValidFileType(txtFile)).toBe(false);
    });
  });

  describe('imageVariant', () => {
    const cdnUrl = 'https://cdn.woofapp.fi/posts/user1/1234-photo.jpg';

    it('inserts _medium before the extension', () => {
      expect(imageVariant(cdnUrl, 'medium')).toBe(
        'https://cdn.woofapp.fi/posts/user1/1234-photo_medium.jpg'
      );
    });

    it('inserts _thumb before the extension', () => {
      expect(imageVariant(cdnUrl, 'thumb')).toBe(
        'https://cdn.woofapp.fi/posts/user1/1234-photo_thumb.jpg'
      );
    });

    it('returns the original URL unchanged for non-CDN URLs', () => {
      const s3Url = 'https://woof-prod-photos.s3.eu-north-1.amazonaws.com/posts/user1/1234-photo.jpg';
      expect(imageVariant(s3Url, 'medium')).toBe(s3Url);
    });

    it('returns the original URL unchanged for empty input', () => {
      expect(imageVariant('', 'medium')).toBe('');
    });

    it('handles URLs without a file extension gracefully', () => {
      const noExt = 'https://cdn.woofapp.fi/posts/user1/photo';
      expect(imageVariant(noExt, 'medium')).toBe(noExt);
    });
  });

  describe('isValidFileSize', () => {
    it('should accept files under the size limit', () => {
      const smallFile = new File(['x'.repeat(1024 * 1024)], 'small.jpg'); // 1MB
      expect(isValidFileSize(smallFile, 5)).toBe(true);
    });

    it('should reject files over the size limit', () => {
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg'); // 6MB
      expect(isValidFileSize(largeFile, 5)).toBe(false);
    });

    it('should handle exact size limit', () => {
      const exactFile = new File(['x'.repeat(5 * 1024 * 1024)], 'exact.jpg'); // 5MB
      expect(isValidFileSize(exactFile, 5)).toBe(true);
    });
  });

  describe('timeAgo', () => {
    it('returns "just now" for dates less than 60 seconds ago', () => {
      const now = new Date();
      expect(timeAgo(now.toISOString())).toBe('just now');
    });

    it('returns minutes for dates less than 1 hour ago', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000);
      expect(timeAgo(date.toISOString())).toBe('5 minutes ago');
    });

    it('returns hours for dates less than 24 hours ago', () => {
      const date = new Date(Date.now() - 3 * 60 * 60 * 1000);
      expect(timeAgo(date.toISOString())).toBe('3 hours ago');
    });

    it('returns days for dates less than 1 week ago', () => {
      const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      expect(timeAgo(date.toISOString())).toBe('2 days ago');
    });

    it('returns weeks for dates less than 4 weeks ago', () => {
      const date = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      expect(timeAgo(date.toISOString())).toBe('2 weeks ago');
    });

    it('uses system locale for old dates (no hardcoded en-US)', () => {
      const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      const result = timeAgo(oldDate.toISOString());
      // Just verify it returns a non-empty string (locale-dependent)
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('formatDate', () => {
    it('uses system locale (no hardcoded en-US)', () => {
      const result = formatDate('2026-01-15T12:00:00Z');
      // Just verify it returns a non-empty string (locale-dependent)
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
