import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { NotificationService } from 'src/app/services/notification.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { TeamsService } from 'src/app/services/rest/teams.service';
import { CodeUtility } from 'src/app/utilities/code.utility';

@Component({
    selector: 'teams-configuration',
    templateUrl: './configuration.component.html'
})
export class TeamsConfigurationComponent implements OnInit {

    menu: SidebarMenuItem[] = [];
    profileNameValue = '';
    profileEmailValue = '';
    profileDescriptionValue = '';
    selectedTeam: any;
    organizationList = [];
    organizationId: string;
    selectedOrganization: any;
    teamId: string;
    teamList = [];
    currentUser: any;
    roleOptions: any;
    selectedRoles: any;
    selectedForRemove = [];
    selectedForAdd = [];
    emailError = '';

    constructor(private readonly breadcrumbService: BreadcrumbService,
        private readonly titleService: Title,
        private readonly refsetService: RefsetService,
        private readonly route: ActivatedRoute,
        private readonly authService: AuthenticationService,
        private readonly teamsService: TeamsService,
        private readonly notificationService: NotificationService,
        private location: Location) {
        document.body.scrollTop = 0;
    }

    ngOnInit(): void {

        this.titleService.setTitle('Refset Tool - Teams');

        this.roleOptions = [{ value: 'AUTHOR', display: 'Author' }, { value: 'REVIEWER', display: 'Reviewer' },
        { value: 'ADMIN', display: 'Admin' }, { value: 'VIEWER', display: 'Viewer' }];

        this.route.params.subscribe(params => {

            this.organizationId = params['organizationId'];
            this.teamId = params['id'];
            this.setNavigation();
        });

        this.currentUser = this.authService.getUser();
        this.getOrganizations();
    }

    setNavigation() {

        const breadcrumbs: any = [{ path: '/dashboard', label: 'Dashboard' }];

        if (CodeUtility.hasValue(this.organizationId, true, true)) {
            breadcrumbs.push({ path: 'organizations/teams/' + this.organizationId, label: 'Organization Teams' });
        }

        breadcrumbs.push({ label: 'Configuration' });
        this.breadcrumbService.setBreadcrumbs(breadcrumbs);

        this.menu = [
            { name: 'People', link: '/organization/' + this.organizationId + '/teams/people', icon: 'fa fa-user' },
            {
                name: 'Configuration',
                link: '/organization/' + this.organizationId + '/teams/configuration',
                icon: 'fa fa-cogs',
                isActive: true
            }
        ];
    }

    getOrganizations() {

        this.refsetService.getOrganizations().subscribe((results) => {

            this.organizationList = results.items;

            for (const organization of this.organizationList) {

                if (this.organizationId == organization.id) {

                    this.selectedOrganization = organization;
                    this.getTeams();
                    break;
                }
            }
        });
    }

    selectOrganization(): void {

        this.organizationId = this.selectedOrganization.id;
        this.location.replaceState('organization/' + this.organizationId + '/teams/configuration/');

        this.clearTeamData();
        this.getTeams();
    }

    getTeams(): void {

        this.refsetService.getTeams('query=organizationId:' + this.selectedOrganization.id + '&limit=500&offset=0&sort=name&sortAscending=true').subscribe((results) => {

            this.teamList = results.items;

            for (const team of this.teamList) {

                if (this.teamId == team.id) {
                    this.setTeamData(team);
                }
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
        this.teamId = null;
        this.selectedTeam = null;
        this.selectedRoles = [];
        this.profileNameValue = null;
        this.profileEmailValue = null;
        this.profileDescriptionValue = null;
    }

    selectTeam(_$event: any): void {

        this.setTeamData(this.selectedTeam);
        this.location.replaceState('organization/' + this.organizationId + '/teams/configuration/' + this.selectedTeam.id);
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

    onKeyDownEvent(event: any): void {

        console.log(event.target.value);
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

        if (this.selectedTeam['roles']) {
            for (const role of this.selectedTeam['roles']) {
                if (!this.selectedRoles.includes(role)) {
                    this.selectedForRemove.push(role);
                }
            }

            this.selectedForRemove.forEach((x) => {
                this.teamsService.removeRole(this.selectedTeam.id, x).subscribe();
            });
        }

        for (const role of this.selectedRoles) {
            if (!this.selectedTeam['roles'].includes(role)) {
                this.teamsService.addRole(this.selectedTeam.id, role).subscribe();
            }
        }

    }

    getSelectedTeamName(): string {
        return this.selectedTeam?.name;
    }
}
