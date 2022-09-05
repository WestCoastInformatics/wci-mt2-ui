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
export class AuditService extends RestService {

    contextPath = '/refsetservice/';
    assignedUser: string;

    constructor(http: HttpClient, notificationService: NotificationService) {

        super(http, notificationService);

        if (CodeUtility.hasValue(environment.restContextPath)) {
            this.contextPath = environment.restContextPath;
        }
    }

    getAuditTrial(params: any, parseParams = true): Observable<any> {
        return this.get(this.contextPath + 'audit', params, parseParams);
    }

    getRefsetAuditTrial(refsetId: string, params: any, parseParams = true): Observable<any> {
        return this.get(this.contextPath + `audit/REFSET/${refsetId}`, params, parseParams);
    }

}
