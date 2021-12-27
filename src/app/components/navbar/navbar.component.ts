import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { User } from '../../models/user';
import { AuthenticationService } from '../../services/authentication/authentication.service';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { NotificationService } from 'src/app/services/notification.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

    environment: string;
    user: User;
    userRoles: any;
    userSubscription: Subscription;
    breadcrumbs;
    authToken: any;
    guestUser: string;
    isUserLoggedIn =  false;

    constructor(private authenticationService: AuthenticationService,
        private breadcrumbService: BreadcrumbService,
        private readonly modalService: NgbModal,
        private router: Router,
        private changeDetectorRef: ChangeDetectorRef,
        readonly refsetService: RefsetService, 
        private readonly notificationService: NotificationService) {

        this.authToken = localStorage.getItem('auth_token');
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

        let userWasLoggedin = this.isUserLoggedIn;

        this.user = this.authenticationService.getUser();
        this.userRoles = this.user?.roles;
        this.isUserLoggedIn = this.user && this.user.userName != this.guestUser;

        // if the user is now logged out and on a page that requires being logged in, then send them to the directory
        if (userWasLoggedin && !this.isUserLoggedIn) {

            if (this.router.url.includes('project') || this.router.url.includes('edit/refset')) {
                this.router.navigateByUrl('directory');
            }

            this.modalService.dismissAll();
            this.notificationService.show('Your session has expired and you have been logged out', null, 'info', {timeOut: 5000, extendedTimeOut: 0});
        }
    }

    showProjectRoleAndAssignee(): boolean {
        return this.router.url.includes('details') || this.router.url.includes('edit/refset');
    }

    getProjectRoleString(): string {

        const projectRoles = [];

        if (!this.user?.roles) {
            return '';
        }

        for (const role of this.user?.roles) {

            if (role?.includes('AUTHOR') || role?.includes('REVIEWER')) {
                projectRoles.push(role.toLowerCase().charAt(0).toUpperCase() + role.toLowerCase().slice(1));
            }
        }

        return projectRoles?.length > 1 ? projectRoles.join(', ') : projectRoles[0];
    }

    navigate(breadcrumbId){

        let breadcrumb = this.breadcrumbs[breadcrumbId];

        if (breadcrumb.selectable){
            this.router.navigate([breadcrumb.path]);
        }
    }

    logoutUser() {
        this.authenticationService.logoutUser();
    }

    logout() {
        this.authenticationService.logout();
    }

    login() {
        this.router.navigate(['/login']);
    }

    assignedUser(): string {
        return this.refsetService.assignedUser ? this.refsetService.assignedUser : 'Unassigned';
    }
}
