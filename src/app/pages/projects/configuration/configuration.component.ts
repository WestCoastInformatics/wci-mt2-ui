import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { NotificationService } from 'src/app/services/notification.service';
import { ProjectsService } from 'src/app/services/rest/projects.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { TeamsService } from 'src/app/services/rest/teams.service';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { Location } from '@angular/common';

@Component({
	selector: 'projects-configuration',
	templateUrl: './configuration.component.html'
})
export class ProjectsConfigurationComponent implements OnInit {

	menu: SidebarMenuItem[] = [];
	profileNameValue = '';
	organizations: any;
	selectedOrganization: any;
	profileEmailValue = '';
	profileDescriptionValue = '';
	isPrivate = false;
	selectedProject: any;
	projectId: any;
	projectList = [];
	selectedTeamIds = [];
	selectedTeams = [];
	teamList = [];
	currentUser: any;
	containsRole = false;
	emailError = '';
	organizationId: any;
	showLoadingSpinner = false;

	constructor(private readonly breadcrumbService: BreadcrumbService,
		private readonly titleService: Title,
		private readonly refsetService: RefsetService,
		private readonly projectsService: ProjectsService,
		private readonly route: ActivatedRoute,
		private readonly router: Router,
		private readonly authService: AuthenticationService,
		private readonly notificationService: NotificationService,
		private location: Location) {
			document.body.scrollTop = 0;
		}

	ngOnInit(): void {

		this.titleService.setTitle('Refset Tool - Projects');

		this.route.params.subscribe(params => {

			this.organizationId = params['organizationId'];
			this.projectId = params['id'];
			this.setNavigation();
		});

		this.showLoadingSpinner = true;

		this.currentUser = this.authService.getUser();
		this.getOrganizations();
	}

	setNavigation() {

		let breadcrumbs: any = [{ path: '/dashboard', label: 'Dashboard' }];

		if (CodeUtility.hasValue(this.organizationId), true, true) {
			breadcrumbs.push({ path: 'organizations/projects/' + this.organizationId, label: 'Organization Projects' });
		}

		breadcrumbs.push({ label: 'Configuration' });
		this.breadcrumbService.setBreadcrumbs(breadcrumbs);

		this.menu = [
			{ name: 'Reference Sets', link: '/organization/' + this.organizationId + '/projects', icon: 'fa fa-copy' },
			{ name: 'People', link: '/organization/' + this.organizationId + '/projects/people', icon: 'fa fa-user' },
			{ name: 'Configuration', link: '/organization/' + this.organizationId + '/projects/configuration', icon: 'fa fa-cogs', isActive: true }
		];
	}

	getOrganizations(): void {

		// get list of organizations
		this.refsetService.getOrganizations().subscribe((organizationResults) => {

			this.showLoadingSpinner = false;
			this.organizations = organizationResults?.items;

			for (let organization of this.organizations) {

                if (this.organizationId == organization.id) {

                    this.selectedOrganization = organization;
                    this.getProjects();
					this.getTeams();
                    break;
                }
            }
		});
	}

	selectOrganization($event): void {

		this.organizationId = $event.value.id;
		this.clearProjectData();
		this.getProjects();
		this.getTeams();
	}

	getProjects(): void {

		this.showLoadingSpinner = true;

		this.refsetService.getProjects('query=organizationId:' + this.selectedOrganization.id + '&limit=500&offset=0&sort=name&sortAscending=true').subscribe((results) => {

			this.showLoadingSpinner = false;
			this.projectList = results.items;

			for (let project of this.projectList) {

                if (this.projectId == project.id) {

                    this.selectedProject = project;
                    this.showProjectData(); 
                }
            }

			if (this.projectList && this.projectList.length > 0) {

                this.selectedProject = this.projectList[0];
                this.selectProject(null);
            }
		});
	}

	selectProject($event): void {

		this.projectId = this.selectedProject.id;
        this.location.replaceState('organization/' + this.organizationId + '/projects/configuration/' + this.projectId);
        this.showProjectData();  
	}

