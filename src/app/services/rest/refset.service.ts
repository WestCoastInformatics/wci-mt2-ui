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

    getRefsets(params: any, parseParams = true): Observable<any> {
        return this.get(this.contextPath + 'refset/search', params, parseParams);
    }

    getReplacementConcepts(refsetInternalId: string, query: string): Observable<any> {
        return this.get(this.contextPath + `refset/${refsetInternalId}/replacementConceptSearch?limit=10&query=${query}`, '', false);
    }

    initializeUpgrade(refsetInternalId: string): Observable<any> {
        return this.get(this.contextPath + `refset/${refsetInternalId}/compileUpgradeData`, '', false);
    }

    getUpgradeData(refsetInternalId: string, params: any): Observable<any> {
        return this.get(this.contextPath + `refset/${refsetInternalId}/upgradeData`, params, false);
    }

    getProjects(params: any): Observable<any> {
        return this.get(this.contextPath + 'project/search', params, false);
    }

    getTeams(params: any): Observable<any> {
        return this.get(this.contextPath + 'team/search', params, false);
    }

    createRefset(params: any): Observable<any> {
        return this.post(this.contextPath + 'refset/', params);
    }


    modifyMembersForUpgrade(refsetInternalId: string, inactiveConceptId: string, changeMethod: string, replacementConceptId?: string, body?: string): Observable<any> {

        let replacementCode = '';
        if (replacementConceptId) {
            replacementCode = '&replacementConceptId=' + replacementConceptId
        }
        return this.post(this.contextPath + `refset/${refsetInternalId}/modifyUpgradeConcept?inactiveConceptId=${inactiveConceptId}&changed=${changeMethod}${replacementCode}`, body, true);
    }

    addRefsetMembers(refsetInternalId: string, fileType: string, conceptIds: string = '', ecl: string = ''): Observable<any> {
        return this.post(this.contextPath + `refset/${refsetInternalId}/members?fileType=${fileType}&ecl=${ecl}`, conceptIds, true);
    }

    removeRefsetMembers(refsetInternalId: string, fileType: string, conceptIds: string = '', ecl: string = ''): Observable<any> {
        return this.post(this.contextPath + `refset/${refsetInternalId}/removeMembers?fileType=${fileType}&ecl=${ecl}`, conceptIds, true);
    }

    addRefsetDefinitionExceptions(refsetInternalId: string, fileType: string, definitionExceptionType: string, conceptIds: string = '', ecl: string = ''): Observable<any> {
        return this.post(this.contextPath + `refset/${refsetInternalId}/definitionExceptions?fileType=${fileType}&definitionExceptionType=${definitionExceptionType}&ecl=${ecl}`, conceptIds, true);
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

    getRefset(refsetId: string, versionDate: String = ''): Observable<any> {
        return this.get(this.contextPath + 'refset/' + refsetId + '/versionDate/' + versionDate);
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

    cacheMemberAncestors(refsetId: string, versionDate: String = '', params: any = {}): Observable<any> {
        return this.get(this.contextPath + 'ancestors/' + refsetId + '/versionDate/' + versionDate, params);
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

    getDiscussionThreads(type: string, refsetInternalId: string, conceptId: string = null): Observable<any> {

        let url = this.contextPath + 'discussion/' + type + '/' + refsetInternalId;
        
        if (conceptId != null) {
            url += '?conceptId=' + conceptId;
        }

        return this.get(url);
    }

    addDiscussionThread(threadBody: string): Observable<any> {

        let url = this.contextPath + 'discussion';
        return this.post(url, threadBody);
    }

    updateDiscussionThread(threadId: string, threadBody: string): Observable<any> {

        let url = this.contextPath + 'discussion/' + threadId;
        return this.put(url, threadBody);
    }

    updateDiscussionThreadStatus(threadId: string, status: string): Observable<any> {

        let url = this.contextPath + 'discussion/' + threadId + '/status?status=' + status;
        return this.put(url, '');
    }

    updateDiscussionThreadPrivacy(threadId: string, isPrivate: boolean): Observable<any> {

        let url = this.contextPath + 'discussion/' + threadId + '/privacy?isPrivate=' + isPrivate;
        return this.put(url, '');
    }

    updateDiscussionThreadVisibility(threadId: string, visibility: string): Observable<any> {

        let url = this.contextPath + 'discussion/' + threadId + '/visibility?visibility=' + visibility;
        return this.put(url, '');
    }

    updateDiscussionPostPrivacy(threadId: string, postId: string, isPrivate: boolean): Observable<any> {

        let url = this.contextPath + 'discussion/' + threadId + '/post/' + postId + '/privacy?isPrivate=' + isPrivate;
        return this.put(url, '');
    }

    updateDiscussionPostVisibility(threadId: string, postId: string, visibility: string): Observable<any> {

        let url = this.contextPath + 'discussion/' + threadId + '/post/' + postId + '/visibility?visibility=' + visibility;
        return this.put(url, '');
    }

    addDiscussionPost(threadId: string, postBody: string): Observable<any> {

        let url = this.contextPath + 'discussion/' + threadId + '/post';
        return this.post(url, postBody);
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

    getOrganizationsWithIcon(): Observable<any> {
        return this.get(this.contextPath + 'organization/search?includeMembers=false');
    }

    getVersions(): Observable<any> {
        return this.get(this.contextPath + 'refset/versions');
    }

    setRefsetInformation(refsetData: any): void {
        this.assignedUser = refsetData?.assignedUser;
    }

    searchRefsetsForDropdowns(query: string): Observable<any> {
        return this.get(this.contextPath + `refset/dropdownSearch?limit=10&query=${query}`, '', false);
    }

    launchComparison(activeRefsetInternalId: string, comparisonRefsetInternalId: string): Observable<any> {
        return this.get(this.contextPath + `refset/${activeRefsetInternalId}/compileComparisonData?comparisonRefsetInternalId=${comparisonRefsetInternalId}`, '', false, true);
    }

    getComparisonData(activeRefsetInternalId: string): Observable<any> {
        return this.get(this.contextPath + `refset/${activeRefsetInternalId}/comparisonData`, '', false);
    }
}