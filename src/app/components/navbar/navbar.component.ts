import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { User } from '../../models/user';
import { AuthenticationService } from '../../services/authentication/authentication.service';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { Router } from '@angular/router';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { UiUtility } from 'src/app/utilities/ui.utility';

@Component({
	standalone: false,
	selector: 'app-navbar',
	templateUrl: './navbar.component.html',
	styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
	environment: string;
	user?: User;
	userSubscription: Subscription;
	guestUser: string;
	isUserLoggedIn = false;
	uiUtility = UiUtility;
	projectRole = '';
	refsetRole = '';
	@Input() breadcrumbs: any;

	constructor(
		private authenticationService: AuthenticationService,
		private breadcrumbService: BreadcrumbService,
		public router: Router,
		private changeDetectorRef: ChangeDetectorRef,
		readonly refsetService: RefsetService,
	) {
		this.guestUser = authenticationService.GUEST_USER;
		//this.environment = window.location.host.split(/[.]/)[0].split(/[-]/)[0];
		this.environment = window.location.hostname;
		this.userSubscription = this.authenticationService.userSubject.subscribe((data) => {
			this.setUserInfo();
		});
	}

	ngOnInit() {
		this.breadcrumbService.getBreadcrumbs().subscribe((breadcrumbs) => {
			this.breadcrumbs = breadcrumbs;
			this.changeDetectorRef.detectChanges();
		});

		this.setUserInfo();
		const projectChannel = new BroadcastChannel('projectChannel');
		projectChannel.onmessage = (e) => {
			this.projectRole = e.data;
		};
		const refsetDataChannel = new BroadcastChannel('refsetDataChannel');
		refsetDataChannel.onmessage = (e) => {
			this.refsetRole = e.data;
		};
	}

	setUserInfo() {
		this.user = this.authenticationService.getUser();
		this.isUserLoggedIn = !!this.user && this.user.userName != this.guestUser;
	}

	showProjectRoleAndAssignee(): boolean {
		return this.router.url.includes('details') || (this.router.url.includes('edition') && this.router.url.includes('projects'));
	}

	showProjectRole(): boolean {
		return this.router.url.includes('edition') && this.router.url.includes('projects') && this.projectRole.length > 0;
	}

	showRefsetRole(): boolean {
		return this.router.url.includes('details') && this.refsetRole.length > 0;
	}

	navigate(breadcrumbId: string) {
		const breadcrumb = this.breadcrumbs[breadcrumbId];

		if (breadcrumb.selectable) {
			this.router.navigate([breadcrumb.path], { replaceUrl: false, skipLocationChange: false });
		}
	}

	logoutUser() {
		this.authenticationService.logoutUser();
	}

	landing() {
		const breadcrumbs: never[] = [];
		this.breadcrumbService.setBreadcrumbs(breadcrumbs);
		this.router.navigate([''], { replaceUrl: false, skipLocationChange: false });
	}

	resources() {
		this.router.navigate([''], { replaceUrl: false, skipLocationChange: false });
	}

	login() {
		//placeholder for login functionality, currently just sets user to Admin and reloads the page
		sessionStorage.setItem('mapset_user', JSON.stringify({ userName: 'Admin' }));
		window.location.reload();
		// localStorage.removeItem('loginReferralUrl');
		// this.router.navigate(['/login'], { replaceUrl: false, skipLocationChange: false });
	}

	assignedUser(): string {
		return this.refsetService.assignedUser ? this.refsetService.assignedUser : 'Unassigned';
	}

	breadcrumbsHasDir(): boolean {
		if (this.breadcrumbs.length == 0) return false;
		return this.breadcrumbs.find((bc: { label: string }) => bc.label == 'Map Set Library') != undefined;
	}

	breadcrumbsHasProjects(): boolean {
		if (this.breadcrumbs.length == 0) return false;
		return this.breadcrumbs.find((bc: { label: string }) => bc.label == 'Projects') != undefined;
	}

	navigateToRoute(route: string): void {
		if (!this.router.url.includes(route)) {
			if (this.router.url.includes('projects') && route.includes('refsets')) {
				const parts = this.router.url.split('/');
				let organizationId = '';
				let editionId = '';
				for (let p = 0; p < parts.length; p++) {
					if (parts[p].includes('organization')) {
						if (parts[p + 1] != undefined) {
							organizationId = parts[p + 1];
						}
					}
					if (parts[p].includes('edition')) {
						if (parts[p + 1] != undefined) {
							editionId = parts[p + 1];
						}
					}
				}
				if (organizationId != '' && editionId != '') {
					route = '/organization/' + organizationId + '/edition/' + editionId + '/projects/0/refsets';
					this.router.navigate([route], { replaceUrl: false, skipLocationChange: false });
				}
			} else {
				this.router.navigate([route], { replaceUrl: false, skipLocationChange: false });
			}
		} else {
			window.location.reload();
		}
	}
}
