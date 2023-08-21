import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../services/authentication/authentication.service';

@Component({
	selector: 'app-login',
	template: '<div class="login-main"></div>',
})
export class LoginComponent implements OnInit {
	userName: any;
	password = null;
	userData: any;

	constructor(private router: Router, private authService: AuthenticationService) {
		if (this.authService.isAuthenticated()) {
			console.log('is authenticated');
			this.router.navigate(['library'], { replaceUrl: false, skipLocationChange: false });
		} else {
			this.login();
		}
	}

	onSubmit(): any {
		this.authService.authenticateWithBackend(this.userData).subscribe(
			(data) => {
				sessionStorage.setItem('auth_token', data.authToken);
				sessionStorage.setItem('refset_user', JSON.stringify(data));
				this.router.navigate(['library'], { replaceUrl: false, skipLocationChange: false });
			},
			(err) => {
				console.error(err);
			}
		);
	}

	login(): any {
		// IMS login
		this.authService.imsLogin();
	}

	logout(): any {
		console.debug('logout user');
		localStorage.removeItem('loginReferralUrl');
		this.authService.notAuthenticated();
	}

	ngOnInit(): void {}
}
