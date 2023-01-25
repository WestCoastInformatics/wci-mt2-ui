import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { UsersService } from 'src/app/services/rest/users.service';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { Location } from '@angular/common';

@Component({
    selector: 'personal-landing',
    templateUrl: './landing.component.html',
    styleUrls: ['landing.component.scss']
})
export class PersonalLandingComponent implements OnInit {

    menu: SidebarMenuItem[] = [];
    selectedTeam: any;
    userId: any;
    user: any;
    todayDate: Date = new Date();
    organizationList = [];
    teamList = [];
    uiUtility = UiUtility;
    loggedUserId: any;

    constructor(private readonly authService: AuthenticationService,
        private readonly userService: UsersService,
        private readonly refsetService: RefsetService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private location: Location) {
    }

    ngOnInit(): void {

        this.loggedUserId = this.authService.getUser().id;

        this.route.params.subscribe(params => {

            if (params['userId']) {
                this.userId = params['userId'];
            } else {
                this.userId = this.authService.getUser().id;
            }

            this.setNavigation();
        });

        this.getUser();
    }

    setNavigation() {

        this.menu = [
            { name: 'About', link: '/personal/' + this.userId + '/landing', icon: 'fa fa-user', isActive: true }
        ];

        if (this.userId === this.loggedUserId) {
            this.menu.push({ name: 'Configuration', link: '/personal/' + this.userId + '/configuration', icon: 'fa fa-cogs' });
        }

        this.location.replaceState('personal/' + this.userId + '/landing');
    }

    getUser(): void {
        this.userService.getUser(this.userId).subscribe((x) => {
            this.user = x;
            this.getTeams();
            this.getOrganizations();
        });
    }

    getOrganizations(): void {
        this.refsetService.getOrganizations().subscribe((results) => {
            this.organizationList = results.items;
        });
    }

    getTeams(): void {

        this.refsetService.getTeams('sort=name&sortAscending=true').subscribe((results) => {
            this.teamList = results.items.filter(i => {
                return i.members.indexOf(this.userId) > -1;
            });
        });
    }

    goToTeam(teamId: string, organizationId: string): void {
        this.router.navigate([`/organization/${organizationId}/teams/${teamId}/people`]);
    }
}
