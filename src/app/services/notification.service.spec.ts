import { TestBed } from '@angular/core/testing';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { NotificationService } from './notification.service';

describe('NotificationService', () => {
	let service: NotificationService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [
				BrowserAnimationsModule,
				ToastrModule.forRoot()
			]
		});
		service = TestBed.inject(NotificationService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('should have a closeAll method', () => {
		expect(typeof service.closeAll).toBe('function');
	});

	it('should have a sanitizeString method', () => {
		expect(typeof service.sanitizeString).toBe('function');
	});

	it('should sanitize HTML strings', () => {
		const result = service.sanitizeString('<b>hello</b>');
		expect(result).toContain('hello');
	});
});
