import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { tap } from 'rxjs/operators';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { ErrorHandlingService } from 'src/app/services/error-handling.service';

@Injectable()
export class HeaderInterceptor implements HttpInterceptor {
	constructor(private authService: AuthenticationService, private errorHandlingService: ErrorHandlingService) {}

	intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

		const user = this.authService.getUser();

		if (!request.headers.has('Content-Type') && !request.headers.has('enctype')) {
			request = request.clone({
				headers: request.headers.set('Content-Type', 'application/json').set('Authorization', 'Bearer ' + user?.authToken),
				withCredentials: true,
			});
		} else {
			request = request.clone({
				withCredentials: true,
			});
		}

		const allCookies = document.cookie;

		if (!this.authService.isAuthenticated()) {
			this.authService.notAuthenticated();
		}
		this.authService.resetSession();

		return next.handle(request).pipe(
			tap((event: HttpEvent<any>) => {}),
			catchError((error: HttpErrorResponse): Observable<any> => {
				return this.errorHandlingService.handleError(error);
			})
		);
	}
}
