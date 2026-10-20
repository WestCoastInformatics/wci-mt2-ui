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
	userRoles: any[] = [];
	userSubscription: Subscription;
	guestUser: string;
	isUserLoggedIn = false;
	uiUtility = UiUtility;
	projectRole = '';
	mapsetRole = '';
	formatedRoles = '';
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
		const mapsetDataChannel = new BroadcastChannel('refsetDataChannel');
		mapsetDataChannel.onmessage = (e) => {
			this.mapsetRole = e.data;
		};
	}

	setUserInfo() {
		this.user = this.authenticationService.getUser();
		this.userRoles = this.authenticationService.getUserPrimaryRoles();
		this.formatedRoles = this.getFormattedRoles();
		this.isUserLoggedIn = !!this.user && this.user.userName != this.guestUser;
	}

	getFormattedRoles(): string {
		if (!this.userRoles || this.userRoles.length === 0) {
			return '';
		}

		const rolesArray = Array.isArray(this.userRoles) ? this.userRoles : [this.userRoles];
		return rolesArray
			.map((item) => {
				if (!item) return '';

				const str = String(item);

				// Capitalize the first letter, and LOWERCASE the rest of the string
				return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
			})
			.join(', ');
	}

	showProjectRoleAndAssignee(): boolean {
		return this.router.url.includes('details') || (this.router.url.includes('edition') && this.router.url.includes('projects'));
	}

	showProjectRole(): boolean {
		return this.router.url.includes('edition') && this.router.url.includes('projects') && this.projectRole.length > 0;
	}

	showRefsetRole(): boolean {
		return this.router.url.includes('details') && this.mapsetRole.length > 0;
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
		this.authenticationService.login();
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
		if (this.router.url !== route) {
			this.router.navigate([route], { replaceUrl: false, skipLocationChange: false });
		}
	}

	isCurrentPage(page: string): boolean {
		return this.router.url.includes(page);
	}
}
