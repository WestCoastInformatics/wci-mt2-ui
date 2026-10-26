import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

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

	it('should emit initial empty array', async () => {
		const breadcrumbs = await firstValueFrom(service.getBreadcrumbs());
		expect(breadcrumbs).toEqual([]);
	});

	it('should emit formatted breadcrumbs when setBreadcrumbs is called', async () => {
		const input = [{ label: 'Home', path: '/home' }, { label: 'About' }];

		service.setBreadcrumbs(input);
		const breadcrumbs = await firstValueFrom(service.getBreadcrumbs());
		expect(breadcrumbs.length).toBe(2);
		expect(breadcrumbs[0].id).toBe(0);
		expect(breadcrumbs[0].class).toContain('mt2-breadcrumb');
		expect(breadcrumbs[0].selectable).toBe(true);
		expect(breadcrumbs[0].class).toContain('mt2-breadcrumb-selectable');
		expect(breadcrumbs[1].id).toBe(1);
		expect(breadcrumbs[1].selectable).toBeUndefined();
	});

	it('should make breadcrumbs with path selectable', async () => {
		const input = [{ label: 'Dashboard', path: '/dashboard' }];

		service.setBreadcrumbs(input);
		const breadcrumbs = await firstValueFrom(service.getBreadcrumbs());
		expect(breadcrumbs[0].selectable).toBe(true);
		expect(breadcrumbs[0].class).toContain('mt2-breadcrumb-selectable');
	});
});
