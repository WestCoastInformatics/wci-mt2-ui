import { EventEmitter, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../models/user';
import { Subject } from 'rxjs';
import { AuthoringService } from '../authoring/authoring.service';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { NotificationService } from 'src/app/services/notification.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RestService } from '../rest/rest.service';

@Injectable({
    providedIn: 'root',
})
export class AuthenticationService {
    public apiCalled: EventEmitter<null>

    GUEST_USER = 'Guest';
    LOCAL_IMS_URL = 'https://dev-ims.ihtsdotools.org/#/';
    IMS_COOKIE_NAME = 'ims-ihtsdo';
    userSubject = new Subject<User>();
    authCookie = { name: 'rt2-auth', path: '/' }
    isUserLoggedIn = false;

    constructor(
        private http: HttpClient,
        private readonly modalService: NgbModal,
        private router: Router,
        private readonly notificationService: NotificationService,
        private restService: RestService,
    ) {
        this.apiCalled = new EventEmitter();
    }

    imsLogin(successCallback: Function = this.handleImsSuccess) {

        // check ims-api/account for user info returns a 403 error is user is not logged through IMS
        this.http.get<any>('/ims-api/account').subscribe(
            (user) => {

                user.userName = user.login;

                if (user != null) {
                    this.handleImsSuccess(user);
                }
            },
            (err) => {
                window.location.href = this.generateImsUrl('login');
            }
        );
    }

    generateImsUrl(endpoint: string): string {

        let url = window.location.origin + '/login';

        if (!window.location.origin.includes("local")) {
            url = window.location.origin.replace('rt2', 'ims') + '/#/' + endpoint + '?serviceReferer=' + url;
        } else {
            url = this.LOCAL_IMS_URL + endpoint + '?serviceReferer=' + url;
        }

        return url;
    }

    handleImsSuccess(userData) {

        this.authenticateWithBackend(userData).subscribe(
            (data) => {

                localStorage.setItem('auth_token', data.authToken);
                localStorage.setItem('refset_user', JSON.stringify(data));
                this.router.navigate(['dashboard']);
                this.userSubject.next(userData);
                this.isUserLoggedIn = true;
            },
            (err) => {
                this.notificationService.show('Problem with login: ' + err.error.error, null, 'error', { timeOut: 0, extendedTimeOut: 0 });
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

    logoutUser() {

        let loggedInUser = localStorage.getItem('auth_token');
        this.notAuthenticated();

        this.http.post<any>(environment.restUrl + environment.restContextPath + 'logout/' + loggedInUser, {}).subscribe(
            (data) => {
                console.log("Back end logged out");
            }
        );

        window.location.href = this.generateImsUrl('logout');
    }

    isAuthenticated(): boolean {

        let cookieFound = document.cookie.includes(this.IMS_COOKIE_NAME);
        let token = localStorage.getItem('auth_token');

        try {

            cookieFound = document.cookie.includes(this.IMS_COOKIE_NAME);
            token = localStorage.getItem('auth_token');

        } catch (ex) {

            this.noCookieAccess();
            return false;
        }

        return cookieFound && token != null;
    }

    notAuthenticated(): any {

        localStorage.clear();

        let userWasLoggedin = this.isUserLoggedIn;
        let user = new User();
        user.userName = this.GUEST_USER;
        this.isUserLoggedIn = false;

        localStorage.setItem('refset_user', JSON.stringify(user));
        this.userSubject.next(user);

        // if the user is on a page that requires being logged in, then send them to the directory
        if (!this.isUserLoggedIn) {
            // this.router.navigateByUrl('directory'); // disabled for now as per ticket RT2-946
            this.router.navigateByUrl('login');
        }

        if (userWasLoggedin) {

            this.modalService.dismissAll();
            this.notificationService.show('Your session has expired and you have been logged out', null, 'info', { timeOut: 5000, extendedTimeOut: 0 });
        }
    }

    getUser() {

        let user;

        try {
            user = JSON.parse(localStorage.getItem('refset_user'));

        } catch (ex) {

            this.noCookieAccess();
            return null;
        }

        return user;
    }

    updateUser(updatedUser) {

        try {

            let currentUser = JSON.parse(localStorage.getItem('refset_user'));

            if (currentUser.userName != this.GUEST_USER) {

                localStorage.setItem('refset_user', JSON.stringify(updatedUser));
                this.userSubject.next(updatedUser);
            }

        } catch (ex) {

            this.noCookieAccess();
            return null;
        }
    }

    noCookieAccess() {

        this.notificationService.show('There was a problem accessing local storage or cookies - make sure they are enabled for this site in your browser.', null, 'error', { timeOut: 0, extendedTimeOut: 0 });
        this.router.navigateByUrl('');
    }

    resetSession() {
        this.apiCalled.emit(null);
    }
    hasRole(role: string): boolean {
        let user = this.getUser();
        if (user?.roles) {
            for (const role of user?.roles) {
                if (role.split("-").filter(x => x.toLowerCase() == role.toLowerCase()).length > 0) {
                    return true;
                }
            }
        }
        return false;
    }
    isAdmin(): boolean {
        return this.hasRole("admin");
    }

    isAuthor(): boolean {
        return this.hasRole('AUTHOR');
    }

    isReviewer(): boolean {
        return this.hasRole('REVIEWER');
    }

    isViewer(): boolean {
        return this.hasRole('VIEWER');
    }
}
