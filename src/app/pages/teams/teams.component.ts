import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterEvent, Scroll } from '@angular/router';
import { Subscription } from 'rxjs';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { NotificationService } from 'src/app/services/notification.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { TeamsComponentService } from 'src/app/pages/teams/teams-component.service';
import { CodeUtility } from 'src/app/utilities/code.utility';

@Component({
	standalone: false,
	selector: 'teams-page',
	templateUrl: './teams.component.html',
})
export class TeamsComponent implements OnInit, OnDestroy {
	routerParamsSubscription: Subscription;
	routerEventSubscription: Subscription;
	menu: SidebarMenuItem[] = [];
	defaultColDef = {};
	selectedOrganization: any;
	organizationId: string;
	organizationList: any;
	organizationSubscription: Subscription;
	selectedEdition: any;
	showLoadingSpinner = false;
	currentURL: string;
	currentMenu = 'projects';
	previouslyLoadedOrganizationId: string;
	previouslyLoadedTeamId: string;
	teamsSubscription: Subscription;
	selectedTeam: any;
	teamId: any;
	teamList = [];

	constructor(
		private readonly breadcrumbService: BreadcrumbService,
		private readonly refsetService: RefsetService,
		private readonly notificationService: NotificationService,
		private readonly teamsComponentService: TeamsComponentService,
		private readonly route: ActivatedRoute,
		private readonly router: Router
	) {
		document.body.scrollTop = 0;
	}

