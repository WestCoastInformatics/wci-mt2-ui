import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, CanActivate, CanDeactivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UnsavedModalComponent } from 'src/app/components/unsaved-modal/unsaved-modal.component';

@Injectable({
	providedIn: 'root',
})
export class AuthGuardGuard implements CanActivate, CanDeactivate<unknown> {
	constructor(
		private authService: AuthenticationService,
		private router: Router,
		private modalService: NgbModal,
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

	canDeactivate(
		component: unknown,
		currentRoute: ActivatedRouteSnapshot,
		currentState: RouterStateSnapshot,
		nextState: RouterStateSnapshot,
	): Promise<boolean> | boolean {
		const hasUnsavedChanges = localStorage.getItem('unsavedChanges') === 'true';

		// 1. No changes? Let them leave immediately.
		if (!hasUnsavedChanges) {
			return true;
		}

		// 2. The internal loop killer.
		// If Angular is restoring the URL back to the exact page we are already on, let it happen silently.
		if (nextState && nextState.url === currentState.url) {
			return true;
		}

		// 3. Show the Bootstrap Modal
		const modalRef = this.modalService.open(UnsavedModalComponent, {
			backdrop: 'static',
			keyboard: false,
		});

		return modalRef.result
			.then((confirmLeave: boolean) => {
				if (confirmLeave) {
					localStorage.removeItem('unsavedChanges');
					return true; // Leaves the page
				}
				return false; // Stays on the page. Router will trigger nextState === currentState check above to fix the URL.
			})
			.catch(() => false);
	}
}
