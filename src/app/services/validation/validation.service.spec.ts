import { TestBed } from '@angular/core/testing';

import { ValidationService } from './validation.service';

describe('ValidationService', () => {
	let service: ValidationService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(ValidationService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	describe('validateCardinality', () => {
		it('should return empty string for valid cardinality like "*..*"', () => {
			expect(service.validateCardinality('*..*')).toBe('');
		});

		it('should return error when input length is not 4', () => {
			expect(service.validateCardinality('*..')).toContain('must be 4 characters');
		});

		it('should return error when input length is too long', () => {
			expect(service.validateCardinality('*..12')).toContain('must be 4 characters');
		});

		it('should return error when first character is invalid', () => {
			expect(service.validateCardinality('a..*')).toContain('must begin with');
		});

		it('should return error when last character is invalid', () => {
			expect(service.validateCardinality('*..a')).toContain('must end with');
		});

		it('should return error when middle characters are not dots', () => {
			expect(service.validateCardinality('*xx*')).toContain('middle two characters');
		});
	});
});
