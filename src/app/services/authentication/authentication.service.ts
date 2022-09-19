import {EventEmitter, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable, Subject} from 'rxjs';
import {User} from '../../models/user';
import {environment} from '../../../environments/environment';
import {Router} from '@angular/router';
import {NotificationService} from 'src/app/services/notification.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {RestService} from '../rest/rest.service';

@Injectable({
    providedIn: 'root',
})
export class AuthenticationService {
    public apiCalled: EventEmitter<null>;

    GUEST_USER = 'Guest';
    LOCAL_IMS_URL = 'https://dev-ims.ihtsdotools.org/#/';
    IMS_COOKIE_NAME = 'ims-ihtsdo';
    userSubject = new Subject<User>();
    authCookie = {name: 'rt2-auth', path: '/'};
    referralUrl = '';

    constructor(
        private http: HttpClient,
        private readonly modalService: NgbModal,
        private router: Router,
        private readonly notificationService: NotificationService,
        private restService: RestService,
    ) {
        this.apiCalled = new EventEmitter();
        if (window.location.href.includes('details/')) {
            this.referralUrl = window.location.href;
        } else if (this.referralUrl) {
            this.referralUrl = '';
        }
    }

    get isUserLoggedIn(): boolean {
        return !!localStorage.getItem('auth_token');
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

        if (!this.referralUrl) {
            this.referralUrl = url;
        }

        if (!window.location.origin.includes('local')) {
            url = window.location.origin.replace('rt2', 'ims') + '/#/' + endpoint + '?serviceReferer=' + this.referralUrl;
        } else {
            url = this.LOCAL_IMS_URL + endpoint + '?serviceReferer=' + this.referralUrl;
        }

        return url;
    }

    handleImsSuccess(userData) {

        this.authenticateWithBackend(userData).subscribe(
            (data) => {

                localStorage.setItem('auth_token', data.authToken);
                localStorage.setItem('refset_user', JSON.stringify(data));
                this.userSubject.next(userData);
                if (this.referralUrl) {
                    window.location.href = this.referralUrl;
                } else {
                    this.router.navigate(['/dashboard']);
                }
            },
            (err) => {
                this.notificationService.show('Problem with login: ' + err.error.error, null, 'error', {timeOut: 0, extendedTimeOut: 0});
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

        localStorage.clear();
        sessionStorage.clear();
        this.deleteAllCookies();
        this.http.post<any>(environment.restUrl + environment.restContextPath + 'logout/' + loggedInUser, {}).subscribe(
            (data) => {
                console.log('Back end logged out');
            }
        );

        this.http.post<any>('/ims-api/account/logout', {}).subscribe(
            (data) => {
                console.log('IMS logout');
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

        let userWasLoggedin = this.isUserLoggedIn;
        localStorage.clear();

        let user = new User();
        user.userName = this.GUEST_USER;
        localStorage.setItem('refset_user', JSON.stringify(user));
        this.userSubject.next(user);

        // if the user is on a page that requires being logged in, then send them to the directory
        if (!this.isUserLoggedIn) {
            const location = window.location.href.split('/');
            const url = location.length > 1 ? location[1] : '';
            if (url && !url.startsWith('#')) {
                // this.router.navigateByUrl('directory'); // disabled for now as per ticket RT2-946
                this.router.navigateByUrl('login');
            }
        }

        if (userWasLoggedin) {

            this.modalService.dismissAll();
            this.notificationService.show('Your session has expired and you have been logged out', null, 'error', {
                timeOut: 5000,
                extendedTimeOut: 0
            });
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

        this.notificationService.show('There was a problem accessing local storage or cookies - make sure they are enabled for this site in your browser.', null, 'error', {
            timeOut: 0,
            extendedTimeOut: 0
        });
        this.router.navigateByUrl('');
    }

    resetSession() {
        this.apiCalled.emit(null);
    }

    private readonly deleteAllCookies = () => {
        var cookies = document.cookie.split(';');

        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i];
            var eqPos = cookie.indexOf('=');
            var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
    }
}