	showProjectData(): void {

		this.profileNameValue = this.selectedProject.name;
		// this.profileEmailValue = this.selectedProject.primaryContactEmail;
		this.profileDescriptionValue = this.selectedProject.description;
		this.isPrivate = this.selectedProject.privateProject;
		this.selectedTeamIds = this.selectedProject?.teams;
	}

	clearProjectData(): void {

		this.selectedProject = null;
		this.projectList = [];
		this.profileNameValue = null;
		// this.profileEmailValue = this.selectedProject.primaryContactEmail;
		this.profileDescriptionValue = null;
		this.isPrivate = null;
		this.selectedTeamIds = [];
		this.teamList = [];
	}

	isValidEmail(): boolean {

		var lower = this.profileEmailValue.toLowerCase();
		var flag = lower.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
		);
		if (flag == null) {
			this.emailError = "Email is invalid.";
		} else {
			this.emailError = "";
		}
		return flag == null ? false : true;
	}

	onKeyDownEvent(event: any) {

		console.log(event.target.value);
		this.isValidEmail();
	}

	updateProject(): void {

		this.selectedProject.name = this.profileNameValue;
		// this.selectedProject.primaryContactEmail = this.profileEmailValue;
		this.selectedProject.description = this.profileDescriptionValue;
		this.selectedProject.privateProject = this.isPrivate;
		this.projectsService.updateProject(this.projectId, this.selectedProject).subscribe(() => {
			this.notificationService.show("Update process complete.", null, "success", { timeOut: 0, extendedTimeOut: 0 });
		});
	}

	updateProjectTeams(): void {

		this.selectedProject = { ...this.selectedProject, teams: this.selectedTeamIds };
		this.projectsService.updateProject(this.projectId, this.selectedProject).subscribe();
	}

	getTeams(): void {

		let query = 'organizationId:' + this.organizationId;

		this.refsetService.getTeams('limit=500&offset=0&sort=name&sortAscending=true&query=' + query).subscribe((results) => {
			this.teamList = results.items;
		});
	}

	setTeamName(team: any): string {
		const roleString = team.roles.map((role) => {
			const lowercaseRole = role.toLowerCase();
			return lowercaseRole[0].toUpperCase() + lowercaseRole.substring(1);
		});

		return `${team.name} (${roleString.join(', ')})`;
	}

	hideAddButton(team: any): boolean {
		return this.selectedTeamIds?.includes(team.id);
	}

	addBold(team: any): boolean {
		return (this.selectedProject?.teams?.some((containedTeam) => {
			return containedTeam === team.id;
		}));
	}

	addToTeamList(team: any): void {
		this.selectedTeams.push(team);
		this.selectedTeamIds?.push(team.id);
		this.checkIfTeamContainsRoles();
	}

	removeFromTeamList(team): void {
		const idIndex = this.selectedTeamIds?.indexOf(team.id);
		if (idIndex > -1) {
			this.selectedTeamIds.splice(idIndex, 1);
		}
		const index = this.selectedTeams.indexOf(team);
		if (index > -1) {
			this.selectedTeams.splice(index, 1);
		}
		this.checkIfTeamContainsRoles();
	}

	checkIfTeamContainsRoles(): void {

		let hasAdmin = false;
		let hasAuthor = false;
		let hasReviewer = false;

		for (let team of this.selectedTeams) {

			if (team['roles']?.includes('ADMIN')) {
				hasAdmin = true;
			}

			if (team['roles']?.includes('AUTHOR')) {
				hasAuthor = true;
			}

			if (team['roles']?.includes('REVIEWER')) {
				hasReviewer = true;
			}

			if (hasAdmin && hasAuthor && hasReviewer) {
				break;
			}
		}
		
		if (hasAdmin && hasAuthor && hasReviewer) {
			this.containsRole = true;
		} else {
			this.containsRole = false;
		}
	}

	getSelectedProjectName(): string {
		return this.selectedProject?.name;
	}

	getSelectedProjectId(): string {
		return this.selectedProject?.id;
	}
}
