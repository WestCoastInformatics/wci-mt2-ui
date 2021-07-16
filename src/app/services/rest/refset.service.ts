import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Refset } from 'src/app/models/refset';
import { Observable } from 'rxjs';
import { RestService, RestWrapper } from './rest.service';
import { CodeUtility } from 'src/app/utilities/code.utility';

@Injectable({
    providedIn: 'root'
})
export class RefsetService extends RestService {

    taxonomyRootNode: any = null;

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
        return this.get('/refset/' + refsetId + '/members', params);
    }

    getMembersDetails(conceptId: string, params: any): Observable<any> {
        return this.get('/concept/' + conceptId, params);
    }

    getTaxonomySearch(refsetId: string, params: any): Observable<any> {
        return this.get('/refset/' + refsetId + '/taxonomy/search', params);
    }

    getMemberHistory(refsetId: string, conceptId: string, params: any): Observable<any> {
        return this.get('/refset/' + refsetId + '/member/' + conceptId, params);
    }

    downloadRefset(refsetId: string, params: any): Observable<any> {
        return this.get('/export/' + refsetId + '', params);
    }

    getTaxonomyRoot() {

        if (this.taxonomyRootNode == null){

            this.get('/terminology/taxonomyRoot').subscribe(results => {

                if (CodeUtility.hasValue(results)){
                    this.taxonomyRootNode = results;
                }
            });
        }

        return JSON.parse(JSON.stringify(this.taxonomyRootNode));
    }

    getVersionStatuses(): Observable<any> {
        return this.get('/refset/versionStatuses');
    }

	getEditions(): Observable<any> {
        return this.get('/refset/editions');
    }
	
	getOrganizations(): Observable<any> {
        return this.get('/refset/organizations');
    }

    getVersions(): Observable<any> {
        return this.get('/refset/versions');
    }
}