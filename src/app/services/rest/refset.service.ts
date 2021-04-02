import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Refset } from 'src/app/models/refset';
import { Observable } from 'rxjs';
import { RestService, RestWrapper } from './rest.service';

@Injectable({
    providedIn: 'root'
})
export class RefsetService extends RestService {

    constructor(http: HttpClient) {
        super(http);
    }

    getRefsets(params: any): Observable<any> {
        return this.get('/refset/search', params);
    }

    getRefset(refsetId: string): Observable<any> {
        return this.get('/refset/' + refsetId);
    }

    getMembersList(refsetId: string, params: any): Observable<any> {
        return this.get('/refset/members/list/' + refsetId, params);
    }

    
}