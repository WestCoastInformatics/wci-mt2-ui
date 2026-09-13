import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { NotificationService } from 'src/app/services/notification.service';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';

@Injectable({
	providedIn: 'root',
})
export class ErrorHandlingService {
	constructor(
		private router: Router,
		private readonly notificationService: NotificationService,
		private readonly authenticationService: AuthenticationService,
	) {}

	handleError(error: HttpErrorResponse) {
		if (this.router.url.includes('/login')) {
			if (error.status !== 403) {
				this.notificationService.show(error.message, null, 'error', { timeOut: 0, extendedTimeOut: 0 });
			}
			return;
		}

		if (error.status === 401) {
			this.notificationService.show('Logged out, please log in again.', null, 'error', { timeOut: 0, extendedTimeOut: 0 });
			this.authenticationService.logoutUser();
		} else if (error.status === 403) {
			this.notificationService.show('The user is not allowed to perform this action.', null, 'error', { timeOut: 0, extendedTimeOut: 0 });
		} else if (error.status >= 400 && error.status < 500) {
			if (!error.url.includes('refsetservice/concept/')) {
				const errorMessage = error.error || `Error ${error.status}`;
				this.notificationService.show(errorMessage, null, 'error', { timeOut: 0, extendedTimeOut: 0 });
			}
		} else if (error.status >= 500 && error.status < 600) {
			this.authenticationService.checkError(error);
		}
		return throwError(() => error);
	}
}
