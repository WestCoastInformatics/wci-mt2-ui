import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { NotificationService } from 'src/app/services/notification.service';
import { ProjectsService } from 'src/app/services/rest/projects.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { ProjectsComponentService } from 'src/app/pages/projects/projects-component.service';

@Component({
	standalone: false,
	selector: 'projects-configuration',
	templateUrl: './configuration.component.html',
	styleUrls: ['configuration.component.scss'],
})
export class ProjectsConfigurationComponent implements OnInit, OnDestroy {
	routerParamsSubscription: Subscription;
	routerEventSubscription: Subscription;
	profileNameValue = '';
	profileEmailValue = '';
	profileDescriptionValue = '';
	isPrivate = false;
	selectedProject: any;
	projectId: any;
	projectList: any[] = [];
	projectSubscription: Subscription;
	selectedTeamIds = [];
	selectedTeams = [];
	teamList = [];
	currentUser: any;
	currentURL: string;
	containsRole = false;
	emailError = '';
	organizationId: any;
	showLoadingSpinner = false;
	userMessages = {
		updateProjectSuccess: 'Update process complete.',
		preventRemoveTeam: 'Cannot remove this team as it would remove a required role from the project',
		warnTeamRoleRequired: 'A project must have one or more teams supporting all three roles (author, reviewer, and admin) to save.',
	};

	constructor(
		private readonly titleService: Title,
		private readonly refsetService: RefsetService,
		private readonly projectsService: ProjectsService,
		private readonly projectsComponentService: ProjectsComponentService,
		private readonly route: ActivatedRoute,
		private readonly router: Router,
		private readonly authService: AuthenticationService,
		private readonly notificationService: NotificationService
	) {
		document.body.scrollTop = 0;
	}

