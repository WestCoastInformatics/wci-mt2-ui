import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { User } from '../../models/user';
import { AuthenticationService } from '../../services/authentication/authentication.service';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { Router } from '@angular/router';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { UiUtility } from 'src/app/utilities/ui.utility';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

    environment: string;
    user: User;
    userSubscription: Subscription;
    guestUser: string;
    isUserLoggedIn = false;
    uiUtility = UiUtility;

    @Input() breadcrumbs: any;

    constructor(private authenticationService: AuthenticationService,
        private breadcrumbService: BreadcrumbService,
        private router: Router,
        private changeDetectorRef: ChangeDetectorRef,
        readonly refsetService: RefsetService) {

        this.guestUser = authenticationService.GUEST_USER;
        this.environment = window.location.host.split(/[.]/)[0].split(/[-]/)[0];

        this.userSubscription = this.authenticationService.userSubject.subscribe(data => {
            this.setUserInfo();
        });
    }

    ngOnInit() {

        this.breadcrumbService.getBreadcrumbs().subscribe(breadcrumbs => {

            this.breadcrumbs = breadcrumbs;
            this.changeDetectorRef.detectChanges();
        });

        this.setUserInfo();
    }

    setUserInfo() {
        this.user = this.authenticationService.getUser();
        this.isUserLoggedIn = this.user && this.user.userName != this.guestUser;
    }

    showProjectRoleAndAssignee(): boolean {
        return this.router.url.includes('details');
    }

    navigate(breadcrumbId) {

        let breadcrumb = this.breadcrumbs[breadcrumbId];

        if (breadcrumb.selectable) {

            if (breadcrumb.path.includes('/projects')) {
                breadcrumb.path = '/organization/0/projects'
            }

            this.router.navigate([breadcrumb.path]);
        }
    }

    logoutUser() {
        this.authenticationService.logoutUser();
    }

    login() {
        this.router.navigate(['/login']);
    }

    assignedUser(): string {
        return this.refsetService.assignedUser ? this.refsetService.assignedUser : 'Unassigned';
    }

    breadcrumbsHasDir(): boolean {
        if (this.breadcrumbs.length == 0)
            return false;
        return this.breadcrumbs.find(bc => bc.label == "Directory") != undefined;
    }

    breadcrumbsHasProjects(): boolean {
        if (this.breadcrumbs.length == 0)
            return false;
        return this.breadcrumbs.find(bc => bc.label == "Projects") != undefined;
    }

    navigateToRoute(route: string): void {
        if (this.router.url.includes(route)) {
            window.location.reload();
        } else {
            this.router.navigate([route]);
        }
    }
}
