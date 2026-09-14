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
	LOCAL_DEV = 'dev-mt2';
	userSubject = new Subject<User>();
	authCookie = { name: 'mt2-auth', path: '/' };
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

	/** Browser login via backend (Entra or IMS chosen by security.handler).
	 *  Passes the current origin as returnUrl so the API can redirect back here
	 *  after OAuth instead of going to the hard-coded APP_URL_ROOT. This enables
	 *  a local UI (e.g. localhost:4200) to work against a remote API.
	 */
	login(): void {
		const returnUrl = encodeURIComponent(window.location.origin);
		window.location.href = this.authenticateBaseUrl() + 'login?returnUrl=' + returnUrl;
	}

	/** Browser logout via backend (Entra or IMS chosen by security.handler). */
	logoutUser() {
		sessionStorage.removeItem('auth_token');
		sessionStorage.removeItem('mapset_user');
		sessionStorage.clear();
		localStorage.clear();
		this.deleteAllCookies();
		const returnUrl = encodeURIComponent(window.location.origin + '/landing');
		window.location.href = this.authenticateBaseUrl() + 'logout?returnUrl=' + returnUrl;
	}

	/**
	 * After identity-provider redirect, load session User + authToken from the API.
	 * When a Bearer token is provided (hash-handoff path for local dev), it is sent
	 * as an Authorization header; withCredentials is still set so same-origin
	 * cookie deployments are unaffected.
	 */
	fetchSession(bearerToken?: string): Observable<User> {
		const headers: Record<string, string> = {};
		if (bearerToken) {
			headers['Authorization'] = 'Bearer ' + bearerToken;
		}
		return this.http.get<User>(this.authenticateBaseUrl() + 'session', {
			withCredentials: true,
			headers,
		});
	}

	/**
	 * If the URL has auth_login/entra_login success (or error), complete handoff or notify.
	 *
	 * Hybrid hash-token path (local UI ↔ remote API):
	 *   When the API redirects back with `#auth_token=<jwt>` the token is extracted
	 *   from the hash, stored in sessionStorage immediately, and then used as a
	 *   Bearer token when calling /authenticate/session so no cross-origin session
	 *   cookie is required.
	 *
	 * Same-origin path (hosted deploy):
	 *   When no hash token is present, the existing cookie-based flow is used
	 *   unchanged — fetchSession() is called with credentials only.
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

		// --- Hash-token path (local dev: API redirected with #auth_token=<jwt>) ---
		const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
		const hashToken = hashParams.get('auth_token');

		if (hashToken) {
			// Store immediately so isAuthenticated() returns true during the session fetch.
			sessionStorage.setItem('auth_token', hashToken);

			this.fetchSession(hashToken).subscribe(
				(data) => {
					this.setSessionTimeout();
					// Prefer the canonical token returned by the session endpoint if present.
					if (data.authToken) {
						sessionStorage.setItem('auth_token', data.authToken);
					}
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
					sessionStorage.removeItem('auth_token');
					this.notificationService.show('Login succeeded at the identity provider but the session could not be loaded.', null, 'error', {
						timeOut: 0,
						extendedTimeOut: 0,
					});
					this.stripAuthQueryParams();
				},
			);
			return;
		}

		// --- Cookie-session path (same-origin hosted deploy, no hash token) ---
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

		if (hostname.indexOf('mt2') < 0) {
			if (hostname.indexOf('local') > -1) {
				hostname = hostname.replace('local', this.LOCAL_DEV);
			}
		}

		url = 'https://' + hostname.replace('mt2', 'ims') + '/#/' + endpoint + '?serviceReferer=' + url;

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

	checkError(error: any): void {
		switch (true) {
			case error?.error?.status === 500 &&
				error?.error?.message.includes('The Token has expired') &&
				error?.error?.error === 'Internal Server Error':
				this.notificationService.show('Your session has expired and you have been logged out', null, 'error');
				this.logoutUser();
				break;
			case error?.error?.status === 503 &&
				error?.error?.message.includes('The map index is still updating') &&
				error?.error?.error === 'Service Unavailable':
				this.notificationService.show(
					'The map index is still updating after a recent save. Please try the search again in a minute.',
					null,
					'error',
				);
				break;
			default:
				this.notificationService.show('Unexpected application error, please try again.', 'Error', 'error', {
					timeOut: 2500,
					extendedTimeOut: 0,
				});
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

	getUser(): any {
		let user;

		try {
			user = JSON.parse(sessionStorage.getItem('mapset_user'));
		} catch (ex) {
			this.noCookieAccess();
			return null;
		}

		return user;
	}

	getUserPrimaryRoles(): any[] {
		let roles = [];
		try {
			const currentUser = JSON.parse(sessionStorage.getItem('mapset_user'));
			if (currentUser.roles && currentUser.roles.length > 0) {
				for (const role of currentUser.roles) {
					if (role === 'all-all-all-admin') {
						roles.push('ADMIN');
					}
					if (role === 'all-all-all-lead') {
						roles.push('LEAD');
					}
					if (role === 'all-all-all-specialist') {
						roles.push('SPECIALIST');
					}
				}
			}
		} catch (ex) {
			this.noCookieAccess();
		}
		return roles;
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
		if (this.router.url !== '/') {
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

		// Also strip auth_token from the hash (hash-handoff path for local dev).
		// Remove the key but preserve any other hash fragments that may exist.
		const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
		hashParams.delete('auth_token');
		const remainingHash = hashParams.toString();
		const cleanHash = remainingHash ? '#' + remainingHash : '';

		window.history.replaceState({}, document.title, url.pathname + url.search + cleanHash);
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