	ngOnInit(): void {
		this.routerParamsSubscription = this.route.params.subscribe((params) => {
			if (params?.organizationId) {
				this.organizationId = params['organizationId'];
				this.teamId = params['teamId'];
				this.getOrganizations();
			}
		});

		this.routerEventSubscription = this.router.events.subscribe((event: any) => {
			if (event instanceof Scroll) {
				if (this.router.url.includes('organization') && this.router.url.includes('teams')) {
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
				if (parts[p].includes('organization')) {
					if (parts[p + 1] != undefined) {
						this.organizationId = parts[p + 1];
					}
				}
				if (parts[p].includes('teams')) {
					if (parts[p + 1] != undefined) {
						this.teamId = parts[p + 1];
					}
				}
			}

			let paramMenu = '';
			if (url.includes('users')) {
				paramMenu = 'users';
			}

			if (url.includes('configuration')) {
				paramMenu = 'configuration';
			}

			if (this.currentMenu != paramMenu) {
				this.currentMenu = paramMenu;

				if (this.organizationId) {
					this.getOrganizations();
				}
			}
		}
	}

	setNavigation() {
		if (this.currentMenu === 'users') {
			const breadcrumbs: any = [{ path: '/dashboard', label: 'Dashboard' }];

			if (CodeUtility.hasValue(this.organizationId, true, true)) {
				breadcrumbs.push({ path: 'organizations/' + this.organizationId + '/teams', label: this.selectedOrganization?.name ? this.selectedOrganization?.name + ' / Teams' : '' });
			}

			breadcrumbs.push({ label: 'Users' });
			this.breadcrumbService.setBreadcrumbs(breadcrumbs);

			this.menu = [{ name: 'Users', link: '/organization/' + this.organizationId + '/teams/' + this.teamId + '/users', icon: 'fa fa-user', isActive: true }];

			const configShowing = this.menu[this.menu.length - 1].name === 'Configuration';

			if (!configShowing && this.selectedOrganization && this.selectedOrganization.roles.includes('ADMIN')) {
				this.menu.push({ name: 'Configuration', link: '/organization/' + this.organizationId + '/teams/' + this.teamId + '/configuration', icon: 'fa fa-cogs' });
			}
		}

		if (this.currentMenu === 'configuration') {
			const breadcrumbs: any = [{ path: '/dashboard', label: 'Dashboard' }];

			if (CodeUtility.hasValue(this.organizationId, true, true)) {
				breadcrumbs.push({ path: 'organizations/' + this.organizationId + '/teams', label: this.selectedOrganization?.name ? this.selectedOrganization?.name + ' / Teams' : '' });
			}

			breadcrumbs.push({ label: 'Configuration' });
			this.breadcrumbService.setBreadcrumbs(breadcrumbs);

			this.menu = [
				{ name: 'Users', link: '/organization/' + this.organizationId + '/teams/' + this.teamId + '/users', icon: 'fa fa-user' },
				{ name: 'Configuration', link: '/organization/' + this.organizationId + '/teams/' + this.teamId + '/configuration', icon: 'fa fa-cogs', isActive: true },
			];
		}
	}

	getOrganizations(): void {
		this.organizationList = [];
		if (this.previouslyLoadedOrganizationId == this.organizationId) {
			this.teamsSubscription = this.teamsComponentService.getOrganizations().subscribe((results) => {
				this.organizationList = <any>results;
				this.getSelectedOrganization();
			});
		} else {
			this.refsetService.getOrganizations().subscribe((results) => {
				this.organizationList = results.items;
				this.teamsComponentService.setOrganizations(this.organizationList);
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
	}

	changeOrganization(): void {
		this.teamId = null;
		this.selectOrganization();
	}

	selectOrganization(): void {
		this.organizationId = this.selectedOrganization.id;
		this.selectedTeam = null;
		this.teamList = [];
		this.setNavigation();
		this.getTeams();
	}

	changeLocationRoute(): void {
		let currentRoute = this.currentURL;

		if (this.currentMenu == 'users') {
			currentRoute = '/organization/' + this.organizationId + '/teams/' + this.teamId + '/users';
		}
		if (this.currentMenu == 'configuration') {
			currentRoute = '/organization/' + this.organizationId + '/teams/' + this.teamId + '/configuration';
		}
		if (this.currentURL != currentRoute) {
			this.router.navigate([currentRoute], { replaceUrl: false, skipLocationChange: false });
		}
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

	selectTeam(): void {
		this.teamId = this.selectedTeam.id;
		this.setNavigation();

		if (this.previouslyLoadedOrganizationId != this.organizationId) {
			if (this.previouslyLoadedTeamId != this.teamId) {
				this.previouslyLoadedTeamId = this.teamId;
				this.previouslyLoadedOrganizationId = this.organizationId;
				this.changeLocationRoute();
			} else {
				this.previouslyLoadedOrganizationId = this.organizationId;
				this.changeLocationRoute();
			}
		} else {
			if (this.previouslyLoadedTeamId != this.teamId) {
				this.previouslyLoadedTeamId = this.teamId;
				this.previouslyLoadedOrganizationId = this.organizationId;
				this.changeLocationRoute();
			}
		}
	}

	getTeams(): void {
		this.teamList = [];
		if (this.previouslyLoadedOrganizationId == this.organizationId) {
			this.teamsSubscription = this.teamsComponentService.getTeams().subscribe((results) => {
				this.teamList = <any>results;
				this.getSelectedTeam();
			});
		} else {
			this.refsetService.getTeams('includeMembers=true&query=organizationId:' + this.organizationId + '&sort=name&sortAscending=true').subscribe((results) => {
				this.teamList = results.items;
				this.teamsComponentService.setTeams(this.teamList);
				this.getSelectedTeam();
			});
		}
	}

	getSelectedTeam() {
		for (const team of this.teamList) {
			if (this.teamId == team.id) {
				this.selectedTeam = team;
				return;
			}
		}

		if (this.teamList && this.teamList.length > 0) {
			this.selectedTeam = this.teamList[0];
			this.selectTeam();
		} else {
			if (this.teamList.length === 0) {
				this.notificationService.show('No teams', null, 'error', {
					timeOut: 1000,
					extendedTimeOut: 0,
				});
			}
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
		if (this.teamsSubscription) {
			this.teamsSubscription.unsubscribe();
		}
	}
}
