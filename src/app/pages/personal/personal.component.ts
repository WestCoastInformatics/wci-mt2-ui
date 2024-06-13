import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterEvent, Scroll } from '@angular/router';
import { Subscription } from 'rxjs';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { PersonalComponentService } from 'src/app/pages/personal/personal-component.service';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { UsersService } from 'src/app/services/rest/users.service';

@Component({
	selector: 'personal-page',
	templateUrl: './personal.component.html',
})
export class PersonalComponent implements OnInit, OnDestroy {
	routerParamsSubscription: Subscription;
	routerEventSubscription: Subscription;

	menu: SidebarMenuItem[] = [];
	userId: any;
	previouslyLoadedUserId: string;
	personalSubscription: Subscription;
	user: any;
	uiUtility = UiUtility;
	loggedUserId: any;

	showLoadingSpinner = false;
	currentURL: string;
	currentMenu = 'landing';

	constructor(
		private readonly authService: AuthenticationService,
		private readonly breadcrumbService: BreadcrumbService,
		private readonly titleService: Title,
		private readonly userService: UsersService,
		private readonly personalComponentService: PersonalComponentService,
		private readonly route: ActivatedRoute,
		private readonly router: Router
	) {
		document.body.scrollTop = 0;
	}

	ngOnInit(): void {
		this.loggedUserId = this.authService.getUser().id;

		this.routerParamsSubscription = this.route.params.subscribe((params) => {
			if (params['userId']) {
				this.userId = params['userId'];
				this.getUser();
			}
		});

		this.routerEventSubscription = this.router.events.subscribe((event: RouterEvent) => {
			if (event instanceof Scroll) {
				if (this.router.url.includes('personal')) {
					this.checkLocationPath(this.router.url);
				} else {
					this.ngOnDestroy();
				}
			}
		});
	}

	checkLocationPath(url) {
		if (this.currentURL != url) {
			this.currentURL = url;

			const parts = url.split('/');
			for (let p = 0; p < parts.length; p++) {
				if (parts[p].includes('personal')) {
					if (parts[p + 1] != undefined) {
						this.userId = parts[p + 1];
					}
				}
			}

			if (this.userId) {
				this.getUser();
			}

			let paramMenu = '';

			if (url.includes('landing')) {
				paramMenu = 'landing';
			}

			if (url.includes('configuration')) {
				paramMenu = 'configuration';
			}

			if (this.currentMenu != paramMenu) {
				this.currentMenu = paramMenu;
			}
		}
	}

	setNavigation() {
		if (this.currentMenu === 'landing') {
			this.titleService.setTitle('Reference Set Tool - About');
			this.breadcrumbService.setBreadcrumbs([{ label: 'About' }]);

			this.menu = [{ name: 'About', link: '/personal/' + this.userId + '/landing', icon: 'fa fa-user', isActive: true }];

			if (this.userId === this.loggedUserId) {
				this.menu.push({ name: 'Configuration', link: '/personal/' + this.userId + '/configuration', icon: 'fa fa-cogs' });
			}
		}

		if (this.currentMenu === 'configuration') {
			this.titleService.setTitle('Reference Set Tool - Account Configuration');
			this.breadcrumbService.setBreadcrumbs([{ label: 'Account Configuration' }]);

			this.menu = [
				{ name: 'About', link: '/personal/' + this.userId + '/landing', icon: 'fa fa-user' },
				{ name: 'Configuration', link: '/personal/' + this.userId + '/configuration', icon: 'fa fa-cogs', isActive: true },
			];
		}
	}

	getUser(): void {
		if (this.userId != this.previouslyLoadedUserId) {
			this.previouslyLoadedUserId = this.userId;
			this.userService.getUser(this.userId).subscribe((x) => {
				this.user = x;
				this.personalComponentService.setUser(this.user);
			});

			let currentRoute = this.currentURL;

			if (this.currentMenu == 'landing') {
				currentRoute = '/personal/' + this.userId + '/landing';
			}
			if (this.currentMenu == 'configuration') {
				currentRoute = '/personal/' + this.userId + '/configuration';
			}
			if (this.currentURL != currentRoute) {
				this.router.navigate([currentRoute], { replaceUrl: false, skipLocationChange: false });
			}
		} else {
			this.personalSubscription = this.personalComponentService.getUser().subscribe({
				next: (results) => {
					this.user = results;
				},
			});
		}
		this.setNavigation();
	}

	ngOnDestroy() {
		if (this.routerParamsSubscription) {
			this.routerParamsSubscription.unsubscribe();
		}
		if (this.routerEventSubscription) {
			this.routerEventSubscription.unsubscribe();
		}
		if (this.personalSubscription) {
			this.personalSubscription.unsubscribe();
		}
	}
}
