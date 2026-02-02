import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isValidUsername,
  isValidPassword,
  getPasswordStrength,
  isValidUrl,
  isValidEthAddress,
  isValidSlug,
  sanitizeInput,
  isAllowedFileType,
  validateMessage,
  validatePostTitle,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_AUDIO_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  MAX_FILE_SIZES,
} from '../validation';

describe('validation utilities', () => {
  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user @domain.com')).toBe(false);
    });
  });

  describe('isValidUsername', () => {
    it('should validate correct usernames', () => {
      expect(isValidUsername('user123')).toBe(true);
      expect(isValidUsername('User_Name')).toBe(true);
      expect(isValidUsername('abc')).toBe(true);
    });

    it('should reject invalid usernames', () => {
      expect(isValidUsername('')).toBe(false);
      expect(isValidUsername('ab')).toBe(false); // Too short
      expect(isValidUsername('user name')).toBe(false); // Contains space
      expect(isValidUsername('user@name')).toBe(false); // Contains @
      expect(isValidUsername('a'.repeat(31))).toBe(false); // Too long
    });
  });

  describe('isValidPassword', () => {
    it('should validate strong passwords', () => {
      expect(isValidPassword('Password1')).toBe(true);
      expect(isValidPassword('secure123')).toBe(true);
      expect(isValidPassword('Complex@123')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(isValidPassword('')).toBe(false);
      expect(isValidPassword('short1')).toBe(false); // Too short
      expect(isValidPassword('password')).toBe(false); // No number
      expect(isValidPassword('12345678')).toBe(false); // No letter
    });
  });

  describe('getPasswordStrength', () => {
    it('should rate weak passwords', () => {
      const result = getPasswordStrength('ab');
      expect(result.label).toBe('weak');
      expect(result.score).toBeLessThanOrEqual(1);
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('should rate fair passwords', () => {
      const result = getPasswordStrength('Password1');
      expect(result.label).toBe('good');
    });

    it('should rate weak passwords with only length', () => {
      const result = getPasswordStrength('password');
      expect(result.label).toBe('weak');
    });

    it('should rate good passwords with special char', () => {
      const result = getPasswordStrength('Password1!');
      expect(result.label).toBe('strong');
    });

    it('should rate strong passwords', () => {
      const result = getPasswordStrength('StrongPass@123');
      expect(result.label).toBe('strong');
      expect(result.score).toBe(4);
    });

    it('should provide feedback for missing criteria', () => {
      const result = getPasswordStrength('abc');
      expect(result.feedback).toContain('Use at least 8 characters');
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://www.example.org/path')).toBe(true);
      expect(isValidUrl('example.com')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('not a url')).toBe(false);
      expect(isValidUrl('ftp://invalid.com')).toBe(false);
    });
  });

  describe('isValidEthAddress', () => {
    it('should validate correct Ethereum addresses', () => {
      expect(isValidEthAddress('0x1234567890123456789012345678901234567890')).toBe(true);
      expect(isValidEthAddress('0xAbCdEf1234567890123456789012345678901234')).toBe(true);
    });

    it('should reject invalid Ethereum addresses', () => {
      expect(isValidEthAddress('')).toBe(false);
      expect(isValidEthAddress('0x123')).toBe(false); // Too short
      expect(isValidEthAddress('1234567890123456789012345678901234567890')).toBe(false); // No 0x
      expect(isValidEthAddress('0xGGGG567890123456789012345678901234567890')).toBe(false); // Invalid hex
    });
  });

  describe('isValidSlug', () => {
    it('should validate correct slugs', () => {
      expect(isValidSlug('my-forum')).toBe(true);
      expect(isValidSlug('forum123')).toBe(true);
      expect(isValidSlug('a-b-c')).toBe(true);
    });

    it('should reject invalid slugs', () => {
      expect(isValidSlug('')).toBe(false);
      expect(isValidSlug('ab')).toBe(false); // Too short
      expect(isValidSlug('My-Forum')).toBe(false); // Uppercase
      expect(isValidSlug('my_forum')).toBe(false); // Underscore
      expect(isValidSlug('a'.repeat(51))).toBe(false); // Too long
    });
  });

  describe('sanitizeInput', () => {
    it('should escape HTML special characters', () => {
      expect(sanitizeInput('<script>')).toBe('&lt;script&gt;');
      expect(sanitizeInput('"test"')).toBe('&quot;test&quot;');
      expect(sanitizeInput("it's")).toBe('it&#039;s');
      expect(sanitizeInput('a & b')).toBe('a &amp; b');
    });

    it('should handle normal text', () => {
      expect(sanitizeInput('Hello World')).toBe('Hello World');
    });

    it('should handle empty string', () => {
      expect(sanitizeInput('')).toBe('');
    });
  });

  describe('isAllowedFileType', () => {
    it('should allow valid image types', () => {
      expect(isAllowedFileType('photo.jpg', ALLOWED_IMAGE_TYPES)).toBe(true);
      expect(isAllowedFileType('photo.PNG', ALLOWED_IMAGE_TYPES)).toBe(true);
      expect(isAllowedFileType('animation.gif', ALLOWED_IMAGE_TYPES)).toBe(true);
    });

    it('should reject disallowed types', () => {
      expect(isAllowedFileType('script.exe', ALLOWED_IMAGE_TYPES)).toBe(false);
      expect(isAllowedFileType('document.pdf', ALLOWED_IMAGE_TYPES)).toBe(false);
    });

    it('should handle files without extension', () => {
      expect(isAllowedFileType('noextension', ALLOWED_IMAGE_TYPES)).toBe(false);
    });

    it('should validate video types', () => {
      expect(isAllowedFileType('video.mp4', ALLOWED_VIDEO_TYPES)).toBe(true);
      expect(isAllowedFileType('video.webm', ALLOWED_VIDEO_TYPES)).toBe(true);
    });

    it('should validate audio types', () => {
      expect(isAllowedFileType('audio.mp3', ALLOWED_AUDIO_TYPES)).toBe(true);
      expect(isAllowedFileType('audio.wav', ALLOWED_AUDIO_TYPES)).toBe(true);
    });

    it('should validate document types', () => {
      expect(isAllowedFileType('doc.pdf', ALLOWED_DOCUMENT_TYPES)).toBe(true);
      expect(isAllowedFileType('doc.docx', ALLOWED_DOCUMENT_TYPES)).toBe(true);
    });
  });

  describe('validateMessage', () => {
    it('should validate valid messages', () => {
      const result = validateMessage('Hello, world!');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty messages', () => {
      expect(validateMessage('').isValid).toBe(false);
      expect(validateMessage('   ').isValid).toBe(false);
    });

    it('should reject messages that are too long', () => {
      const longMessage = 'a'.repeat(4001);
      const result = validateMessage(longMessage);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('4000');
    });
  });

  describe('validatePostTitle', () => {
    it('should validate valid titles', () => {
      const result = validatePostTitle('My Post Title');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty titles', () => {
      expect(validatePostTitle('').isValid).toBe(false);
      expect(validatePostTitle('   ').isValid).toBe(false);
    });

    it('should reject short titles', () => {
      const result = validatePostTitle('ab');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('3 characters');
    });

    it('should reject long titles', () => {
      const longTitle = 'a'.repeat(301);
      const result = validatePostTitle(longTitle);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('300');
    });
  });

  describe('constants', () => {
    it('should have expected max file sizes', () => {
      expect(MAX_FILE_SIZES.image).toBe(10 * 1024 * 1024);
      expect(MAX_FILE_SIZES.video).toBe(100 * 1024 * 1024);
      expect(MAX_FILE_SIZES.avatar).toBe(2 * 1024 * 1024);
    });
  });
});
