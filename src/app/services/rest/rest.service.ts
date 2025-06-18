import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EMPTY, Observable } from 'rxjs';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { environment } from 'src/environments/environment';
import { catchError } from 'rxjs/operators';
import { NotificationService } from '../notification.service';

export class RestWrapper<T> {
	totalResults: number;
	totalKnown: boolean;
	error?: string;
	data: T[];
}

@Injectable({
	providedIn: 'root',
})
export class RestService {
	restUrl = environment.restUrl;

	constructor(private http: HttpClient, private readonly notificationService: NotificationService) {}

	makeCall(url: string, method = 'get'): Observable<any> {
		return this.http[method]<any>(url);
	}

	get(url: string, params: any = {}, parseParams = true, ignoreErrors = false, returnErrorOnIgnore = false): Observable<any> {
		let queryString: string;
		// if parseParams is true then build the query string, else use the params argument as is
		if (parseParams) {
			queryString = CodeUtility.serialize(params);
		} else {
			if (typeof params === 'string') {
				queryString = params;
			} else {
				queryString = '';
			}
		}

		queryString = CodeUtility.addIfNotEmpty(queryString, '?', false);

		return this.http.get<any>(this.restUrl + url + queryString).pipe(
			catchError((err) => {
				return this.giveErrorNotification(err, ignoreErrors, returnErrorOnIgnore);
			})
		);
	}

	post(url: string, params: any, ignoreErrors = false, errorHandler: Function = null): Observable<any> {
		return this.http.post<any>(this.restUrl + url, params).pipe(
			catchError((err) => {
				if (errorHandler) {
					return errorHandler(err);
				}
				return this.giveErrorNotification(err, ignoreErrors);
			})
		);
	}

	postWithFile(url: string, params: any, ignoreErrors = false): Observable<any> {
		return this.http
			.post<any>(this.restUrl + url, params, {
				'headers': new HttpHeaders({
					'Accept': 'application/json',
					'enctype': 'multipart/form-data',
				}),
			})
			.pipe(
				catchError((err) => {
					return this.giveErrorNotification(err, ignoreErrors);
				})
			);
	}

	postExport(url: string, params?: any, ignoreErrors = false, errorHandler: Function = null): Observable<any> {
		const headers = new HttpHeaders({ 'Content-Type': 'text/plain' });
		return this.http.post(this.restUrl + url, params, { responseType: 'text' }).pipe(
			catchError((err) => {
				if (errorHandler) {
					return errorHandler(err);
				}
				return this.giveErrorNotification(err, ignoreErrors);
			})
		);
	}

	put(url: string, params: any, ignoreErrors = false): Observable<any> {
		return this.http.put<any>(this.restUrl + url, params).pipe(
			catchError((err) => {
				return this.giveErrorNotification(err, ignoreErrors);
			})
		);
	}

	putWithFile(url: string, params: any, ignoreErrors = false): Observable<any> {
		return this.http
			.put<any>(this.restUrl + url, params, {
				'headers': new HttpHeaders({
					'Accept': 'application/json',
					'enctype': 'multipart/form-data',
				}),
			})
			.pipe(
				catchError((err) => {
					return this.giveErrorNotification(err, ignoreErrors);
				})
			);
	}

	delete(url: string, ignoreErrors = false): Observable<any> {
		return this.http.delete<any>(this.restUrl + url).pipe(
			catchError((err) => {
				return this.giveErrorNotification(err, ignoreErrors);
			})
		);
	}

	giveErrorNotification(error: any, ignoreErrors = false, returnErrorOnIgnore = false) {
		if (!ignoreErrors) {
			let definedError = '';
			if (error?.status) {
				definedError = ' Error Status: ' + error?.status;
			}
			if (error?.error?.error) {
				definedError = ' ' + error.error.error;
			} else if (error?.error && typeof error?.error != 'object') {
				definedError = ' ' + error.error;
			}

			const message = 'There was a problem with the request, please try again!' + definedError;
			this.notificationService.show(message, null, 'error', { timeOut: 0, extendedTimeOut: 0 });
			this.notificationService.handleDuplicates('error', message);

			return error;
		} else {
			if (returnErrorOnIgnore) {
				return error;
			} else {
				return EMPTY;
			}
		}
	}

	giveWarningNotification(error: any, ignoreErrors = false) {
		if (!ignoreErrors) {
			let definedWarning = ' Error Status: ' + error?.status;

			if (error?.error?.error) {
				definedWarning = ' ' + error.error.error;
			} else if (error?.error) {
				definedWarning = ' ' + error.error;
			}

			const message = 'Warning: ' + definedWarning;
			this.notificationService.show(message, null, 'warning', { timeOut: 0, extendedTimeOut: 0 });
			this.notificationService.handleDuplicates('warning', message);

			return error;
		} else {
			return EMPTY;
		}
	}

	getHttpClient(): HttpClient {
		return this.http;
	}
}
