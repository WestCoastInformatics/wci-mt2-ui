import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterEvent, Scroll } from '@angular/router';
import { Subscription } from 'rxjs';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { NotificationService } from 'src/app/services/notification.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { ProjectsComponentService } from 'src/app/pages/projects/projects-component.service';

@Component({
	selector: 'projects-page',
	templateUrl: './projects.component.html',
})
export class ProjectsComponent implements OnInit, OnDestroy {
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
	projectId: any;
	projectList: any[] = [];
	projectSubscription: Subscription;
	projectIsUat: boolean;
	selectedProject: any;
	showLoadingSpinner = false;
	currentURL: string;
	currentMenu = '';
	previouslyLoadedOrganizationId: string;
	previouslyLoadedEditionId: string;
	previouslyLoadedProjectId: string;

	constructor(
		private readonly breadcrumbService: BreadcrumbService,
		private readonly titleService: Title,
		protected readonly authService: AuthenticationService,
		private readonly refsetService: RefsetService,
		private readonly notificationService: NotificationService,
		private readonly projectsComponentService: ProjectsComponentService,
		private readonly route: ActivatedRoute,
		private readonly router: Router
	) {
		document.body.scrollTop = 0;
	}

	ngOnInit(): void {
		this.titleService.setTitle('Reference Set Tool - Projects');

		this.routerParamsSubscription = this.route.params.subscribe((params) => {
			if (params?.organizationId) {
				this.organizationId = params['organizationId'];
				this.editionId = params['editionId'];
				this.projectId = params['projectId'];
				this.getOrganizations();
			}
		});

		this.routerEventSubscription = this.router.events.subscribe((event: RouterEvent) => {
			if (event instanceof Scroll) {
				if (this.router.url.includes('organization') && this.router.url.includes('edition') && this.router.url.includes('projects')) {
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
				if (parts[p].includes('edition')) {
					if (parts[p + 1] != undefined) {
						this.editionId = parts[p + 1];
					}
				}
				if (parts[p].includes('projects')) {
					if (parts[p + 1] != undefined) {
						this.projectId = parts[p + 1];
					}
				}
			}
			let paramMenu = '';
			if (url.includes('refsets')) {
				paramMenu = 'refsets';
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
				this.getOrganizations();
			}
		}
	}

	setNavigation() {
		if (this.currentMenu === 'refsets') {
			const breadcrumbs: any = [{ path: '/dashboard', label: 'Dashboard' }];

			if (CodeUtility.hasValue(this.organizationId, true, true)) {
				breadcrumbs.push({
					path: 'organizations/' + this.organizationId + '/edition/' + this.editionId + '/projects',
					label: this.selectedOrganization?.name ? this.selectedOrganization?.name + ' / Projects' : '',
				});
			}

			breadcrumbs.push({ label: 'Reference Sets' });
			this.breadcrumbService.setBreadcrumbs(breadcrumbs);

			this.menu = [
				{
					name: 'Reference Sets',
					link: '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/refsets',
					icon: 'fa fa-copy',
					isActive: true,
				},
				{ name: 'Teams', link: '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/teams/', icon: 'fa fa-users' },
				{ name: 'Users', link: '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/users/', icon: 'fa fa-user' },
			];

			const configShowing = this.menu[this.menu.length - 1].name == 'Configuration';

			if (!configShowing && this.selectedOrganization && this.selectedOrganization.roles.includes('ADMIN')) {
				this.menu.push({
					name: 'Configuration',
					link: '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/configuration',
					icon: 'fa fa-cogs',
				});
			}
		}

		if (this.currentMenu === 'teams') {
			const breadcrumbs: any = [{ path: '/dashboard', label: 'Dashboard' }];

			if (CodeUtility.hasValue(this.organizationId, true, true)) {
				breadcrumbs.push({
					path: 'organizations/' + this.organizationId + '/edition/' + this.editionId + '/projects',
					label: this.selectedOrganization?.name ? this.selectedOrganization?.name + ' / Projects' : '',
				});
			}

			breadcrumbs.push({ label: 'Teams' });
			this.breadcrumbService.setBreadcrumbs(breadcrumbs);

			this.menu = [
				{ name: 'Reference Sets', link: '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/refsets', icon: 'fa fa-copy' },
				{ name: 'Teams', link: '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/teams/', icon: 'fa fa-users', isActive: true },
				{ name: 'Users', link: '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/users/', icon: 'fa fa-user' },
			];

			const configShowing = this.menu[this.menu.length - 1].name == 'Configuration';

			if (!configShowing && this.selectedOrganization && this.selectedOrganization.roles.includes('ADMIN')) {
				this.menu.push({
					name: 'Configuration',
					link: '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/configuration',
					icon: 'fa fa-cogs',
				});
			}
		}

		if (this.currentMenu === 'users') {
			const breadcrumbs: any = [{ path: '/dashboard', label: 'Dashboard' }];

			if (CodeUtility.hasValue(this.organizationId, true, true)) {
				breadcrumbs.push({
					path: 'organizations/' + this.organizationId + '/edition/' + this.editionId + '/projects',
					label: this.selectedOrganization?.name ? this.selectedOrganization?.name + ' / Projects' : '',
				});
			}

			breadcrumbs.push({ label: 'Users' });
			this.breadcrumbService.setBreadcrumbs(breadcrumbs);

			this.menu = [
				{ name: 'Reference Sets', link: '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/refsets', icon: 'fa fa-copy' },
				{ name: 'Teams', link: '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/teams/', icon: 'fa fa-users' },
				{ name: 'Users', link: '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/users/', icon: 'fa fa-user', isActive: true },
			];

			const configShowing = this.menu[this.menu.length - 1].name == 'Configuration';

			if (!configShowing && this.selectedOrganization && this.selectedOrganization.roles.includes('ADMIN')) {
				this.menu.push({
					name: 'Configuration',
					link: '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/configuration',
					icon: 'fa fa-cogs',
				});
			}
		}

		if (this.currentMenu === 'configuration') {
			const breadcrumbs: any = [{ path: '/dashboard', label: 'Dashboard' }];

			if (CodeUtility.hasValue(this.organizationId, true, true)) {
				breadcrumbs.push({
					path: 'organizations/' + this.organizationId + '/edition/' + this.editionId + '/projects',
					label: this.selectedOrganization?.name ? this.selectedOrganization?.name + ' / Projects' : '',
				});
			}

			breadcrumbs.push({ label: 'Configuration' });
			this.breadcrumbService.setBreadcrumbs(breadcrumbs);

			this.menu = [
				{ name: 'Reference Sets', link: '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/refsets', icon: 'fa fa-copy' },
				{ name: 'Teams', link: '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/teams/', icon: 'fa fa-users' },
				{ name: 'Users', link: '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/users/', icon: 'fa fa-user' },
				{
					name: 'Configuration',
					link: '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/configuration',
					icon: 'fa fa-cogs',
					isActive: true,
				},
			];
		}
	}

	getOrganizations(): void {
		if (this.previouslyLoadedOrganizationId == this.organizationId) {
			this.organizationSubscription = this.projectsComponentService.getOrganizations().subscribe((results) => {
				this.organizationList = <any>results;
				this.getSelectedOrganization();
			});
		} else {
			this.refsetService.getOrganizations().subscribe((results) => {
				this.organizationList = results.items;
				this.projectsComponentService.setOrganizations(this.organizationList);
				this.getSelectedOrganization();
			});
		}
	}

	getSelectedOrganization(): void {
		// If no organizations, back to landing page
		if (!this.organizationList || this.organizationList.length == 0) {
			this.notificationService.show('No organizations, you are likely logged out', null, 'error', {
				timeOut: 500,
				extendedTimeOut: 0,
			});
			this.authService.notAuthenticated();
			//this.router.navigate(['/']);
			return;
		}

		for (const organization of this.organizationList) {
			if (this.organizationId == organization.id) {
				this.selectedOrganization = organization;
				this.selectOrganization();
				return;
			}
		}

		if (!this.selectedOrganization && this.organizationList.length > 0) {
			this.getStoredOrganizationId();
		}
	}

	changeOrganization(): void {
		this.organizationId = this.selectedOrganization.id;
		this.selectedEdition = {};
		this.selectedProject = {};
		this.editionId = '0';
		this.projectId = '0';
		this.selectOrganization();
	}

	selectOrganization(): void {
		this.selectedEdition = null;
		this.editionList = [];
		this.selectedProject = null;
		this.projectList = [];
		this.getEditions();

		this.setNavigation();

		if (this.previouslyLoadedOrganizationId != this.organizationId) {
			this.previouslyLoadedOrganizationId = this.organizationId;
			this.changeLocationRoute();
		}
	}

	changeLocationRoute(): void {
		let currentRoute = this.currentURL;

		if (this.currentMenu == 'refsets') {
			currentRoute = '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/refsets';
		}
		if (this.currentMenu == 'teams') {
			currentRoute = '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/teams';
		}
		if (this.currentMenu == 'users') {
			currentRoute = '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/users';
		}
		if (this.currentMenu == 'configuration') {
			currentRoute = '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/configuration';
		}
		if (this.currentURL != currentRoute) {
			this.router.navigate([currentRoute]);
		}
	}

	getEditions(): void {
		if (this.previouslyLoadedEditionId == this.editionId && this.editionId != '0') {
			this.editionSubscription = this.projectsComponentService.getEditions().subscribe((results) => {
				this.editionList = <any>results;
				this.getSelectedEdition();
			});
		} else {
			this.refsetService.getEditions('&query=organizationId:' + this.organizationId + '&offset=0&sort=name&sortAscending=true').subscribe({
				next: (results) => {
					this.editionList = results?.items;
					this.projectsComponentService.setEditions(this.editionList);
					this.getSelectedEdition();
				},
				error: (error) => {
					this.showLoadingSpinner = false;
				},
			});
		}
	}

	getSelectedEdition(): void {
		if (this.editionId != '0') {
			for (const edition of this.editionList) {
				if (this.editionId == edition.id) {
					this.selectedEdition = edition;
					this.selectEdition();
					return;
				}
			}
		}
		if (!this.selectedEdition && this.editionList.length > 0) {
			this.getStoredEditionId();
		}
	}

	changeEdition(): void {
		this.projectId = '0';
		this.selectEdition();
	}

	selectEdition(): void {
		this.editionId = this.selectedEdition.id;
		if (this.previouslyLoadedEditionId != this.editionId) {
			this.previouslyLoadedEditionId = this.editionId;
			this.changeLocationRoute();
		}
		this.selectedProject = null;
		this.projectList = [];
		this.getProjects();
	}

	getProjects(): void {
		this.showLoadingSpinner = true;

		if (this.previouslyLoadedProjectId == this.projectId && this.projectId != '0') {
			this.projectSubscription = this.projectsComponentService.getProjects().subscribe((results) => {
				this.projectList = <any>results;
				this.getSelectedProject();
			});
		} else {
			this.refsetService.getProjects('includeMembers=true&query=editionId:' + this.editionId + '&offset=0&sort=name&sortAscending=true&includeModuleNames=true').subscribe({
				next: (results) => {
					this.projectList = results.items;
					this.projectsComponentService.setProjects(this.projectList);
					this.getSelectedProject();
				},
				error: (error) => {
					this.showLoadingSpinner = false;
				},
			});
		}
	}

	getSelectedProject(): void {
		this.showLoadingSpinner = false;
		if (this.projectId != '0') {
			for (const project of this.projectList) {
				if (this.projectId == project.id) {
					this.selectedProject = project;
					this.selectProject();
					return;
				}
			}
		}
		if (!this.selectedProject && this.projectList.length > 0) {
			this.getStoredProjectId();
		}
	}

	changeProject(): void {
		this.projectId = this.selectedProject.id;
		this.selectProject();
	}

	selectProject(): void {
		this.projectId = this.selectedProject.id;
		if (this.previouslyLoadedProjectId != this.projectId) {
			this.previouslyLoadedProjectId = this.projectId;
			const channel = new BroadcastChannel('projectChannel');
			channel.postMessage(UiUtility.getRoleString(this.selectedProject.roles));

			this.projectIsUat = this.selectedProject.name.includes('UAT');

			this.changeLocationRoute();
			this.setNavigation();

			localStorage.setItem('selectedOrganizationId', JSON.stringify(this.selectedOrganization.id));
			localStorage.setItem('selectedEditionId', JSON.stringify(this.selectedEdition.id));
			localStorage.setItem('selectedProjectId', JSON.stringify(this.selectedProject.id));
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

			if (!this.selectedOrganization) {
				this.selectedOrganization = this.organizationList[0];
				this.selectOrganization();
			}
		} else {
			if (!this.selectedOrganization) {
				this.selectedOrganization = this.organizationList[0];
				this.selectOrganization();
			}
		}
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
			if (!this.selectedEdition) {
				this.selectedEdition = this.editionList[0];
				this.selectEdition();
			}
		} else {
			if (!this.selectedEdition) {
				this.selectedEdition = this.editionList[0];
				this.selectEdition();
			}
		}
	}

	getStoredProjectId(): void {
		if (localStorage.getItem('selectedProjectId')) {
			const storedProjectId = JSON.parse(localStorage.getItem('selectedProjectId'));

			for (const project of this.projectList) {
				if (project.id == storedProjectId) {
					this.selectedProject = project;
					this.selectProject();
					return;
				}
			}

			// if the stored project ID doesn't match anything remove it
			localStorage.removeItem('selectedProjectId');

			if (!this.selectedProject) {
				this.selectedProject = this.projectList[0];
				this.selectProject();
			}
		} else {
			if (!this.selectedProject) {
				this.selectedProject = this.projectList[0];
				this.selectProject();
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
		if (this.editionSubscription) {
			this.editionSubscription.unsubscribe();
		}
		if (this.projectSubscription) {
			this.projectSubscription.unsubscribe();
		}
	}
}
