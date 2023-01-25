import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { NotificationService } from 'src/app/services/notification.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { TeamsService } from 'src/app/services/rest/teams.service';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'teams-configuration',
    templateUrl: './configuration.component.html',
    styleUrls: ['configuration.component.scss']
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
    showLoadingSpinner = true;

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

        this.titleService.setTitle('Reference Set Tool - Teams');

        this.roleOptions = [{ value: 'AUTHOR', display: 'Author' }, { value: 'REVIEWER', display: 'Reviewer' },
        { value: 'ADMIN', display: 'Admin' }, { value: 'VIEWER', display: 'Viewer' }];

        this.route.params.subscribe(params => {

            this.organizationId = params['organizationId'];
            this.teamId = params['teamId'];
            this.setNavigation();
        });

        this.currentUser = this.authService.getUser();
        this.getOrganizations();
    }

    setNavigation() {

        const breadcrumbs: any = [{ path: '/dashboard', label: 'Dashboard' }];

        if (CodeUtility.hasValue(this.organizationId, true, true)) {
            breadcrumbs.push({ path: 'organizations/' + this.organizationId + '/teams', label: this.selectedOrganization?.name ? this.selectedOrganization?.name + ' / Teams' : '' });
        }

        breadcrumbs.push({ label: 'Configuration' });
        this.breadcrumbService.setBreadcrumbs(breadcrumbs);

        this.menu = [
            { name: 'People', link: '/organization/' + this.organizationId + '/teams/' + this.teamId + '/people', icon: 'fa fa-user' },
            { name: 'Configuration', link: '/organization/' + this.organizationId + '/teams/' + this.teamId + '/configuration', icon: 'fa fa-cogs', isActive: true }
        ];

        this.location.replaceState('organization/' + this.organizationId + '/teams/' + this.teamId + '/configuration');
    }

    getOrganizations(): void {

        this.refsetService.getOrganizations().subscribe((results) => {

            this.organizationList = results.items;

            for (const organization of this.organizationList) {

                if (this.organizationId === organization.id) {

                    this.selectedOrganization = organization;
                    this.getTeams();
                    return;
                }
            }

            this.getStoredOrganizationId();

            if (!this.selectedOrganization) {
                this.showLoadingSpinner = false;
            }
        });
    }

    selectOrganization(): void {

        this.showLoadingSpinner = true;
        this.organizationId = this.selectedOrganization.id;
        this.location.replaceState('organization/' + this.organizationId + '/teams/configuration/');

        this.clearTeamData();
        this.setNavigation();
        this.getTeams();
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

    getTeams(): void {

        this.refsetService.getTeams('query=organizationId:' + this.selectedOrganization.id + '&sort=name&sortAscending=true').subscribe((results) => {

            this.showLoadingSpinner = false;
            this.teamList = results.items;

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

        localStorage.setItem('selectedOrganizationId', JSON.stringify(this.selectedOrganization.id));

        this.setNavigation();
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
        return this.profileEmailValue.length !== this.selectedTeam.primaryContactEmail.length
    }

    isNameChanged(): boolean {
        return this.profileNameValue.length !== this.selectedTeam.name.length
    }

    isDescriptionChanged(): boolean {
        return this.profileDescriptionValue.length !== this.selectedTeam.description.length
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
        let calls = [];
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
            forkJoin(calls).subscribe(result => {
                this.notificationService.show('Team roles was successfully updated', 'Success', 'success', {
                    timeOut: 3000,
                    extendedTimeOut: 0
                });
                this.selectedTeam['roles'] = this.selectedRoles
            });
        }

    }

    getSelectedTeamName(): string {
        return this.selectedTeam?.name;
    }
}
