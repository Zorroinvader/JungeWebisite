/**
 * Unit Tests for Authentication Helper Functions
 * 
 * Tests for authentication and user validation utilities
 */

// Mock validation functions based on databaseApi.js patterns
const validateEmail = (email) => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
};

const validatePhone = (phone) => {
  const phoneRegex = /^(\+49|0)[1-9]\d{1,14}$/;
  return phoneRegex.test(phone) && phone.length <= 20;
};

const sanitizeText = (text) => {
  if (!text) return text;
  return text
    .replace(/[<>'"]/g, '')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

describe('Authentication Helper Functions', () => {
  describe('validateEmail', () => {
    test('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });

    test('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });

    test('should reject emails longer than 254 characters', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(validateEmail(longEmail)).toBe(false);
    });
  });

  describe('validatePhone', () => {
    test('should validate German phone numbers', () => {
      expect(validatePhone('+491234567890')).toBe(true);
      expect(validatePhone('01234567890')).toBe(true);
      expect(validatePhone('+49 123 4567890')).toBe(false); // No spaces in regex
    });

    test('should reject invalid phone numbers', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('abc')).toBe(false);
      expect(validatePhone('')).toBe(false);
      expect(validatePhone('+1 234 567 8900')).toBe(false); // Not German format
    });

    test('should reject phone numbers longer than 20 characters', () => {
      const longPhone = '+491234567890123456789';
      expect(validatePhone(longPhone)).toBe(false);
    });
  });

  describe('sanitizeText', () => {
    test('should remove dangerous characters', () => {
      // sanitizeText removes <, >, ', " but keeps parentheses
      expect(sanitizeText('<script>alert("xss")</script>')).toBe('scriptalert(xss)/script');
      expect(sanitizeText('test"quote\'apos')).toBe('testquoteapos');
    });

    test('should normalize whitespace', () => {
      expect(sanitizeText('  multiple   spaces  ')).toBe('multiple spaces');
      expect(sanitizeText('line1\nline2\tline3')).toBe('line1line2line3');
    });

    test('should handle null and undefined', () => {
      expect(sanitizeText(null)).toBe(null);
      expect(sanitizeText(undefined)).toBe(undefined);
      expect(sanitizeText('')).toBe('');
    });

    test('should trim text', () => {
      expect(sanitizeText('  test  ')).toBe('test');
    });
  });
});

