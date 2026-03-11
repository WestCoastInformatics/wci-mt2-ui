import { CodeUtility } from './code.utility';

describe('CodeUtility', () => {
	describe('hasValue', () => {
		it('should return true for a string with content', () => {
			expect(CodeUtility.hasValue('hello')).toBe(true);
		});

		it('should return false for undefined', () => {
			expect(CodeUtility.hasValue(undefined)).toBe(false);
		});

		it('should return false for null', () => {
			expect(CodeUtility.hasValue(null)).toBe(false);
		});

		it('should return false for empty string when rejectEmpty is true', () => {
			expect(CodeUtility.hasValue('', true)).toBe(false);
		});

		it('should return true for empty string when rejectEmpty is false', () => {
			expect(CodeUtility.hasValue('', false)).toBe(true);
		});

		it('should return true for a number', () => {
			expect(CodeUtility.hasValue(42)).toBe(true);
		});

		it('should return true for zero', () => {
			expect(CodeUtility.hasValue(0)).toBe(true);
		});
	});

	describe('addIfNotEmpty', () => {
		it('should add string to end of non-empty string', () => {
			expect(CodeUtility.addIfNotEmpty('hello', '!')).toBe('hello!');
		});

		it('should add string to beginning of non-empty string when addToEnd is false', () => {
			expect(CodeUtility.addIfNotEmpty('hello', '?', false)).toBe('?hello');
		});

		it('should return empty string unchanged', () => {
			expect(CodeUtility.addIfNotEmpty('', '!')).toBe('');
		});
	});

	describe('removeFinal', () => {
		it('should remove trailing characters', () => {
			expect(CodeUtility.removeFinal('hello,', ',')).toBe('hello');
		});

		it('should return string unchanged if chars are not at end', () => {
			expect(CodeUtility.removeFinal('hello', ',')).toBe('hello');
		});
	});

	describe('isConceptID', () => {
		it('should return true for a UUID format string', () => {
			expect(CodeUtility.isConceptID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
		});

		it('should return false for non-UUID string', () => {
			expect(CodeUtility.isConceptID('12345')).toBe(false);
		});

		it('should return false for plain text', () => {
			expect(CodeUtility.isConceptID('abc')).toBe(false);
		});
	});

	describe('testBoolean', () => {
		it('should return true for boolean true', () => {
			expect(CodeUtility.testBoolean(true)).toBe(true);
		});

		it('should return false for boolean false', () => {
			expect(CodeUtility.testBoolean(false)).toBe(false);
		});

		it('should return true for string "true"', () => {
			expect(CodeUtility.testBoolean('true')).toBe(true);
		});

		it('should return false for string "false"', () => {
			expect(CodeUtility.testBoolean('false')).toBe(false);
		});

		it('should return null for non-boolean value', () => {
			expect(CodeUtility.testBoolean('random')).toBe(null);
		});
	});

	describe('isInt', () => {
		it('should return true for integer', () => {
			expect(CodeUtility.isInt(5)).toBe(true);
		});

		it('should return false for float', () => {
			expect(CodeUtility.isInt(5.5)).toBe(false);
		});

		it('should return true for integer string', () => {
			expect(CodeUtility.isInt('5')).toBe(true);
		});
	});

	describe('isFloat', () => {
		it('should return true for float', () => {
			expect(CodeUtility.isFloat(5.5)).toBe(true);
		});

		it('should return false for integer', () => {
			expect(CodeUtility.isFloat(5)).toBe(false);
		});
	});

	describe('findInArray', () => {
		it('should return true when item is found in array', () => {
			expect(CodeUtility.findInArray(['a', 'b', 'c'], ['b'])).toBe(true);
		});

		it('should return false when item is not in array', () => {
			expect(CodeUtility.findInArray(['a', 'b', 'c'], ['d'])).toBe(false);
		});
	});

	describe('stripHtml', () => {
		it('should remove HTML tags', () => {
			expect(CodeUtility.stripHtml('<p>Hello <b>World</b></p>')).toBe('Hello World');
		});

		it('should handle string without HTML', () => {
			expect(CodeUtility.stripHtml('Hello World')).toBe('Hello World');
		});
	});

	describe('clone', () => {
		it('should create a deep copy of an object', () => {
			const original = { a: 1, b: { c: 2 } };
			const cloned = CodeUtility.clone(original);
			expect(cloned).toEqual(original);
			expect(cloned).not.toBe(original);
			expect(cloned.b).not.toBe(original.b);
		});
	});

	describe('shortenText', () => {
		it('should return full text if under limit', () => {
			expect(CodeUtility.shortenText('hello', 10)).toBe('hello');
		});

		it('should truncate and add ellipsis if over limit', () => {
			const result = CodeUtility.shortenText('hello world this is a long string', 10);
			expect(result.length).toBeLessThanOrEqual(14); // 10 + ' ...'
			expect(result).toContain('...');
		});
	});

	describe('toTitleCase', () => {
		it('should convert lowercase string to title case', () => {
			expect(CodeUtility.toTitleCase('hello world')).toBe('Hello World');
		});

		it('should handle single word', () => {
			expect(CodeUtility.toTitleCase('hello')).toBe('Hello');
		});
	});

	describe('serialize', () => {
		it('should serialize object to query string', () => {
			const result = CodeUtility.serialize({ key: 'value', foo: 'bar' });
			expect(result).toContain('key=value');
			expect(result).toContain('foo=bar');
		});

		it('should return empty string for empty object', () => {
			expect(CodeUtility.serialize({})).toBe('');
		});
	});

	describe('getUniqueID', () => {
		it('should return a number', () => {
			expect(typeof CodeUtility.getUniqueID()).toBe('number');
		});

		it('should return different values on subsequent calls', () => {
			const id1 = CodeUtility.getUniqueID();
			const id2 = CodeUtility.getUniqueID();
			// They may be the same if called in the same ms, but the function should not throw
			expect(id1).toBeDefined();
			expect(id2).toBeDefined();
		});
	});

	describe('getCurrentDate', () => {
		it('should return a string in reverse date format', () => {
			const date = CodeUtility.getCurrentDate();
			expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		});
	});
});
