import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, CanActivate, CanDeactivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';

@Injectable({
	providedIn: 'root',
})
export class AuthGuardGuard implements CanActivate, CanDeactivate<unknown> {
	constructor(
		private authService: AuthenticationService,
		private router: Router,
	) {}

	// 1. Entering the route (Auth Check)
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

	// 2. Leaving the route (Unsaved Changes Check)
	canDeactivate(): boolean {
		const hasUnsavedChanges = localStorage.getItem('unsavedChanges') === 'true';

		if (hasUnsavedChanges) {
			const confirmLeave = confirm('You have unsaved changes! Are you sure you want to leave?');

			// If they click "OK" to leave, destroy the state immediately
			if (confirmLeave) {
				localStorage.removeItem('unsavedChanges');
				return true;
			}

			// If they click "Cancel", keep them on the page
			return false;
		}

		return true;
	}
}
