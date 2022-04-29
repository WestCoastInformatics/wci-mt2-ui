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
export class ProjectsService extends RestService {

    taxonomyRootNode: any = null;
    contextPath = '/refsetservice/';
    assignedUser: string;

    constructor(http: HttpClient, notificationService: NotificationService) {
        
        super(http, notificationService);

        if (CodeUtility.hasValue(environment.restContextPath)) {
            this.contextPath = environment.restContextPath;
        }
    }

    createProject(params: any): Observable<any> {
        return this.post(this.contextPath + 'project/', params);
    }

    updateProject(projectId: any, params: any): Observable<any> {
        return this.put(this.contextPath + 'project/' + projectId, params);
    }

    getProject(projectId: string): Observable<any> {
        return this.get(this.contextPath + 'project/' + projectId);
    }

    getProjectUsers(projectId: string): Observable<any> {
        return this.get(this.contextPath + 'project/' + projectId + '/users');
    }

    deleteProject(projectId: string): Observable<any> {
        return this.delete(this.contextPath + 'project/' + projectId);
    }
}
