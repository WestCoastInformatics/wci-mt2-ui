import { TestBed } from '@angular/core/testing';

import { PaginationService } from './pagination.service';

describe('PaginationService', () => {
	let service: PaginationService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(PaginationService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	describe('getPager', () => {
		it('should return all pages when totalPages <= 5', () => {
			const result = service.getPager(3, 1, true);
			expect(result.startPage).toBe(1);
			expect(result.endPage).toBe(3);
			expect(result.pages).toEqual([1, 2, 3]);
			expect(result.currentPage).toBe(1);
			expect(result.totalPages).toBe(3);
		});

		it('should show pages 1-5 when current page <= 3 and totalPages > 5', () => {
			const result = service.getPager(10, 2, true);
			expect(result.startPage).toBe(1);
			expect(result.endPage).toBe(5);
			expect(result.pages).toEqual([1, 2, 3, 4, 5]);
		});

		it('should show last 5 pages when current page is near end', () => {
			const result = service.getPager(10, 10, true);
			expect(result.startPage).toBe(6);
			expect(result.endPage).toBe(10);
			expect(result.pages).toEqual([6, 7, 8, 9, 10]);
		});

		it('should center pages around current page in the middle', () => {
			const result = service.getPager(10, 5, true);
			expect(result.startPage).toBe(3);
			expect(result.endPage).toBe(7);
			expect(result.pages).toEqual([3, 4, 5, 6, 7]);
		});

		it('should handle totalKnown=false by setting totalPages to currentPage + 1', () => {
			const result = service.getPager(100, 2, false);
			expect(result.totalPages).toBe(3);
			expect(result.pages).toEqual([1, 2, 3]);
		});

		it('should handle single page', () => {
			const result = service.getPager(1, 1, true);
			expect(result.startPage).toBe(1);
			expect(result.endPage).toBe(1);
			expect(result.pages).toEqual([1]);
		});

		it('should handle exactly 5 pages', () => {
			const result = service.getPager(5, 3, true);
			expect(result.startPage).toBe(1);
			expect(result.endPage).toBe(5);
			expect(result.pages).toEqual([1, 2, 3, 4, 5]);
		});
	});
});
