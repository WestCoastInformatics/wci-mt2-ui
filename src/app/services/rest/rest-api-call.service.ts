import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export class RestWrapper<T> {
    totalResults: number;
    totalKnown: boolean;
    error?: string;
    data: T[];
}


@Injectable({
    providedIn: 'root'
})
export class RestApiCallService {

    constructor(private http: HttpClient) {
    }

    makeCall(url: string, method: string = 'get'): Observable<any> {
        return this.http[method]<any>(url);
    }
}
