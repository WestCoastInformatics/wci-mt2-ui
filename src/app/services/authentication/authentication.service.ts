import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../models/user';
import { Subject } from 'rxjs';
import { AuthoringService } from '../authoring/authoring.service';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root',
})
export class AuthenticationService {
    private user = new Subject<User>();

    constructor(
        private http: HttpClient,
        private authoringService: AuthoringService,
        private router: Router
    ) {}

    // this sends the user to the refset api.
    login(userName: string, userData: string): Observable<any> {
        return this.http.post(
            `${environment.restUrl}${environment.restContextPath}/authenticate/${userName}`,
            {
                userData,
            },
            {
                headers: new HttpHeaders({
                    'content-type': 'plain/text',
                }),
            }
        );
    }

    logoutUser(): Observable<any> {
        this.notAuthenticated();
        return this.http.post(
            `${environment.restUrl}${
                environment.restContextPath
            }logout/${localStorage.getItem('auth_token')}`,
            {},
            {
                headers: new HttpHeaders({
                    // 'content-type': 'application/json'
                }),
            }
        );
    }

    getRefsetUserDetails(): any {
        return JSON.parse(localStorage.getItem('refset_user'));
    }

    isAuthenticated(): boolean {
        const token = localStorage.getItem('auth_token');
        return token?.length > 1;
    }

    notAuthenticated(): any {
        localStorage.clear();
        this.router.navigate(['/login']);
    }

    setUser() {
        this.http.get<User>('/ims-api/account').subscribe(
            (user) => {
                this.user.next(user);
            },
            (err) => {
                window.location.href =
                    'https://dev-ims.ihtsdotools.org/#/login?serviceReferer=' +
                    window.location.href;
            }
        );
    }

    getUser() {
        return this.user.asObservable();
    }

    logout() {
        window.location.href =
            this.authoringService.uiConfiguration.endpoints.imsEndpoint +
            'logout?serviceReferer=' +
            window.location.href;
    }
}