	ngOnInit(): void {
		this.titleService.setTitle('Reference Set Tool - Projects - Configuration');
		this.currentUser = this.authService.getUser();

		this.routerParamsSubscription = this.route.params.subscribe((params) => {
			this.organizationId = params['organizationId'];
			this.projectId = params['projectId'];
		});

		this.routerEventSubscription = this.router.events.subscribe((event) => {
			if (this.router.url.includes('organization') && this.router.url.includes('edition') && this.router.url.includes('projects') && this.router.url.includes('configuration')) {
				this.checkLocationPath(this.router.url);
			} else {
				this.ngOnDestroy();
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
				if (parts[p].includes('projects')) {
					if (parts[p + 1] != undefined) {
						this.projectId = parts[p + 1];
					}
				}
			}
			if (this.organizationId) {
				this.clearProjectData();
				this.getProjects();
			}
		}
	}

	getProjects(): void {
		const project_id = this.projectId;
		this.projectSubscription = this.projectsComponentService.getProjects().subscribe((results) => {
			this.projectList = <any>results;
			for (const project of this.projectList) {
				if (project_id == project.id) {
					this.selectedProject = project;
					this.showProjectData();
					return;
				}
			}
		});
	}

	showProjectData(): void {
		this.profileNameValue = this.selectedProject.name;
		// this.profileEmailValue = this.selectedProject.primaryContactEmail;
		this.profileDescriptionValue = this.selectedProject.description;
		this.isPrivate = this.selectedProject.privateProject;
		this.selectedTeamIds = this.selectedProject?.teams;

		// set the selected teams
		for (const team of this.teamList) {
			if (this.selectedTeamIds.includes(team.id)) {
				this.selectedTeams.push(team);
			}
		}
		this.getTeams();
	}

	clearProjectData(): void {
		this.selectedProject = null;
		this.projectList = [];
		this.profileNameValue = null;
		this.profileDescriptionValue = null;
		this.isPrivate = null;
		this.selectedTeamIds = [];
		this.selectedTeams = [];
		this.teamList = [];
	}

	isValidEmail(): boolean {
		const lower = this.profileEmailValue.toLowerCase();
		const flag = lower.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
		if (flag == null) {
			this.emailError = 'Email is invalid.';
		} else {
			this.emailError = '';
		}
		return flag == null ? false : true;
	}

	onKeyDownEvent(event: any) {
		this.isValidEmail();
	}

	isAnyFieldChanged() {
		if (this.profileNameValue !== this.selectedProject.name || this.profileDescriptionValue !== this.selectedProject.description || this.isPrivate !== this.selectedProject.privateProject) {
			return true;
		}

		return false;
	}

	updateProject(): void {
		this.selectedProject.name = this.profileNameValue;
		this.selectedProject.description = this.profileDescriptionValue;
		this.selectedProject.privateProject = this.isPrivate;
		this.saveProject();
	}

	updateProjectTeams(): void {
		this.selectedProject = { ...this.selectedProject, teams: this.selectedTeamIds };
		this.saveProject();
	}

	saveProject() {
		this.projectsService.updateProject(this.projectId, this.selectedProject).subscribe({
			next: (results) => {
				this.teamList.map(function (team) {
					return Object.assign(team, { saved: true });
				});
				this.notificationService.show(this.userMessages.updateProjectSuccess, null, 'success', { timeOut: 0, extendedTimeOut: 0 });
			},
			error: (error) => {
				//
			},
		});
	}

	getTeams(): void {
		const query = 'organizationId:' + this.organizationId;

		this.refsetService.getTeams('hideOrganizationTeams=true&sort=name&sortAscending=true&query=' + query).subscribe((results) => {
			this.teamList = results.items.map(function (item) {
				return Object.assign(item, { saved: true });
			});
		});
	}

	setTeamName(team: any): string {
		const roleString = team?.roles?.map((role) => {
			const lowercaseRole = role.toLowerCase();
			return lowercaseRole[0].toUpperCase() + lowercaseRole.substring(1);
		});

		return `${team.name} (${roleString.join(', ')})`;
	}

	hideAddButton(team: any): boolean {
		return this.selectedTeamIds?.includes(team.id);
	}

	addBold(team: any): boolean {
		return this.selectedProject?.teams?.some((containedTeam) => {
			return containedTeam === team.id;
		});
	}

	addToTeamList(team: any): void {
		//change saved state if the team has been added
		team.saved = false;
		this.selectedTeams.push(team);
		this.selectedTeamIds?.push(team.id);
		this.checkIfTeamContainsRoles();
	}

	removeFromTeamList(team): void {
		if (this.selectedTeamIds?.includes(team.id) && this.selectedTeamIds?.length === 1) {
			//if a project has only one team removed before the first team added has been saved then warn only
			//else after first team has been saved then prevent removal and show error before a user has selected another team with all required roles then the first team can be removed.
			if (team.saved === false) {
				this.notificationService.show(this.userMessages.warnTeamRoleRequired, null, 'error', { timeOut: 0, extendedTimeOut: 0 });
			} else {
				this.notificationService.show(this.userMessages.preventRemoveTeam, null, 'error', { timeOut: 0, extendedTimeOut: 0 });
				return;
			}
		}

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

		for (const team of this.selectedTeams) {
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
			document.getElementById('save-teams-btn').parentElement.title = 'Save Teams';
		} else {
			this.containsRole = false;
			document.getElementById('save-teams-btn').parentElement.title = this.userMessages.warnTeamRoleRequired;
			//if this is the first team added to the project show warning message
			if (this.selectedTeams.length === 1) {
				this.notificationService.show(this.userMessages.warnTeamRoleRequired, null, 'error', { timeOut: 0, extendedTimeOut: 0 });
				return;
			}
		}
	}

	getSelectedProjectName(): string {
		return this.selectedProject?.name;
	}

	getSelectedProjectId(): string {
		return this.selectedProject?.id;
	}

	ngOnDestroy() {
		if (this.routerParamsSubscription) {
			this.routerParamsSubscription.unsubscribe();
		}
		if (this.routerEventSubscription) {
			this.routerEventSubscription.unsubscribe();
		}
		if (this.projectSubscription) {
			this.projectSubscription.unsubscribe();
		}
	}
}
