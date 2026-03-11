import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ToastrModule } from 'ngx-toastr';
import { EMPTY } from 'rxjs';

import { RestService } from './rest.service';
import { NotificationService } from '../notification.service';
import { environment } from 'src/environments/environment';

describe('RestService', () => {
	let service: RestService;
	let httpMock: HttpTestingController;
	let notificationService: NotificationService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [
				HttpClientTestingModule,
				ToastrModule.forRoot()
			]
		});
		service = TestBed.inject(RestService);
		httpMock = TestBed.inject(HttpTestingController);
		notificationService = TestBed.inject(NotificationService);
	});

	afterEach(() => {
		httpMock.verify();
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('should have restUrl from environment', () => {
		expect(service.restUrl).toBe(environment.restUrl);
	});

	describe('get', () => {
		it('should make a GET request with query params', () => {
			service.get('/test', { key: 'value' }).subscribe();
			const req = httpMock.expectOne((r) => r.url.includes('/test'));
			expect(req.request.method).toBe('GET');
			req.flush({});
		});

		it('should make a GET request with empty params', () => {
			service.get('/test', {}).subscribe();
			const req = httpMock.expectOne((r) => r.url.includes('/test'));
			expect(req.request.method).toBe('GET');
			req.flush({});
		});
	});

	describe('post', () => {
		it('should make a POST request with body', () => {
			const body = { name: 'test' };
			service.post('/test', body).subscribe();
			const req = httpMock.expectOne((r) => r.url.includes('/test'));
			expect(req.request.method).toBe('POST');
			expect(req.request.body).toEqual(body);
			req.flush({});
		});
	});

	describe('put', () => {
		it('should make a PUT request with body', () => {
			const body = { name: 'updated' };
			service.put('/test', body).subscribe();
			const req = httpMock.expectOne((r) => r.url.includes('/test'));
			expect(req.request.method).toBe('PUT');
			expect(req.request.body).toEqual(body);
			req.flush({});
		});
	});

	describe('delete', () => {
		it('should make a DELETE request', () => {
			service.delete('/test').subscribe();
			const req = httpMock.expectOne((r) => r.url.includes('/test'));
			expect(req.request.method).toBe('DELETE');
			req.flush({});
		});
	});

	describe('giveErrorNotification', () => {
		it('should call notificationService.show when ignoreErrors is false', () => {
			const showSpy = jest.spyOn(notificationService, 'show').mockReturnValue({} as any);
			const handleDupsSpy = jest.spyOn(notificationService, 'handleDuplicates').mockReturnValue({} as any);

			service.giveErrorNotification({ status: 500, error: 'Server Error' }, false);

			expect(showSpy).toHaveBeenCalled();
			expect(handleDupsSpy).toHaveBeenCalled();
		});

		it('should return EMPTY when ignoreErrors is true and returnErrorOnIgnore is false', () => {
			const result = service.giveErrorNotification({ status: 500 }, true, false);
			expect(result).toBe(EMPTY);
		});

		it('should return the error when ignoreErrors is true and returnErrorOnIgnore is true', () => {
			const error = { status: 500 };
			const result = service.giveErrorNotification(error, true, true);
			expect(result).toBe(error);
		});
	});

	describe('giveWarningNotification', () => {
		it('should call notificationService.show when ignoreErrors is false', () => {
			const showSpy = jest.spyOn(notificationService, 'show').mockReturnValue({} as any);
			const handleDupsSpy = jest.spyOn(notificationService, 'handleDuplicates').mockReturnValue({} as any);

			service.giveWarningNotification({ status: 400, error: 'Bad Request' }, false);

			expect(showSpy).toHaveBeenCalled();
		});

		it('should return EMPTY when ignoreErrors is true', () => {
			const result = service.giveWarningNotification({ status: 400 }, true);
			expect(result).toBe(EMPTY);
		});
	});

	describe('getHttpClient', () => {
		it('should return the HttpClient instance', () => {
			const httpClient = service.getHttpClient();
			expect(httpClient).toBeTruthy();
		});
	});
});
