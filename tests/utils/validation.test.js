const {
  isValidEmail,
  isValidPassword,
  isValidUsername,
  isValidDate,
  hasRequiredProperties,
  sanitizeString,
  isValidCountryCode,
  isValidUUID
} = require('../../src/utils/validation.js');

describe('Validation Utils', () => {
  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('test+tag@example.org')).toBe(true);
      expect(isValidEmail('123@example.com')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test.test@example.com')).toBe(false);
      expect(isValidEmail('test@example')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('test @example.com')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should return true for valid passwords', () => {
      expect(isValidPassword('password123')).toBe(true);
      expect(isValidPassword('mySecretPass')).toBe(true);
      expect(isValidPassword('a1b2c3d4e5')).toBe(true);
    });

    it('should return false for invalid passwords', () => {
      expect(isValidPassword('123')).toBe(false);
      expect(isValidPassword('short')).toBe(false);
      expect(isValidPassword('')).toBe(false);
      expect(isValidPassword('1234567')).toBe(false); // 7 chars, less than default 8
    });

    it('should respect custom minimum length', () => {
      expect(isValidPassword('12345', 5)).toBe(true);
      expect(isValidPassword('1234', 5)).toBe(false);
      expect(isValidPassword('password123', 15)).toBe(false);
      expect(isValidPassword('verylongpassword123', 15)).toBe(true);
    });

    it('should return false for non-string inputs', () => {
      expect(isValidPassword(123)).toBe(false);
      expect(isValidPassword(null)).toBe(false);
      expect(isValidPassword(undefined)).toBe(false);
      expect(isValidPassword({})).toBe(false);
    });
  });

  describe('isValidUsername', () => {
    it('should return true for valid usernames', () => {
      expect(isValidUsername('testuser')).toBe(true);
      expect(isValidUsername('user_123')).toBe(true);
      expect(isValidUsername('test-user')).toBe(true);
      expect(isValidUsername('User123')).toBe(true);
      expect(isValidUsername('a1b')).toBe(true); // 3 chars minimum
    });

    it('should return false for invalid usernames', () => {
      expect(isValidUsername('ab')).toBe(false); // too short
      expect(isValidUsername('a'.repeat(31))).toBe(false); // too long
      expect(isValidUsername('test user')).toBe(false); // space
      expect(isValidUsername('test@user')).toBe(false); // special char
      expect(isValidUsername('test.user')).toBe(false); // dot
      expect(isValidUsername('')).toBe(false);
      expect(isValidUsername('test#user')).toBe(false);
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid dates', () => {
      expect(isValidDate('2023-01-01')).toBe(true);
      expect(isValidDate('2023-12-31')).toBe(true);
      expect(isValidDate('2000-02-29')).toBe(true); // leap year
    });

    it('should return false for invalid date formats', () => {
      expect(isValidDate('23-01-01')).toBe(false);
      expect(isValidDate('2023/01/01')).toBe(false);
      expect(isValidDate('01-01-2023')).toBe(false);
      expect(isValidDate('2023-1-1')).toBe(false);
      expect(isValidDate('')).toBe(false);
      expect(isValidDate('invalid')).toBe(false);
    });

    it('should return false for invalid dates', () => {
      expect(isValidDate('2023-13-01')).toBe(false); // invalid month
      expect(isValidDate('2023-01-32')).toBe(false); // invalid day
      expect(isValidDate('2023-02-30')).toBe(false); // February 30th
      expect(isValidDate('2021-02-29')).toBe(false); // not a leap year
    });
  });

  describe('hasRequiredProperties', () => {
    it('should return true when object has all required properties', () => {
      const obj = { name: 'John', age: 30, email: 'john@example.com' };
      expect(hasRequiredProperties(obj, ['name', 'age'])).toBe(true);
      expect(hasRequiredProperties(obj, ['email'])).toBe(true);
      expect(hasRequiredProperties(obj, [])).toBe(true); // no requirements
    });

    it('should return false when object is missing required properties', () => {
      const obj = { name: 'John', age: 30 };
      expect(hasRequiredProperties(obj, ['name', 'email'])).toBe(false);
      expect(hasRequiredProperties(obj, ['nonexistent'])).toBe(false);
    });

    it('should return false for properties with null or undefined values', () => {
      const obj = { name: 'John', age: null, email: undefined };
      expect(hasRequiredProperties(obj, ['age'])).toBe(false);
      expect(hasRequiredProperties(obj, ['email'])).toBe(false);
      expect(hasRequiredProperties(obj, ['name'])).toBe(true);
    });

    it('should return false for invalid objects', () => {
      expect(hasRequiredProperties(null, ['name'])).toBe(false);
      expect(hasRequiredProperties(undefined, ['name'])).toBe(false);
      expect(hasRequiredProperties('string', ['name'])).toBe(false);
      expect(hasRequiredProperties(123, ['name'])).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('should sanitize HTML special characters', () => {
      expect(sanitizeString('<script>alert("xss")</script>'))
        .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(sanitizeString('Tom & Jerry')).toBe('Tom &amp; Jerry');
      expect(sanitizeString("It's a test")).toBe('It&#39;s a test');
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  test  ')).toBe('test');
      expect(sanitizeString('\n  test  \t')).toBe('test');
    });

    it('should handle non-string inputs', () => {
      expect(sanitizeString(123)).toBe('');
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(undefined)).toBe('');
      expect(sanitizeString({})).toBe('');
    });

    it('should handle empty strings', () => {
      expect(sanitizeString('')).toBe('');
      expect(sanitizeString('   ')).toBe('');
    });
  });

  describe('isValidCountryCode', () => {
    it('should return true for valid country codes', () => {
      expect(isValidCountryCode('US')).toBe(true);
      expect(isValidCountryCode('ES')).toBe(true);
      expect(isValidCountryCode('JP')).toBe(true);
      expect(isValidCountryCode('FR')).toBe(true);
    });

    it('should return false for invalid country codes', () => {
      expect(isValidCountryCode('usa')).toBe(false); // lowercase
      expect(isValidCountryCode('USA')).toBe(false); // 3 letters
      expect(isValidCountryCode('U')).toBe(false); // 1 letter
      expect(isValidCountryCode('1S')).toBe(false); // number
      expect(isValidCountryCode('')).toBe(false);
      expect(isValidCountryCode('U-S')).toBe(false); // special char
    });
  });

  describe('isValidUUID', () => {
    it('should return true for valid UUIDs', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isValidUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
      expect(isValidUUID('6ba7b811-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
    });

    it('should return false for invalid UUIDs', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-44665544000')).toBe(false); // too short
      expect(isValidUUID('550e8400-e29b-41d4-a716-4466554400000')).toBe(false); // too long
      expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false); // incomplete
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID('550e8400-e29b-41d4-a716-44665544000g')).toBe(false); // invalid char
    });
  });
});
