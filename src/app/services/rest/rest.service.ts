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
    providedIn: 'root'
})
export class RestService {

    restUrl = environment.restUrl;

    constructor(private http: HttpClient, private readonly notificationService: NotificationService) { }

    makeCall(url: string, method: string = 'get'): Observable<any> {
        return this.http[method]<any>(url);
    }

    get(url: string, params: any = {}, parseParams: boolean = true, ignoreErrors: boolean = false): Observable<any> {

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

                if (!ignoreErrors) {

                    const definedError = err.error.error ? err.error.error : err.statusText;
                    let message = 'There was a problem with the request, please try again! Error Status: ' + err?.status + ' - ' + definedError;
                    this.notificationService.show(message, null, 'error', { timeOut: 0, extendedTimeOut: 0 });
                    this.notificationService.handleDuplicates('error', message);

                    return err;
                } else {
                    return EMPTY;
                }
            })
        );
    }

    post(url: string, params: any, ignoreErrors: boolean = false): Observable<any> {

        return this.http.post<any>(this.restUrl + url, params).pipe(
            catchError((err) => {

                if (!ignoreErrors) {

                    const definedError = err.error.error ? err.error.error : err.statusText;
                    this.notificationService.show('There was a problem with the request, please try again! Error Status: ' + err?.status + ' - ' + definedError, null, 'error', { timeOut: 0, extendedTimeOut: 0 });

                    return err;
                } else {
                    return EMPTY;
                }
            })
        );
    }

    postWithFile(url: string, params: any, ignoreErrors: boolean = false): Observable<any> {
        return this.http.post<any>(this.restUrl + url, params, { 'headers': new HttpHeaders({'Content-Type': 'multipart/form-data',
            'Accept': 'application/json',
            'enctype': 'multipart/form-data'})}).pipe(
            catchError((err) => {

                if (!ignoreErrors) {

                    const definedError = err.error.error ? err.error.error : err.statusText;
                    this.notificationService.show('There was a problem with the request, please try again! Error Status: ' + err?.status + ' - ' + definedError, null, 'error', { timeOut: 0, extendedTimeOut: 0 });

                    return err;
                } else {
                    return EMPTY;
                }
            })
        );
    }

    put(url: string, params: any, ignoreErrors: boolean = false): Observable<any> {

        return this.http.put<any>(this.restUrl + url, params).pipe(
            catchError((err) => {

                if (!ignoreErrors) {

                    const definedError = err.error.error ? err.error.error : err.statusText;
                    this.notificationService.show('There was a problem with the request, please try again! Error Status: ' + err?.status + ' - ' + definedError, null, 'error', { timeOut: 0, extendedTimeOut: 0 });

                    return err;
                } else {
                    return EMPTY;
                }
            })
        );
    }

    delete(url: string, ignoreErrors: boolean = false): Observable<any> {

        return this.http.delete<any>(this.restUrl + url).pipe(
            catchError((err) => {

                if (!ignoreErrors) {

                    const definedError = err.error.error ? err.error.error : err.statusText;
                    this.notificationService.show('There was a problem with the request, please try again! Error Status: ' + err?.status + ' - ' + definedError, null, 'error', { timeOut: 0, extendedTimeOut: 0 });

                    return err;
                } else {
                    return EMPTY;
                }
            })
        );
    }

    getHttpClient(): HttpClient {
        return this.http;
    }
}
