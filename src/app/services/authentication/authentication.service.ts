import { EventEmitter, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { User } from '../../models/user';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { NotificationService } from 'src/app/services/notification.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RestService } from '../rest/rest.service';

@Injectable({
	providedIn: 'root',
})
export class AuthenticationService {
	public apiCalled: EventEmitter<null>;

	GUEST_USER = 'Guest';
	LOCAL_DEV = 'dev-rt2';
	IMS_COOKIE_NAME = 'ims-ihtsdo';
	userSubject = new Subject<User>();
	authCookie = { name: 'rt2-auth', path: '/' };
	referralUrl = null;
	sessionTimeoutReference: any;
	sessionTimeout = 86400000; // 1 day

	constructor(
		private http: HttpClient,
		private readonly modalService: NgbModal,
		private router: Router,
		private readonly notificationService: NotificationService,
		private restService: RestService,
	) {
		this.apiCalled = new EventEmitter();
	}

	get isUserLoggedIn(): boolean {
		return !!sessionStorage.getItem('auth_token');
	}

	/** Browser login via backend (Entra or IMS chosen by security.handler). */
	login(): void {
		window.location.href = this.authenticateBaseUrl() + 'login';
	}

	/** Browser logout via backend (Entra or IMS chosen by security.handler). */
	logoutUser() {
		sessionStorage.clear();
		this.deleteAllCookies();
		const guest = new User();
		guest.userName = this.GUEST_USER;
		this.userSubject.next(guest);
		window.location.href = this.authenticateBaseUrl() + 'logout';
	}

	/**
	 * After identity-provider redirect, load session User + authToken from the API.
	 */
	fetchSession(): Observable<User> {
		return this.http.get<User>(this.authenticateBaseUrl() + 'session', {
			withCredentials: true,
		});
	}

	/**
	 * If the URL has auth_login/entra_login success (or error), complete handoff or notify.
	 */
	completeLoginIfNeeded(): void {
		const params = new URLSearchParams(window.location.search);
		const loginOk = params.get('auth_login') === 'success' || params.get('entra_login') === 'success';
		const authError = params.get('auth_error') || params.get('entra_error');

		if (authError) {
			this.notificationService.show('Login failed: ' + authError, null, 'error', { timeOut: 0, extendedTimeOut: 0 });
			this.stripAuthQueryParams();
			return;
		}

		if (!loginOk) {
			return;
		}

		this.fetchSession().subscribe(
			(data) => {
				this.setSessionTimeout();
				sessionStorage.setItem('auth_token', data.authToken);
				sessionStorage.setItem('mapset_user', JSON.stringify(data));
				this.userSubject.next(data);
				this.stripAuthQueryParams();

				const referralUrl = localStorage.getItem('loginReferralUrl');
				localStorage.removeItem('loginReferralUrl');
				if (referralUrl) {
					window.location.href = referralUrl;
				} else {
					this.router.navigate(['/dashboard'], { replaceUrl: true, skipLocationChange: false });
				}
			},
			(err) => {
				console.error(err);
				this.notificationService.show('Login succeeded at the identity provider but the session could not be loaded.', null, 'error', {
					timeOut: 0,
					extendedTimeOut: 0,
				});
				this.stripAuthQueryParams();
			},
		);
	}

	imsLogin(successCallback: Function = this.handleImsSuccess) {
		// check ims-api/account for user info returns a 403 error is user is not logged through IMS
		this.http.get<any>('/ims-api/account').subscribe(
			(user) => {
				user.userName = user.login;
				delete user.password;

				if (user != null) {
					this.handleImsSuccess(user);
				}
			},
			(err) => {
				window.location.href = this.generateImsUrl('login');
			},
		);
	}

	generateImsUrl(endpoint: string): string {
		let url = window.location.origin + '/login';
		let hostname = window.location.hostname;

		if (hostname.indexOf('rt2') < 0) {
			if (hostname.indexOf('local') > -1) {
				hostname = hostname.replace('local', this.LOCAL_DEV);
			}
		}

		url = 'https://' + hostname.replace('rt2', 'ims') + '/#/' + endpoint + '?serviceReferer=' + url;

		return url;
	}

	handleImsSuccess(userData: User) {
		this.authenticateWithBackend(userData).subscribe(
			(data) => {
				this.setSessionTimeout();

				sessionStorage.setItem('auth_token', data.authToken);
				sessionStorage.setItem('mapset_user', JSON.stringify(data));

				const referralUrl = localStorage.getItem('loginReferralUrl');
				localStorage.removeItem('loginReferralUrl');

				this.userSubject.next(userData);

				if (referralUrl) {
					this.router.navigateByUrl(referralUrl, { replaceUrl: true, skipLocationChange: false });
				} else {
					this.router.navigate(['/dashboard'], { replaceUrl: false, skipLocationChange: false });
				}
			},
			(err) => {
				console.error(err);
				if (err.status == 401) {
					this.notificationService.show(' ' + err?.error, null, 'info', { timeOut: 0, extendedTimeOut: 0 });
					this.router.navigate(['/landing'], { replaceUrl: false, skipLocationChange: false });
				} else {
					this.notificationService.show('Problem with login: ' + err?.error, null, 'error', { timeOut: 0, extendedTimeOut: 0 });
				}
			},
		);
	}

	authenticateWithBackend(userData: User): Observable<any> {
		return this.http.post(environment.restUrl + environment.restContextPath + 'authenticate/' + userData.userName, {
			headers: new HttpHeaders({
				'content-type': 'plain/text',
			}),
		});
	}

	isAuthenticated(): boolean {
		try {
			return sessionStorage.getItem('auth_token') != null;
		} catch (ex) {
			this.noCookieAccess();
			return false;
		}
	}

	notAuthenticated(fromLogout = false): any {
		const userWasLoggedin = this.isUserLoggedIn;
		sessionStorage.removeItem('auth_token');

		const oldUser = this.getUser();

		if (oldUser == null || oldUser.userName != this.GUEST_USER) {
			const user = new User();
			user.userName = this.GUEST_USER;
			this.userSubject.next(user);
		}

		if (userWasLoggedin) {
			this.modalService.dismissAll();
			this.notificationService.closeAll();
			this.notificationService.show('Your session has expired and you have been logged out', null, 'error');

			if (!fromLogout && window.location.href.includes('details/')) {
				localStorage.setItem('loginReferralUrl', window.location.href);
			} else if (this.referralUrl) {
				localStorage.removeItem('loginReferralUrl');
			}

			if (!fromLogout) {
				this.logoutUser();
			}
		}
	}

	setSessionTimeout() {
		if (this.isUserLoggedIn) {
			clearTimeout(this.sessionTimeoutReference);

			this.sessionTimeoutReference = setTimeout(() => {
				if (this.isUserLoggedIn) {
					localStorage.setItem('loginReferralUrl', window.location.href);
					this.logoutUser();
				}
			}, this.sessionTimeout);
		}
	}

	prepareUserSession() {
		// Drop leftover mapset_user without a real token (e.g. old fake Admin).
		if (sessionStorage.getItem('mapset_user') && !sessionStorage.getItem('auth_token')) {
			sessionStorage.removeItem('mapset_user');
		}
		this.apiCalled.subscribe(() => this.setSessionTimeout());
		this.setSessionTimeout();
		this.completeLoginIfNeeded();
	}

	getUser() {
		let user;

		try {
			user = JSON.parse(sessionStorage.getItem('mapset_user'));
		} catch (ex) {
			this.noCookieAccess();
			return null;
		}

		return user;
	}

	updateUser(updatedUser: User) {
		try {
			const currentUser = JSON.parse(sessionStorage.getItem('mapset_user'));

			if (currentUser.userName != this.GUEST_USER) {
				sessionStorage.setItem('mapset_user', JSON.stringify(updatedUser));
				this.userSubject.next(updatedUser);
			}
		} catch (ex) {
			this.noCookieAccess();
			return null;
		}
	}

	noCookieAccess() {
		this.notificationService.show(
			'There was a problem accessing local storage or cookies - make sure they are enabled for this site in your browser.',
			null,
			'error',
			{
				timeOut: 0,
				extendedTimeOut: 0,
			},
		);
		this.router.navigateByUrl('');
	}

	resetSession() {
		this.apiCalled.emit(null);
	}

	private authenticateBaseUrl(): string {
		return environment.restUrl + environment.restContextPath + 'authenticate/';
	}

	private stripAuthQueryParams(): void {
		const url = new URL(window.location.href);
		['auth_login', 'auth_error', 'entra_login', 'entra_error', 'entra_callback'].forEach((key) => url.searchParams.delete(key));
		window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
	}

	private readonly deleteAllCookies = () => {
		const cookies = document.cookie.split(';');

		for (let i = 0; i < cookies.length; i++) {
			const cookie = cookies[i];
			const eqPos = cookie.indexOf('=');
			const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
			document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
		}
	};
}
