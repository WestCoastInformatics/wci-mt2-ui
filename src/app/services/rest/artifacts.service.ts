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
export class ArtifactsService extends RestService {

    contextPath = '/refsetservice/';
    assignedUser: string;
    baseUrl: string;

    constructor(http: HttpClient, notificationService: NotificationService) {

        super(http, notificationService);

        if (CodeUtility.hasValue(environment.restContextPath)) {
            this.contextPath = environment.restContextPath;
        }
        this.baseUrl = `${this.contextPath}artifact`;
    }

    getArtifact(artifactId: string): Observable<any> {
        return this.get(`${this.baseUrl}/${artifactId}`);
    }

    getArtifacts(params: any, parseParams = true): Observable<any> {
        return this.get(this.baseUrl, params, parseParams);
    }

    createArtifact(params: any): Observable<any> {
        return this.postWithFile(this.baseUrl, params);
    }

    updateArtifact(artifactId: any, params: any): Observable<any> {
        return this.put(`${this.baseUrl}/${artifactId}`, params);
    }

    deleteArtifact(artifactId: string): Observable<any> {
        return this.delete(`${this.baseUrl}/${artifactId}`);
    }
}
