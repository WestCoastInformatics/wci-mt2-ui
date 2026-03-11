import { TestBed } from '@angular/core/testing';

import { ToggleService } from './toggle.service';

describe('ToggleService', () => {
	let service: ToggleService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(ToggleService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('should start with isToggled as false', () => {
		expect(service.isToggled).toBe(false);
	});

	it('should toggle isToggled to true when toggleSidebar is called', () => {
		service.toggleSidebar();
		expect(service.isToggled).toBe(true);
	});

	it('should toggle isToggled back to false when toggleSidebar is called twice', () => {
		service.toggleSidebar();
		service.toggleSidebar();
		expect(service.isToggled).toBe(false);
	});
});
