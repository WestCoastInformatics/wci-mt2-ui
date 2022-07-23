import {Component, NgZone, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {SidebarMenuItem} from 'src/app/models/sidebar.menu-item.model';
import {AuthenticationService} from 'src/app/services/authentication/authentication.service';
import {RefsetService} from 'src/app/services/rest/refset.service';
import {UsersService} from 'src/app/services/rest/users.service';
import {UiUtility} from 'src/app/utilities/ui.utility';

@Component({
    selector: 'personal-landing',
    templateUrl: './landing.component.html'
})
export class PersonalLandingComponent implements OnInit {
    menu: SidebarMenuItem[] = [
        {name: 'About', link: '/personal/landing', icon: 'fa fa-user', isActive: true},
        {name: 'Configuration', link: '/personal/configuration', icon: 'fa fa-cogs'}
    ];

    selectedTeam: any;
    userId: any;
    user: any;
    todayDate: Date = new Date();
    organizationList = [];
    teamList = [];
    uiUtility = UiUtility;

    constructor(private readonly authService: AuthenticationService,
                private readonly userService: UsersService,
                private readonly refsetService: RefsetService,
                private readonly router: Router,
                private readonly zone: NgZone) {
    }

    ngOnInit(): void {
        if (window.location.pathname.split('/').length > 3) {
            this.userId = window.location.pathname.split('/')[3];
        } else {
            this.userId = this.authService.getUser().id;
        }
        this.getUser();
        //this.setNavigation();
    }

    /* setNavigation() {

    } */

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

        this.refsetService.getTeams('limit=500&offset=0&sort=name&sortAscending=true').subscribe((results) => {
            this.teamList = results.items.filter(i => {
                return i.members.indexOf(this.userId) > -1;
            });
        });
    }

    goToTeam(teamId: string, organizationId: string): void {
        //this.zone.run(() => {
        this.router.navigate([`/organization/${organizationId}/teams/people/${teamId}`]);
        //});
    }
}
