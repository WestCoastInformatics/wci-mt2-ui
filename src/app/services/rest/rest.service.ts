import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { environment } from 'src/environments/environment';

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

    constructor(private http: HttpClient) {
    }

    makeCall(url: string, method: string = 'get'): Observable<any> {
        return this.http[method]<any>(url);
    }

    get(url: string, params: any = {}, parseParams: boolean = true): Observable<any> {

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

        //not sure if we need this, maybe for posts
        //let httpParams = new HttpParams({fromString: queryString});

        return this.http.get<any>(environment.restUrl + url + queryString);
    }

    getHttpClient(): HttpClient {
        return this.http;
    }
}
