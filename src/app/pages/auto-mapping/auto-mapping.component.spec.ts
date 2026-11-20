import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AutoMappingComponent } from './auto-mapping.component';

describe('AutoMappingComponent bulk save', () => {
	let component: any;
	let refsetService: any;
	let notificationService: any;

	beforeEach(() => {
		vi.useFakeTimers();
		localStorage.setItem('unsavedChanges', 'true');
		refsetService = {
			getMapsetWorkflowStatus: vi.fn(() => of({ workflowStatus: 'IN_EDIT' })),
			updateMapsetMappingBulk: vi.fn(),
			getDownloadMapsetStatus: vi.fn(),
		};
		notificationService = { show: vi.fn() };
		component = Object.create(AutoMappingComponent.prototype);
		Object.assign(component, {
			refsetService,
			notificationService,
			authenticationService: { checkError: vi.fn() },
			mapsetInfo: { id: 'ms1' },
			mapsetResponse: [],
			mapsetData: [{ updated: true }],
			userChanged: true,
			saving: false,
			getMapsetData: vi.fn(),
		});
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
		localStorage.clear();
	});

	it('array response: completes immediately and reloads', () => {
		refsetService.updateMapsetMappingBulk.mockReturnValue(of([]));
		component.saveMappings();
		expect(component.saving).toBe(false);
		expect(component.userChanged).toBe(false);
		expect(localStorage.getItem('unsavedChanges')).toBe('false');
		expect(notificationService.show).toHaveBeenCalledWith('The mappings have been saved.', 'Success', 'success', expect.any(Object));
		vi.advanceTimersByTime(50);
		expect(component.mapsetData[0].updated).toBe(false);
		expect(component.getMapsetData).toHaveBeenCalled();
	});

	it('url response: keeps saving and unsaved changes while job is PENDING/PROCESSING', () => {
		refsetService.updateMapsetMappingBulk.mockReturnValue(of({ url: 'job/123' }));
		refsetService.getDownloadMapsetStatus.mockReturnValueOnce(of({ status: 'PENDING' })).mockReturnValueOnce(of({ status: 'PROCESSING' }));
		component.saveMappings();
		expect(refsetService.getDownloadMapsetStatus).toHaveBeenCalledWith('job/123');
		expect(component.saving).toBe(true);
		expect(component.userChanged).toBe(true);
		expect(localStorage.getItem('unsavedChanges')).toBe('true');
		vi.advanceTimersByTime(999);
		expect(refsetService.getDownloadMapsetStatus).toHaveBeenCalledTimes(1);
		vi.advanceTimersByTime(1);
		expect(refsetService.getDownloadMapsetStatus).toHaveBeenCalledTimes(2);
		expect(component.getMapsetData).not.toHaveBeenCalled();
	});

	it('url response: COMPLETED runs the success path', () => {
		refsetService.updateMapsetMappingBulk.mockReturnValue(of({ url: 'job/123' }));
		refsetService.getDownloadMapsetStatus.mockReturnValueOnce(of({ status: 'PROCESSING' })).mockReturnValueOnce(of({ status: 'COMPLETED' }));
		component.saveMappings();
		vi.advanceTimersByTime(1000);
		expect(component.saving).toBe(false);
		expect(component.userChanged).toBe(false);
		expect(localStorage.getItem('unsavedChanges')).toBe('false');
		vi.advanceTimersByTime(50);
		expect(component.mapsetData[0].updated).toBe(false);
		expect(component.getMapsetData).toHaveBeenCalled();
	});

	it('url response: FAILED shows errorMessage and keeps edits', () => {
		refsetService.updateMapsetMappingBulk.mockReturnValue(of({ url: 'job/123' }));
		refsetService.getDownloadMapsetStatus.mockReturnValue(of({ status: 'FAILED', errorMessage: 'boom' }));
		component.saveMappings();
		expect(component.saving).toBe(false);
		expect(component.userChanged).toBe(true);
		expect(localStorage.getItem('unsavedChanges')).toBe('true');
		expect(notificationService.show).toHaveBeenCalledWith('boom', 'Error', 'error', expect.any(Object));
		vi.advanceTimersByTime(5000);
		expect(component.mapsetData[0].updated).toBe(true);
		expect(component.getMapsetData).not.toHaveBeenCalled();
	});

	it('409: warns that a save is already running and keeps edits', () => {
		vi.spyOn(console, 'log').mockImplementation(() => {});
		refsetService.updateMapsetMappingBulk.mockReturnValue(throwError(() => ({ status: 409 })));
		component.saveMappings();
		expect(component.saving).toBe(false);
		expect(component.userChanged).toBe(true);
		expect(localStorage.getItem('unsavedChanges')).toBe('true');
		expect(notificationService.show).toHaveBeenCalledWith(expect.stringContaining('already running'), 'Warning', 'warning', expect.any(Object));
		expect(component.mapsetData[0].updated).toBe(true);
		expect(component.getMapsetData).not.toHaveBeenCalled();
	});
});
