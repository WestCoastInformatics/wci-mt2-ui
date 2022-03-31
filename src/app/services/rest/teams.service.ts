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


}