import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Refset } from 'src/app/models/refset';
import { Observable } from 'rxjs';
import { RestService, RestWrapper } from './rest.service';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class RefsetService extends RestService {

    taxonomyRootNode: any = null;
    contextPath = '/refsetservice/';

    constructor(http: HttpClient) {
        super(http);

        if (CodeUtility.hasValue(environment.restContextPath)) {
            this.contextPath = environment.restContextPath;
        }
    }

    getRefsets(params: any): Observable<any> {
        return this.get(this.contextPath + 'refset/search', params);
    }

    getProjects(params: any): Observable<any> {
        return this.get(this.contextPath + 'project/search', params, false);
    }

    createRefset(params: any): Observable<any> {
        return this.post(this.contextPath + 'refset/', params);
    }

    addRefsetMembers(refsetInternalId: string, fileType: string, conceptIds: string): Observable<any> {
        return this.post(this.contextPath + `refset/${refsetInternalId}/members?fileType=${fileType}&conceptIds=${conceptIds}`, '');
    }

    removeRefsetMembers(refsetInternalId: string, fileType: string, conceptIds: string): Observable<any> {
        return this.post(this.contextPath + `refset/${refsetInternalId}/removeMembers?fileType=${fileType}&conceptIds=${conceptIds}`, '');
    }

    getRefset(refsetId: string): Observable<any> {
        return this.get(this.contextPath + 'refset/' + refsetId);
    }

    getRefsetConcepts(params: any): Observable<any> {
        return this.get(this.contextPath + 'general/refsetConcepts', params, false);
    }

    getBranchVersions(params: any): Observable<any> {
        return this.get(this.contextPath + 'general/branchVersions', params, false);
    }

    cacheMemberAncestors(refsetId: string, params: any = {}): Observable<any> {
        return this.get(this.contextPath + 'ancestors/' + refsetId, params);
    }

    getMembersList(refsetId: string, params: any): Observable<any> {
        return this.get(this.contextPath + 'refset/' + refsetId + '/members', params);
    }

    getMembersDetails(conceptId: string, params: any): Observable<any> {
        return this.get(this.contextPath + 'concept/' + conceptId, params);
    }

    getTaxonomySearch(refsetId: string, params: any): Observable<any> {
        return this.get(this.contextPath + 'refset/' + refsetId + '/taxonomySearch', params);
    }

    getMemberHistory(refsetId: string, conceptId: string, params: any): Observable<any> {
        return this.get(this.contextPath + 'refset/' + refsetId + '/member/' + conceptId, params);
    }

    downloadRefset(refsetId: string, params: any): Observable<any> {
        return this.get(this.contextPath + 'export/' + refsetId + '', params);
    }

    getTaxonomyRoot() {

        if (this.taxonomyRootNode == null){

            this.get(this.contextPath + 'terminology/taxonomyRoot').subscribe(results => {

                if (CodeUtility.hasValue(results)){
                    this.taxonomyRootNode = results;
                }
            });
        }

        return JSON.parse(JSON.stringify(this.taxonomyRootNode));
    }

    getVersionStatuses(): Observable<any> {
        return this.get(this.contextPath + 'refset/versionStatuses');
    }

	getEditions(): Observable<any> {
        return this.get(this.contextPath + 'refset/editions');
    }
	
	getOrganizations(): Observable<any> {
        return this.get(this.contextPath + 'refset/organizations');
    }

    getVersions(): Observable<any> {
        return this.get(this.contextPath + 'refset/versions');
    }
}