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
export class TeamsService extends RestService {

    taxonomyRootNode: any = null;
    contextPath = '/refsetservice/';
    assignedUser: string;

    constructor(http: HttpClient, notificationService: NotificationService) {
        
        super(http, notificationService);

        if (CodeUtility.hasValue(environment.restContextPath)) {
            this.contextPath = environment.restContextPath;
        }
    }

    createTeam(params: any): Observable<any> {
        return this.post(this.contextPath + 'team/', params);
    }

    getTeam(teamId: string): Observable<any> {
        return this.get(this.contextPath + 'team/' + teamId);
    }

    updateTeam(teamId: any, params: any): Observable<any> {
        return this.put(this.contextPath + 'team/' + teamId, params);
    }

    addRole(teamId: any, role: any): Observable<any> {
        return this.post(this.contextPath + 'team/' + teamId + '/role/' + role, '');
    }

    removeRole(teamId: any, role: any): Observable<any> {
        return this.delete(this.contextPath + 'team/' + teamId + '/role/' + role, '');
    }

    addUser(teamId: any, userId: any): Observable<any> {
        return this.post(this.contextPath + 'team/' + teamId + '/member/' + userId, '');
    }

    removeUser(teamId: any, userId: any): Observable<any> {
        return this.delete(this.contextPath + 'team/' + teamId + '/member/' + userId, '');
    }
}
