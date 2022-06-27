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
export class OrganizationsService extends RestService {
    taxonomyRootNode: any = null;
    contextPath = '/refsetservice/';
    assignedUser: string;

    constructor(http: HttpClient, notificationService: NotificationService) {

        super(http, notificationService);

        if (CodeUtility.hasValue(environment.restContextPath)) {
            this.contextPath = environment.restContextPath;
        }
    }

    createOrganization(params: any): Observable<any> {
        return this.post(this.contextPath + 'organization/', params);
    }

    updateOrganization(organizationId: any, params: any): Observable<any> {
        return this.put(this.contextPath + 'organization/' + organizationId, params);
    }

    updateOrganizationPhoto(organizationId: any, params: any): Observable<any> {
        return this.postWithFile(`${this.contextPath}organization/${organizationId}/icon`, params);
    }

    getOrganization(organizationId: string): Observable<any> {
        return this.get(this.contextPath + 'organization/' + organizationId);
    }

    getOrgUsers(organizationId: string, showTeams?: boolean): Observable<any> {
        return this.get(this.contextPath + 'organization/' + organizationId + '/users?includeTeams=' + showTeams);
    }

    deleteOrganization(organizationId: string): Observable<any> {
        return this.delete(this.contextPath + 'organization/' + organizationId);
    }

    addUser(organizationId: any, email: any): Observable<any> {
        return this.post(this.contextPath + 'organization/' + organizationId + '/user?email=' + email, '');
    }

    removeUser(organizationId: any, userId: any) {
        return this.post(this.contextPath + 'organization/' + organizationId + '/user/' + userId, '');
    }
}
