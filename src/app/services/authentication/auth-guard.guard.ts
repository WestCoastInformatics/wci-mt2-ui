import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { Router } from '@angular/router';

@Injectable({
	providedIn: 'root',
})
export class AuthGuardGuard {
	constructor(
		private authService: AuthenticationService,
		private router: Router,
	) {}

	canActivate(
		route: ActivatedRouteSnapshot,
		state: RouterStateSnapshot,
	): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
		if (this.authService.isAuthenticated()) {
			return true;
		}

		localStorage.setItem('loginReferralUrl', window.location.origin + state.url);
		this.router.navigate(['/'], { replaceUrl: false, skipLocationChange: false });
		return false;
	}
}
