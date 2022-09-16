import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Concept } from 'src/app/models/concept';
import { Observable } from 'rxjs';
import { RestService, RestWrapper } from './rest.service';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { NotificationService } from '../notification.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsersService extends RestService {

  taxonomyRootNode: any = null;
  contextPath = '/refsetservice/';
  assignedUser: string;

  constructor(http: HttpClient, notificationService: NotificationService) {

    super(http, notificationService);

    if (CodeUtility.hasValue(environment.restContextPath)) {
      this.contextPath = environment.restContextPath;
    }
  }


  getUser(userId: string): Observable<any> {
    return this.get(this.contextPath + 'user/' + userId);
  }

  updateUser(userId: string, user: any): Observable<any> {
    return this.put(this.contextPath + 'user/' + userId, user);
  }

  updateUserPhoto(userId: string, form: any): Observable<any> {
    return this.postWithFile(this.contextPath + `user/${userId}/icon`, form);
  }

  deleteUserPhoto(userId: string): Observable<any> {
    return this.delete(this.contextPath + `user/${userId}/icon`);
  }
}
