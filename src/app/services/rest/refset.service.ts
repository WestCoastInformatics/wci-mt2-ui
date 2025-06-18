import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RestService } from './rest.service';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { environment } from 'src/environments/environment';
import { NotificationService } from '../notification.service';

@Injectable({
	providedIn: 'root',
})
export class RefsetService extends RestService {
	taxonomyRootNode: any = null;
	contextPath = '/refsetservice/';
	contextPathMapsetDownload = '';
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
		return this.get(this.contextPath + `refset/${refsetInternalId}/compileUpgradeData`, '', true);
	}

	getUpgradeData(refsetInternalId: string, params: any): Observable<any> {
		return this.get(this.contextPath + `refset/${refsetInternalId}/upgradeData`, params, false);
	}

	getProjects(params: any): Observable<any> {
		return this.get(this.contextPath + 'project/search', params, false);
	}

	getMapProjectById(id: string, params: any): Observable<any> {
		return this.get(this.contextPath + `mapproject/${id}`, params, false);
	}

	getTeams(params: any): Observable<any> {
		return this.get(this.contextPath + 'team/search', params, false);
	}

	createRefset(params: any): Observable<any> {
		const self = this;
		return this.post(this.contextPath + 'refset/', params, false, function (err) {
			if (err.status === 504) {
				err.error = `Refset creation is taking longer than expected.  Please come back to the project page in the future to see the created refset.`;
				return self.giveWarningNotification(err);
			}
			return self.giveErrorNotification(err);
		});
	}

	modifyMembersForUpgrade(refsetInternalId: string, inactiveConceptId: string, changeMethod: string, replacementConceptId?: string, body?: string): Observable<any> {
		let replacementCode = '';
		if (replacementConceptId) {
			replacementCode = '&replacementConceptId=' + replacementConceptId;
		}
		return this.post(this.contextPath + `refset/${refsetInternalId}/modifyUpgradeConcept?inactiveConceptId=${inactiveConceptId}&changed=${changeMethod}${replacementCode}`, body, true);
	}

	addRefsetMembers(refsetInternalId: string, fileType: string, conceptIds = '', ecl = ''): Observable<any> {
		return this.post(this.contextPath + `refset/${refsetInternalId}/members?fileType=${fileType}&ecl=${ecl}`, conceptIds, true);
	}

	removeRefsetMembers(refsetInternalId: string, fileType: string, conceptIds = '', ecl = ''): Observable<any> {
		return this.post(this.contextPath + `refset/${refsetInternalId}/removeMembers?fileType=${fileType}&ecl=${ecl}`, conceptIds, true);
	}

	addRemoveAllInactiveRefsetMembers(refsetInternalId: string, isAdd: boolean): Observable<any> {
		return this.post(this.contextPath + `refset/${refsetInternalId}/${isAdd ? 'addAllUpgradeReplacementConcepts' : 'removeAllUpgradeInactiveConcepts'}`, {});
	}

	addRefsetDefinitionExceptions(refsetInternalId: string, fileType: string, definitionExceptionType: string, conceptIds = '', ecl = ''): Observable<any> {
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

	recalulateDefinition(refsetInternalId: string): Observable<any> {
		return this.put(this.contextPath + `refset/${refsetInternalId}/recalculateDefinition`, {});
	}

	getRefset(refsetId: string, versionDate = ''): Observable<any> {
		return this.get(this.contextPath + 'refset/' + refsetId + '/versionDate/' + versionDate);
	}

	getMemberAncestorConcepts(refsetInternalId: string, conceptId: string): Observable<any> {
		return this.get(this.contextPath + 'refset/' + refsetInternalId + '/member/' + conceptId + '/ancestorConcepts');
	}

	getRefsetMemberCount(refsetInternalId: string): Observable<any> {
		return this.get(this.contextPath + 'refset/' + refsetInternalId + '/memberCount');
	}

	isRefsetLocked(refsetId: string): Observable<any> {
		return this.get(this.contextPath + 'refset/' + refsetId + '/isLocked');
	}

	getRefsetConcepts(params: any): Observable<any> {
		return this.get(this.contextPath + 'general/refsetConcepts', params, false);
	}

	getRefsetCopy(
		refsetInternalId: string,
		name: string,
		projectId: string,
		localSet: boolean,
		privateRefset: boolean,
		comboSet: boolean,
		narrative: string,
		tags: any,
		parentConceptId: string,
		newRefsetConceptId: string
	): Observable<any> {
		return this.get(
			this.contextPath +
				'refset/' +
				refsetInternalId +
				'/copy?name=' +
				name +
				'&projectId=' +
				projectId +
				'&localSet=' +
				localSet +
				'&privateRefset=' +
				privateRefset +
				'&comboSet=' +
				comboSet +
				'&narrative=' +
				narrative +
				'&tags=' +
				tags +
				'&parentConceptId=' +
				parentConceptId +
				'&newRefsetConceptId=' +
				newRefsetConceptId
		);
	}

	getBranchVersions(params: any): Observable<any> {
		return this.get(this.contextPath + 'general/branchVersions', params, false);
	}

	cacheMemberAncestors(refsetId: string, versionDate = '', params: any = {}): Observable<any> {
		return this.get(this.contextPath + 'ancestors/' + refsetId + '/versionDate/' + versionDate, params);
	}

	getArtifacts(refsetId: string, params: any) {
		return this.get(this.contextPath + `refset/${refsetId}/artifacts${params}`);
	}

	getWorkflowHistory(refsetId: string, params: any) {
		return this.get(this.contextPath + `refset/${refsetId}/workflowHistory${params}`);
	}

	convertRefsetToExtensional(refsetId: string) {
		return this.get(this.contextPath + `refset/${refsetId}/convert`);
	}

	setWorkflowStatus(refsetId: string, action: string, user: string, status: string, notes: string): Observable<any> {
		return this.post(this.contextPath + `refset/${refsetId}/workflowStatus?action=${action}&user=${user}&status=${status}&notes=${notes}`, '');
	}

	setWorkflowStatusByAction(refsetId: string, action: string, user: string, notes: string): Observable<any> {
		return this.post(this.contextPath + `refset/${refsetId}/workflowStatus?action=${action}&user=${user}&notes=${notes}`, '');
	}

	publishLocalset(refsetInternalId: string, versionDate: string): Observable<any> {
		return this.put(this.contextPath + `admin/refset/${refsetInternalId}/publishLocalset?versionDate=${versionDate}`, '');
	}

	changeRefsetStatus(refsetInternalId: string, active: boolean): Observable<any> {
		return this.put(this.contextPath + `refset/${refsetInternalId}/refsetStatus?active=${active}`, '');
	}

	updateWorkflowStatus(refsetId: string, notes: string): Observable<any> {
		return this.put(this.contextPath + `refset/${refsetId}/workflowNote`, notes);
	}

	getConceptList(refsetId: string, params: any): Observable<any> {
		return this.get(this.contextPath + 'refset/' + refsetId + '/members', params);
	}

	getMembersDetails(conceptId: string, params: any, ignoreErrors = false): Observable<any> {
		return this.get(this.contextPath + 'concept/' + conceptId, params, true, ignoreErrors, true);
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
		const url = this.contextPath + 'discussion';
		return this.post(url, threadBody);
	}

	updateDiscussionThread(threadId: string, threadBody: string): Observable<any> {
		const url = this.contextPath + 'discussion/' + threadId;
		return this.put(url, threadBody);
	}

	updateDiscussionThreadStatus(threadId: string, status: string): Observable<any> {
		const url = this.contextPath + 'discussion/' + threadId + '/status?status=' + status;
		return this.put(url, '');
	}

	updateDiscussionThreadPrivacy(threadId: string, isPrivate: boolean): Observable<any> {
		const url = this.contextPath + 'discussion/' + threadId + '/privacy?isPrivate=' + isPrivate;
		return this.put(url, '');
	}

	updateDiscussionThreadVisibility(threadId: string, visibility: string): Observable<any> {
		const url = this.contextPath + 'discussion/' + threadId + '/visibility?visibility=' + visibility;
		return this.put(url, '');
	}

	deleteDiscussionThread(threadId: string): Observable<any> {
		const url = this.contextPath + 'discussion/' + threadId;
		return this.delete(url);
	}

	deleteDevelopmentVersion(refsetInternalId: string): Observable<any> {
		const url = this.contextPath + 'refset/' + refsetInternalId + '/editVersion';
		return this.delete(url);
	}

	updateDiscussionPostPrivacy(threadId: string, postId: string, isPrivate: boolean): Observable<any> {
		const url = this.contextPath + 'discussion/' + threadId + '/post/' + postId + '/privacy?isPrivate=' + isPrivate;
		return this.put(url, '');
	}

	addDiscussionPost(threadId: string, postBody: string): Observable<any> {
		const url = this.contextPath + 'discussion/' + threadId + '/post';
		return this.post(url, postBody);
	}

	updateDiscussionPost(threadId: string, postId: string, postBody: string): Observable<any> {
		const url = this.contextPath + 'discussion/' + threadId + '/post/' + postId;
		return this.put(url, postBody);
	}

	deleteDiscussionPost(threadId: string, postId: string): Observable<any> {
		const url = this.contextPath + 'discussion/' + threadId + '/post/' + postId;
		return this.delete(url);
	}

	downloadRefset(refsetId: string, params: any): Observable<any> {
		return this.get(this.contextPath + 'export/' + refsetId + '', params);
	}

	downloadRefsetsForProject(projectId: string, params: any): Observable<any> {
		return this.get(this.contextPath + 'export/project/' + projectId + '', params);
	}

	getTaxonomyRoot() {
		if (this.taxonomyRootNode == null) {
			this.get(this.contextPath + 'terminology/taxonomyRoot').subscribe((results) => {
				if (CodeUtility.hasValue(results)) {
					this.taxonomyRootNode = results;
				}
			});
		}

		return JSON.parse(JSON.stringify(this.taxonomyRootNode));
	}

	getVersionStatuses(): Observable<any> {
		return this.get(this.contextPath + 'refset/versionStatuses');
	}

	getMetadata(): Observable<any> {
		return this.get(this.contextPath + 'metadata');
	}

	getMapsets(): Observable<any> {
		return this.get(this.contextPath + 'mapset');
	}

	getMapsetByCode(code: string): Observable<any> {
		return this.get(this.contextPath + `mapset/${code}`, '', false);
	}

	getMappingsByMapset(mapset: string, params): Observable<any> {
		return this.get(this.contextPath + `mapset/${mapset}/mappings?limit=` + params.limit + `&offset=` + params.offset + `&filter=` + params.filter, '', false);
	}

	//not used
	getMappingByMapsetAndConcept(mapset: string, concept: string): Observable<any> {
		return this.get(this.contextPath + `mapset/${mapset}/mappings/${concept}`, '', false);
	}

	getMappingByMapsetConceptList(mapset: string, concepts: string): Observable<any> {
		return this.get(this.contextPath + `mapset/${mapset}/mappings?conceptCodes=${concepts}&showOverriddenEntries=false`, '', false);
	}

	getConceptByCode(terminology: string, version: string, code: string): Observable<any> {
		return this.get(this.contextPath + `concept/${terminology}/${version}/${code}`, '', false);
	}

	searchConceptByQuery(terminology: string, version: string, query: string, limit: string): Observable<any> {
		return this.get(this.contextPath + `concept/${terminology}/${version}?limit=${limit}&offset=0&query=${query}`, '', false);
	}

	updateMapsetMapping(mapSetCode: string, params): Observable<any> {
		return this.put(this.contextPath + `mapset/${mapSetCode}`, params);
	}

	updateMapsetMappingBulk(mapSetCode: string, params): Observable<any> {
		return this.put(this.contextPath + `mapset/${mapSetCode}/bulk`, params);
	}

	exportMapset(params: any): Observable<any> {
		return this.post(this.contextPath + 'mapset/export', params);
	}

	getDownloadMapsetStatus(job: string): Observable<any> {
		return this.get(this.contextPath + '/' + job);
	}

	getDownloadMapsetFile(url: string): Observable<any> {
		return this.get(this.contextPathMapsetDownload + url);
	}

	exportMapsetByCode(mapsetCode: any, params: any): Observable<any> {
		return this.postExport(this.contextPath + 'mapset/' + mapsetCode + '/export', params);
	}

	getEditions(params: any): Observable<any> {
		return this.get(this.contextPath + 'edition/search', params, false);
	}

	getOrganizations(includeMembers = false): Observable<any> {
		return this.get(this.contextPath + 'organization/search?includeMembers=' + includeMembers);
	}

	getOrganizationsKeyValue(): Observable<any> {
		return this.get(this.contextPath + 'refset/organizations');
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

	emailRefset(activeRefsetInternalId: string, params: any): Observable<any> {
		return this.post(this.contextPath + `refset/${activeRefsetInternalId}/share`, params);
	}

	shareRefset(refsetId: string, data): Observable<any> {
		return this.post(`${this.contextPath}refset/${refsetId}/share`, data);
	}

	inviteByEmail(refsetId: string, data): Observable<any> {
		return this.post(`${this.contextPath}refset/${refsetId}/invite`, data);
	}

	inviteRequest(requestId: string, accepted: string): Observable<any> {
		return this.get(`${this.contextPath}inviterequest/${requestId}/response?acceptance=${accepted}`, '', true, true);
	}

	requestAccess(refsetId: string, params: any): Observable<any> {
		return this.post(this.contextPath + `refset/${refsetId}/request`, params);
	}
}
