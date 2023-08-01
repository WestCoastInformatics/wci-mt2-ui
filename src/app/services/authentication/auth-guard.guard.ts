import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { Router } from '@angular/router';

@Injectable({
	providedIn: 'root',
})
export class AuthGuardGuard implements CanActivate {
	constructor(private authService: AuthenticationService, private router: Router) {}

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
		const token = sessionStorage.getItem('auth_token');

		if (this.authService.isAuthenticated()) {
			return true;
		} else {
			this.authService.notAuthenticated();
			this.router.navigate(['/'], { replaceUrl: false, skipLocationChange: false });
			return false;
		}
	}
}
