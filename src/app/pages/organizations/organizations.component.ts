import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterEvent, Scroll } from '@angular/router';
import { Subscription } from 'rxjs';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { NotificationService } from 'src/app/services/notification.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { OrganizationsComponentService } from 'src/app/pages/organizations/organizations-component.service';

@Component({
	selector: 'organizations-page',
	templateUrl: './organizations.component.html',
})
export class OrganizationsComponent implements OnInit, OnDestroy {
	routerParamsSubscription: Subscription;
	routerEventSubscription: Subscription;
	menu: SidebarMenuItem[] = [];
	defaultColDef = {};
	selectedOrganization: any;
	organizationId: string;
	organizationList: any;
	organizationSubscription: Subscription;
	editionId: any;
	selectedEdition: any;
	editionList: any[] = [];
	editionSubscription: Subscription;
	showLoadingSpinner = false;
	currentURL: string;
	currentMenu = 'projects';
	previouslyLoadedOrganizationId: string;
	previouslyLoadedEditionOrgId: string;

	previouslyLoadedEditionId: string;

	constructor(
		private readonly breadcrumbService: BreadcrumbService,
		private readonly titleService: Title,
		private readonly refsetService: RefsetService,
		private readonly notificationService: NotificationService,
		private readonly organizationsComponentService: OrganizationsComponentService,
		private readonly route: ActivatedRoute,
		private readonly router: Router
	) {
		document.body.scrollTop = 0;
	}

