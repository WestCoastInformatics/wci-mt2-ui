import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RestService } from './rest.service';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { environment } from 'src/environments/environment';
import { NotificationService } from '../notification.service';

@Injectable({
    providedIn: 'root'
})
export class RefsetService extends RestService {

    taxonomyRootNode: any = null;
    contextPath = '/refsetservice/';
    assignedUser: string;

    constructor(http: HttpClient, notificationService: NotificationService) {
        
        super(http, notificationService);

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

    addRefsetMembers(refsetInternalId: string, fileType: string, conceptIds: string = '', ecl: string = ''): Observable<any> {
        return this.post(this.contextPath + `refset/${refsetInternalId}/members?fileType=${fileType}&conceptIds=${conceptIds}&ecl=${ecl}`, '', true);
    }

    removeRefsetMembers(refsetInternalId: string, fileType: string, conceptIds: string = '', ecl: string = ''): Observable<any> {
        return this.post(this.contextPath + `refset/${refsetInternalId}/removeMembers?fileType=${fileType}&conceptIds=${conceptIds}&ecl=${ecl}`, '', true);
    }

    addRefsetDefinitionExceptions(refsetInternalId: string, fileType: string, definitionExceptionType: string, conceptIds: string = '', ecl: string = ''): Observable<any> {
        return this.post(this.contextPath + `refset/${refsetInternalId}/definitionExceptions?fileType=${fileType}&definitionExceptionType=${definitionExceptionType}&conceptIds=${conceptIds}&ecl=${ecl}`, '', true);
    }

    removeRefsetDefinitionException(refsetInternalId: string, definitionExceptionID: string): Observable<any> {
        return this.post(this.contextPath + `refset/${refsetInternalId}/removeDefinitionException/${definitionExceptionID}`, '', true);
    }

    editRefsetMembers(refsetInternalId: string, params): Observable<any> {
        return this.post(this.contextPath + `refset/${refsetInternalId}`, params);
    }

    updateRefsetMetadata(refsetInternalId: string, params): Observable<any> {
        return this.put(this.contextPath + `refset/${refsetInternalId}`, params);
    }

    getRefset(refsetId: string): Observable<any> {
        return this.get(this.contextPath + 'refset/' + refsetId);
    }

    getMemberAncestorConcepts(refsetInternalId: string, conceptId: string): Observable<any> {
        return this.get(this.contextPath + 'refset/' + refsetInternalId + '/member/' + conceptId + '/ancestorConcepts');
    }

    isRefsetLocked(refsetId: string): Observable<any> {
        return this.get(this.contextPath + 'refset/' + refsetId + '/isLocked');
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

    getWorkflowHistory(refsetId: string, params: any) {
        return this.get(this.contextPath + `refset/${refsetId}/workflowHistory${params}`);
    }

    setWorkflowStatus(refsetId: string, action: string, user: string, status: string, notes: string): Observable<any> {
        return this.post(this.contextPath + `refset/${refsetId}/workflowStatus?action=${action}&user=${user}&status=${status}&notes=${notes}`, '');
    }

    setWorkflowStatusByAction(refsetId: string, action: string, user: string, notes: string): Observable<any> {
        return this.post(this.contextPath + `refset/${refsetId}/workflowStatus?action=${action}&user=${user}&notes=${notes}`, '');
    }

    updateWorkflowStatus(refsetId: string, notes: string): Observable<any> {
        return this.put(this.contextPath + `refset/${refsetId}/workflowNote`, notes);
    }

    getConceptList(refsetId: string, params: any): Observable<any> {
        return this.get(this.contextPath + 'refset/' + refsetId + '/members', params);
    }

    getMembersDetails(conceptId: string, params: any): Observable<any> {
        return this.get(this.contextPath + 'concept/' + conceptId, params);
    }

    getTaxonomySearch(refsetId: string, params: any): Observable<any> {
        return this.get(this.contextPath + 'refset/' + refsetId + '/taxonomySearch', params);
    }

    getConceptSearch(refsetId: string, params: any): Observable<any> {
        return this.get(this.contextPath + 'refset/' + refsetId + '/conceptSearch', params, false);
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

    setRefsetInformation(refsetData: any): void {
        this.assignedUser = refsetData?.assignedUser;
    }
}