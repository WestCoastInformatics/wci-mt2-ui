import { HttpErrorResponse } from '@angular/common/http';
import { vi } from 'vitest';

import { ErrorHandlingService } from './error-handling.service';

describe('ErrorHandlingService', () => {
	let service: ErrorHandlingService;
	let notificationService: any;
	let authenticationService: any;

	const httpError = (status: number, url: string) => new HttpErrorResponse({ status, url, error: 'server message' });

	beforeEach(() => {
		notificationService = { show: vi.fn() };
		authenticationService = { logoutUser: vi.fn(), checkError: vi.fn() };
		service = new ErrorHandlingService({ url: '/projects' } as any, notificationService, authenticationService);
	});

	it('does not show the app-wide notification for a 409 on the bulk save url', () => {
		service.handleError(httpError(409, 'http://host/refsetservice/mapset/abc123/bulk'));
		expect(notificationService.show).not.toHaveBeenCalled();
	});

	it('rethrows the 409 bulk save error to the caller', () => {
		let received: any;
		service.handleError(httpError(409, 'http://host/refsetservice/mapset/abc123/bulk')).subscribe({ error: (e) => (received = e) });
		expect(received.status).toBe(409);
	});

	it('still shows the notification for a 409 on another url', () => {
		service.handleError(httpError(409, 'http://host/refsetservice/mapset/abc123'));
		expect(notificationService.show).toHaveBeenCalledWith('server message', null, 'error', expect.any(Object));
	});

	it('still shows the notification for a non-409 error on the bulk save url', () => {
		service.handleError(httpError(400, 'http://host/refsetservice/mapset/abc123/bulk'));
		expect(notificationService.show).toHaveBeenCalled();
	});
});
