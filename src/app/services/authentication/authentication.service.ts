import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../models/user';
import { Subject } from 'rxjs';
import { AuthoringService } from '../authoring/authoring.service';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

declare var toastr: any;

@Injectable({
    providedIn: 'root',
})
export class AuthenticationService {

    GUEST_USER = 'Guest';
    userSubject = new Subject<User>();
    authCookie = {name: 'rt2-auth', path: '/'}

    constructor(
        private http: HttpClient,
        private authoringService: AuthoringService,
        private router: Router
    ) {}

    imsLogin(successCallback: Function = this.handleImsSuccess) {

        // check ims-api/account for user info returns a 403 error is user is not logged through IMS
        this.http.get<any>('/ims-api/account').subscribe(
            (user) => {

                user.userName = user.login;
                console.log('user is ------------------', user);

                if (user != null) {
                    this.handleImsSuccess(user);
                }
            },
            (err) => {
                window.location.href = 'https://dev-ims.ihtsdotools.org/#/login?serviceReferer=' + window.location.href;
            }
        );
    }

    handleImsSuccess(userData) {

        this.authenticateWithBackend(userData).subscribe(
            (data) => {

                localStorage.setItem('auth_token', data.authToken);
                localStorage.setItem('refset_user', JSON.stringify(data));
                document.cookie = this.getAuthCookie();
                this.router.navigate(['directory']);
                this.userSubject.next(userData);
                toastr.success('Logged in Successfully');
            },
            (err) => {
                //toastr.error(err.error.error);
                console.error(err);
            }
        );
    }

    // this sends the user to the refset api.
    authenticateWithBackend(userData: User): Observable<any> {

        return this.http.post(environment.restUrl + environment.restContextPath + 'authenticate/' + userData.userName,
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

    getAuthCookie(expire: boolean = false) {

        let cookie = 'rt2-auth=; path=/; domain=' + location.host + '; SameSite=None';

        if (expire) {
            cookie += '; Max-Age=0;'
        }
        return cookie
    }

    logoutUser() {

        let loggedInUser = localStorage.getItem('auth_token');
        this.notAuthenticated();
        document.cookie = `csrftoken; expires= ${new Date()}; path=/`;

        this.http.post<any>(environment.restUrl + environment.restContextPath + 'logout/' + loggedInUser,{}).subscribe(
            (data) => {
                console.log("Back end logged out");
            }
        );

        let logOutPath = 'https://dev-ims.ihtsdotools.org/api/account/logout';

        if (window.location.origin.includes('local')) {
            logOutPath = '/ims-api/account/logout';
        }

        this.http.post<any>(logOutPath, '').subscribe(
            (data) => {

                document.cookie = this.getAuthCookie(true);
                this.router.navigate(['/directory']);
            },
            (err) => {
                this.router.navigate(['/directory']);
            }
        );

        

        const parsedUrl = new URL(window.location.href);
        const baseUrl = parsedUrl.origin + '/directory';
        this.test();
    }

    isAuthenticated(): boolean {

        const token = localStorage.getItem('auth_token');
        return token?.length > 1 && token != this.GUEST_USER;
    }

    test(){

        let config = this.authoringService.uiConfiguration;
        console.log('uiConfiguration - next two lines:');
        console.log(config);
        console.log(config?.endpoints?.imsEndpoint);
    }

    notAuthenticated(): any {

        localStorage.clear();
        
        let user = new User();
        user.userName = this.GUEST_USER;
        localStorage.setItem('refset_user', JSON.stringify(user));
        localStorage.setItem('auth_token', this.GUEST_USER);

        this.userSubject.next(user);
    }

    getUser() {
        return JSON.parse(localStorage.getItem('refset_user'));
    }

    logout() {
        window.location.href = this.authoringService.uiConfiguration.endpoints.imsEndpoint + 'logout?serviceReferer=' + window.location.href;
    }
}
