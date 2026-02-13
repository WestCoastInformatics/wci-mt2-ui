import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { NotificationService } from 'src/app/services/notification.service';
import { TeamsService } from 'src/app/services/rest/teams.service';
import { TeamsComponentService } from 'src/app/pages/teams/teams-component.service';

@Component({
	standalone: false,
	selector: 'teams-configuration',
	templateUrl: './configuration.component.html',
	styleUrls: ['configuration.component.css'],
})
export class TeamsConfigurationComponent implements OnInit, OnDestroy {
	routerParamsSubscription: Subscription;
	routerEventSubscription: Subscription;
	profileNameValue = '';
	profileEmailValue = '';
	profileDescriptionValue = '';
	selectedTeam: any;
	organizationId: string;
	teamId: string;
	teamList = [];
	teamsSubscription: Subscription;
	currentUser: any;
	roleOptions: any;
	selectedRoles: any;
	selectedForRemove = [];
	selectedForAdd = [];
	emailError = '';
	showLoadingSpinner = false;
	currentURL: string;

	constructor(
		private readonly titleService: Title,
		private readonly route: ActivatedRoute,
		private readonly router: Router,
		private readonly authService: AuthenticationService,
		private readonly teamsService: TeamsService,
		private readonly teamsComponentService: TeamsComponentService,
		private readonly notificationService: NotificationService
	) {
		document.body.scrollTop = 0;
	}

	ngOnInit(): void {
		this.titleService.setTitle('Reference Set Tool - Teams - Configuration');

		this.roleOptions = [
			{ value: 'AUTHOR', display: 'Author' },
			{ value: 'REVIEWER', display: 'Reviewer' },
			{ value: 'ADMIN', display: 'Admin' },
			{ value: 'VIEWER', display: 'Viewer' },
		];

		this.currentUser = this.authService.getUser();

		this.routerParamsSubscription = this.route.params.subscribe((params) => {
			this.organizationId = params['organizationId'];
			this.teamId = params['teamId'];
			this.getTeams();
		});

		this.routerEventSubscription = this.router.events.subscribe((event) => {
			if (this.router.url.includes('organization') && this.router.url.includes('teams') && this.router.url.includes('configuration')) {
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
				if (parts[p].includes('teams')) {
					if (parts[p + 1] != undefined) {
						this.teamId = parts[p + 1];
					}
				}
			}
			if (this.organizationId) {
				this.clearTeamData();
				this.getTeams();
			}
		}
	}

	getTeams(): void {
		this.teamsSubscription = this.teamsComponentService.getTeams().subscribe((results) => {
			this.teamList = <any>results;

			for (const team of this.teamList) {
				if (this.teamId == team.id) {
					this.setTeamData(team);
					return;
				}
			}

			if (this.teamList && this.teamList.length > 0) {
				this.setTeamData(this.teamList[0]);
			}
		});
	}

	setTeamData(team: any) {
		this.teamId = team.id;
		this.selectedTeam = team;
		this.selectedRoles = this.selectedTeam.roles;
		this.profileNameValue = this.selectedTeam.name;
		this.profileEmailValue = this.selectedTeam.primaryContactEmail;
		this.profileDescriptionValue = this.selectedTeam.description;
	}

	clearTeamData() {
		this.teamList = [];
		this.selectedTeam = null;
		this.selectedRoles = [];
		this.profileNameValue = null;
		this.profileEmailValue = null;
		this.profileDescriptionValue = null;
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

	isEmailChanged(): boolean {
		return this.profileEmailValue.length !== this.selectedTeam.primaryContactEmail.length;
	}

	isNameChanged(): boolean {
		return this.profileNameValue.length !== this.selectedTeam.name.length;
	}

	isDescriptionChanged(): boolean {
		return this.profileDescriptionValue.length !== this.selectedTeam.description.length;
	}

	onKeyDownEvent(event: any): void {
		this.isValidEmail();
	}

	updateTeam(): void {
		this.selectedTeam.name = this.profileNameValue;
		this.selectedTeam.primaryContactEmail = this.profileEmailValue;
		this.selectedTeam.description = this.profileDescriptionValue;

		this.teamsService.updateTeam(this.teamId, this.selectedTeam).subscribe((team) => {
			if (team) {
				this.notificationService.show('Team was successfully updated', 'Success', 'success', { timeOut: 3000, extendedTimeOut: 0 });
			}
		});
	}

	updateTeamRoles(): void {
		const calls = [];
		if (this.selectedTeam['roles']) {
			for (const role of this.selectedTeam['roles']) {
				if (!this.selectedRoles.includes(role)) {
					this.selectedForRemove.push(role);
				}
			}

			this.selectedForRemove.forEach((x) => {
				calls.push(this.teamsService.removeRole(this.selectedTeam.id, x));
			});
		}

		for (const role of this.selectedRoles) {
			if (!this.selectedTeam['roles'].includes(role)) {
				calls.push(this.teamsService.addRole(this.selectedTeam.id, role));
			}
		}

		if (calls.length > 0) {
			forkJoin(calls).subscribe((result) => {
				this.notificationService.show('Team roles was successfully updated', 'Success', 'success', {
					timeOut: 3000,
					extendedTimeOut: 0,
				});
				this.selectedTeam['roles'] = this.selectedRoles;
			});
		}
	}

	getSelectedTeamName(): string {
		return this.selectedTeam?.name;
	}

	getSelectedTeamTypeEnabled(): boolean {
		return this.selectedTeam?.type === 'O' ? false : true;
	}

	ngOnDestroy() {
		if (this.routerParamsSubscription) {
			this.routerParamsSubscription.unsubscribe();
		}
		if (this.routerEventSubscription) {
			this.routerEventSubscription.unsubscribe();
		}
		if (this.teamsSubscription) {
			this.teamsSubscription.unsubscribe();
		}
	}
}