	ngOnInit(): void {
		this.titleService.setTitle('Reference Set Tool - Organizations');

		this.routerParamsSubscription = this.route.params.subscribe((params) => {
			if (params?.organizationId) {
				this.organizationId = params['organizationId'];
				this.editionId = params['editionId'];
				this.getOrganizations();
			}
		});

		this.routerEventSubscription = this.router.events.subscribe((event: RouterEvent) => {
			if (event instanceof Scroll) {
				if (this.router.url.includes('organizations') || this.router.url.includes('organization')) {
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
				if (parts[p].includes('organizations') || parts[p].includes('organization')) {
					if (parts[p + 1] != undefined) {
						this.organizationId = parts[p + 1];
					}
				}
				if (parts[p].includes('edition')) {
					if (parts[p + 1] != undefined) {
						this.editionId = parts[p + 1];
					}
				}
			}

			let paramMenu = '';
			if (url.includes('projects')) {
				paramMenu = 'projects';
				if (url.includes('refsets')) {
					paramMenu = 'refsets';
				}
			}

			if (url.includes('teams')) {
				paramMenu = 'teams';
			}

			if (url.includes('users')) {
				paramMenu = 'users';
			}

			if (url.includes('configuration')) {
				paramMenu = 'configuration';
			}

			if (this.currentMenu != paramMenu) {
				this.currentMenu = paramMenu;
			}
			if (this.organizationId) {
				this.getOrganizations();
			}
		}
	}

	setNavigation() {
		if (this.currentMenu === 'projects') {
			this.breadcrumbService.setBreadcrumbs([{ path: '/dashboard', label: 'Dashboard' }, { label: this.selectedOrganization?.name ? this.selectedOrganization?.name + ' / Projects' : '' }]);

			this.menu = [
				{ name: 'Projects', link: '/organizations/' + this.organizationId + '/edition/' + this.editionId + '/projects', icon: 'fa fa-folder-open', isActive: true },
				{ name: 'Teams', link: '/organizations/' + this.organizationId + '/teams', icon: 'fa fa-users' },
				{ name: 'Users', link: '/organizations/' + this.organizationId + '/users', icon: 'fa fa-user' },
			];

			const configShowing = this.menu[this.menu.length - 1].name == 'Configuration';

			if (!configShowing && this.selectedOrganization && this.selectedOrganization.roles.includes('ADMIN')) {
				this.menu.push({ name: 'Configuration', link: '/organizations/' + this.organizationId + '/configuration', icon: 'fa fa-cogs' });
			}
		}

		if (this.currentMenu === 'teams') {
			this.breadcrumbService.setBreadcrumbs([{ path: '/dashboard', label: 'Dashboard' }, { label: this.selectedOrganization?.name ? this.selectedOrganization?.name + ' / Teams' : '' }]);

			this.menu = [
				{ name: 'Projects', link: '/organizations/' + this.organizationId + '/edition/' + this.editionId + '/projects', icon: 'fa fa-folder-open' },
				{ name: 'Teams', link: '/organizations/' + this.organizationId + '/teams', icon: 'fa fa-users', isActive: true },
				{ name: 'Users', link: '/organizations/' + this.organizationId + '/users', icon: 'fa fa-user' },
			];

			const configShowing = this.menu[this.menu.length - 1].name == 'Configuration';

			if (!configShowing && this.selectedOrganization && this.selectedOrganization.roles.includes('ADMIN')) {
				this.menu.push({ name: 'Configuration', link: '/organizations/' + this.organizationId + '/configuration', icon: 'fa fa-cogs' });
			}
		}

		if (this.currentMenu === 'users') {
			this.breadcrumbService.setBreadcrumbs([{ path: '/dashboard', label: 'Dashboard' }, { label: this.selectedOrganization?.name ? this.selectedOrganization?.name + ' / Users' : '' }]);

			this.menu = [
				{ name: 'Projects', link: '/organizations/' + this.organizationId + '/edition/' + this.editionId + '/projects', icon: 'fa fa-folder-open' },
				{ name: 'Teams', link: '/organizations/' + this.organizationId + '/teams', icon: 'fa fa-users' },
				{ name: 'Users', link: '/organizations/' + this.organizationId + '/users', icon: 'fa fa-user', isActive: true },
			];

			const configShowing = this.menu[this.menu.length - 1].name == 'Configuration';

			if (!configShowing && this.selectedOrganization && this.selectedOrganization.roles.includes('ADMIN')) {
				this.menu.push({ name: 'Configuration', link: '/organizations/' + this.organizationId + '/configuration', icon: 'fa fa-cogs' });
			}
		}

		if (this.currentMenu === 'configuration') {
			this.breadcrumbService.setBreadcrumbs([{ path: '/dashboard', label: 'Dashboard' }, { label: this.selectedOrganization?.name ? this.selectedOrganization?.name + ' / Configuration' : '' }]);

			this.menu = [
				{ name: 'Projects', link: '/organizations/' + this.organizationId + '/edition/' + this.editionId + '/projects', icon: 'fa fa-folder-open' },
				{ name: 'Teams', link: '/organizations/' + this.organizationId + '/teams', icon: 'fa fa-users' },
				{ name: 'Users', link: '/organizations/' + this.organizationId + '/users', icon: 'fa fa-user' },
				{ name: 'Configuration', link: '/organizations/' + this.organizationId + '/configuration', icon: 'fa fa-cogs', isActive: true },
			];
		}
	}

	getOrganizations(): void {
		if (this.previouslyLoadedOrganizationId == this.organizationId) {
			this.organizationSubscription = this.organizationsComponentService.getOrganizations().subscribe((results) => {
				this.organizationList = <any>results;
				this.getSelectedOrganization();
			});
		} else {
			this.refsetService.getOrganizations().subscribe((results) => {
				this.organizationList = results.items;
				this.organizationsComponentService.setOrganizations(this.organizationList);
				this.getSelectedOrganization();
			});
		}
	}

	getSelectedOrganization(): void {
		for (const organization of this.organizationList) {
			if (this.organizationId === organization.id) {
				this.selectedOrganization = organization;
				this.selectOrganization();
				return;
			}
		}
		if (!this.organizationId) {
			this.getStoredOrganizationId();
		}

		if (!this.selectedOrganization) {
			this.showLoadingSpinner = false;
		}
	}

	changeOrganization(): void {
		this.organizationId = this.selectedOrganization.id;
		this.selectedEdition = null;
		this.editionList = null;
		this.editionList = [];
		this.editionId = '0';
		this.selectOrganization();
	}

	selectOrganization(): void {
		this.setOrganizationData();

		this.organizationId = this.selectedOrganization.id;
		this.selectedEdition = null;
		this.editionList = [];
		if (this.currentMenu == 'projects') {
			this.getEditions();
		}

		if (this.previouslyLoadedOrganizationId != this.organizationId) {
			this.previouslyLoadedOrganizationId = this.organizationId;
			let currentRoute = this.currentURL;

			if (this.currentMenu == 'projects') {
				currentRoute = '/organizations/' + this.organizationId + '/edition/' + this.editionId + '/projects';
			}
			if (this.currentMenu == 'teams') {
				currentRoute = '/organizations/' + this.organizationId + '/teams';
			}
			if (this.currentMenu == 'users') {
				currentRoute = '/organizations/' + this.organizationId + '/users';
			}
			if (this.currentMenu == 'configuration') {
				currentRoute = '/organizations/' + this.organizationId + '/configuration';
			}
			if (this.currentURL != currentRoute) {
				this.router.navigate([currentRoute]);
			}
		}
	}

	setOrganizationData() {
		localStorage.setItem('selectedOrganizationId', JSON.stringify(this.selectedOrganization.id));
		this.setNavigation();
	}

	getStoredOrganizationId(): void {
		if (localStorage.getItem('selectedOrganizationId')) {
			const storedOrganizationId = JSON.parse(localStorage.getItem('selectedOrganizationId'));

			for (const organization of this.organizationList) {
				if (organization.id == storedOrganizationId) {
					this.selectedOrganization = organization;
					this.selectOrganization();
					return;
				}
			}

			// if the stored organization ID doesn't match anything remove it
			localStorage.removeItem('selectedOrganizationId');
		}
	}

	getEditions(): void {
		if (this.previouslyLoadedEditionOrgId == this.organizationId) {
			this.editionSubscription = this.organizationsComponentService.getEditions().subscribe({
				next: (results) => {
					this.editionList = <any>results;
					this.getSelectedEdition();
				},
			});
		} else {
			this.refsetService.getEditions('&query=organizationId:' + this.organizationId + '&sort=name&sortAscending=true').subscribe({
				next: (results) => {
					this.editionList = results?.items;
					this.organizationsComponentService.setEditions(this.editionList);
					this.previouslyLoadedEditionOrgId = this.organizationId;
					this.getSelectedEdition();
				},
			});
		}
	}

	changeEdition(): void {
		this.editionId = this.selectedEdition.id;
		this.selectEdition();
	}

	getSelectedEdition(): void {
		for (const edition of this.editionList) {
			if (this.editionId == edition.id) {
				this.selectedEdition = edition;
				this.selectEdition();
				return;
			}
		}
		if (!this.selectedEdition && !this.editionId && this.editionId !== '0') {
			this.getStoredEditionId();
		}
		if (!this.selectedEdition) {
			// Pick the first one if nothing is working out
			if (this.editionList[0] != undefined) {
				this.selectedEdition = this.editionList[0];
				this.selectedEdition.id = this.editionList[0].id;
				this.editionId = this.selectedEdition.id;
				this.selectEdition();
			} else {
				this.editionId = 0;

				if (this.editionList.length === 0) {
					this.notificationService.show('No editions', null, 'error', {
						timeOut: 1000,
						extendedTimeOut: 0,
					});
				}
				this.selectEdition();
			}
		}
	}

	selectEdition(): void {
		if (this.currentMenu == 'projects') {
			if (this.previouslyLoadedEditionId != this.editionId) {
				this.previouslyLoadedEditionId = this.editionId;
				this.showEditionData();
				const currentRoute = '/organizations/' + this.organizationId + '/edition/' + this.editionId + '/projects';
				if (this.currentURL != currentRoute) {
					this.router.navigate([currentRoute]);
				}
			}
		}
	}

	showEditionData() {
		localStorage.setItem('selectedOrganizationId', JSON.stringify(this.organizationId));
		localStorage.setItem('selectedEditionId', JSON.stringify(this.editionId));
	}

	getStoredEditionId(): void {
		if (localStorage.getItem('selectedEditionId')) {
			const storedEditionId = JSON.parse(localStorage.getItem('selectedEditionId'));

			for (const edition of this.editionList) {
				if (edition.id == storedEditionId) {
					this.selectedEdition = edition;
					this.selectEdition();
					return;
				}
			}

			// if the stored edition ID doesn't match anything remove it
			localStorage.removeItem('selectedEditionId');

			if (this.editionList && this.editionList.length > 0) {
				this.selectedEdition = this.editionList[0];
				this.selectEdition();
			}
		} else if (this.editionList && this.editionList.length > 0) {
			this.selectedEdition = this.editionList[0];
			this.selectEdition();
		}
	}

	ngOnDestroy() {
		if (this.routerParamsSubscription) {
			this.routerParamsSubscription.unsubscribe();
		}
		if (this.routerEventSubscription) {
			this.routerEventSubscription.unsubscribe();
		}
		if (this.organizationSubscription) {
			this.organizationSubscription.unsubscribe();
		}
		if (this.editionSubscription) {
			this.editionSubscription.unsubscribe();
		}
	}
}
