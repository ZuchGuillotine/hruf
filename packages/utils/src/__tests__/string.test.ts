import { 
  cn, 
  capitalize, 
  toTitleCase, 
  truncate, 
  toKebabCase, 
  toCamelCase,
  cleanWhitespace,
  generateRandomString,
  normalizeVitaminName
} from '../string';

describe('String Utilities', () => {
  describe('cn', () => {
    it('should combine class names', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'active', false && 'inactive')).toBe('base active');
    });

    it('should merge Tailwind classes', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('HELLO')).toBe('HELLO');
      expect(capitalize('')).toBe('');
    });
  });

  describe('toTitleCase', () => {
    it('should convert to title case', () => {
      expect(toTitleCase('hello world')).toBe('Hello World');
      expect(toTitleCase('HELLO WORLD')).toBe('Hello World');
      expect(toTitleCase('')).toBe('');
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      expect(truncate('This is a long string', 10)).toBe('This is...');
    });

    it('should not truncate short strings', () => {
      expect(truncate('Short', 10)).toBe('Short');
    });

    it('should use custom suffix', () => {
      expect(truncate('Long string', 5, '---')).toBe('Lo---');
    });
  });

  describe('toKebabCase', () => {
    it('should convert to kebab-case', () => {
      expect(toKebabCase('Hello World')).toBe('hello-world');
      expect(toKebabCase('camelCase')).toBe('camel-case');
      expect(toKebabCase('snake_case')).toBe('snake-case');
    });
  });

  describe('toCamelCase', () => {
    it('should convert to camelCase', () => {
      expect(toCamelCase('hello-world')).toBe('helloWorld');
      expect(toCamelCase('hello_world')).toBe('helloWorld');
      expect(toCamelCase('hello world')).toBe('helloWorld');
    });
  });

  describe('cleanWhitespace', () => {
    it('should clean extra whitespace', () => {
      expect(cleanWhitespace('  hello    world  ')).toBe('hello world');
      expect(cleanWhitespace('normal text')).toBe('normal text');
    });
  });

  describe('generateRandomString', () => {
    it('should generate string of correct length', () => {
      const result = generateRandomString(10);
      expect(result).toHaveLength(10);
    });

    it('should generate different strings', () => {
      const str1 = generateRandomString(8);
      const str2 = generateRandomString(8);
      expect(str1).not.toBe(str2);
    });
  });

  describe('normalizeVitaminName', () => {
    it('should normalize vitamin names', () => {
      expect(normalizeVitaminName('Vitamin D')).toBe('vitamind');
      expect(normalizeVitaminName('Vit B12')).toBe('vitb12');
      expect(normalizeVitaminName('vitamiin c')).toBe('vitaminc');
    });

    it('should handle empty input', () => {
      expect(normalizeVitaminName('')).toBe('');
      expect(normalizeVitaminName(null as any)).toBe('');
    });
  });
});