import { TestBed } from '@angular/core/testing';

import { BreadcrumbService } from './breadcrumb.service';

describe('BreadcrumbService', () => {
	let service: BreadcrumbService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(BreadcrumbService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('should return an observable from getBreadcrumbs', () => {
		const obs = service.getBreadcrumbs();
		expect(obs).toBeTruthy();
		expect(obs.subscribe).toBeDefined();
	});

	it('should emit initial empty array', (done) => {
		service.getBreadcrumbs().subscribe((breadcrumbs) => {
			expect(breadcrumbs).toEqual([]);
			done();
		});
	});

	it('should emit formatted breadcrumbs when setBreadcrumbs is called', (done) => {
		const input = [
			{ label: 'Home', path: '/home' },
			{ label: 'About' },
		];

		// Skip the initial emission
		let emissionCount = 0;
		service.getBreadcrumbs().subscribe((breadcrumbs) => {
			emissionCount++;
			if (emissionCount === 2) {
				expect(breadcrumbs.length).toBe(2);
				expect(breadcrumbs[0].id).toBe(0);
				expect(breadcrumbs[0].class).toContain('rt2-breadcrumb');
				expect(breadcrumbs[0].selectable).toBe(true);
				expect(breadcrumbs[0].class).toContain('rt2-breadcrumb-selectable');

				expect(breadcrumbs[1].id).toBe(1);
				expect(breadcrumbs[1].selectable).toBeUndefined();
				done();
			}
		});

		service.setBreadcrumbs(input);
	});

	it('should make breadcrumbs with path selectable', (done) => {
		const input = [{ label: 'Dashboard', path: '/dashboard' }];

		let emissionCount = 0;
		service.getBreadcrumbs().subscribe((breadcrumbs) => {
			emissionCount++;
			if (emissionCount === 2) {
				expect(breadcrumbs[0].selectable).toBe(true);
				expect(breadcrumbs[0].class).toContain('rt2-breadcrumb-selectable');
				done();
			}
		});

		service.setBreadcrumbs(input);
	});
});
