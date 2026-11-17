import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { tap } from 'rxjs/operators';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { ErrorHandlingService } from 'src/app/services/error-handling.service';

@Injectable()
export class HeaderInterceptor implements HttpInterceptor {
	constructor(
		private authService: AuthenticationService,
		private errorHandlingService: ErrorHandlingService,
	) {}

	intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		const user = this.authService.getUser();
		// Prefer user.authToken; fall back to sessionStorage so hybrid login
		// (#auth_token handoff) attaches Bearer before mapset_user is written.
		const authToken = user?.authToken || sessionStorage.getItem('auth_token');

		let headers = request.headers;
		if (!headers.has('Content-Type') && !headers.has('enctype')) {
			headers = headers.set('Content-Type', 'application/json');
		}
		if (authToken && !headers.has('Authorization')) {
			headers = headers.set('Authorization', 'Bearer ' + authToken);
		}

		request = request.clone({
			headers,
			withCredentials: true,
		});

		if (!this.authService.isAuthenticated()) {
			this.authService.notAuthenticated();
		}
		this.authService.resetSession();

		return next.handle(request).pipe(
			tap((event: HttpEvent<any>) => {}),
			catchError((error: HttpErrorResponse): Observable<any> => {
				return this.errorHandlingService.handleError(error);
			}),
		);
	}
}
