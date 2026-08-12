import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../services/authentication/authentication.service';

@Component({
	standalone: false,
	selector: 'app-login',
	template: '<div class="login-main"></div>',
})
export class LoginComponent implements OnInit {
	userName: any;
	password = null;
	userData: any;

	constructor(
		private router: Router,
		private authService: AuthenticationService,
	) {
		if (this.authService.isAuthenticated()) {
			this.router.navigate(['dashboard'], { replaceUrl: false, skipLocationChange: false });
		} else {
			this.authService.login();
		}
	}

	ngOnInit(): void {}
}
