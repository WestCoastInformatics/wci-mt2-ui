import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { User } from '../../models/user';
import { AuthenticationService } from '../../services/authentication/authentication.service';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RefsetService } from 'src/app/services/rest/refset.service';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

    environment: string;
    user: User;
    userSubscription: Subscription;
    breadcrumbs;
    authToken: any;

    constructor(private authenticationService: AuthenticationService,
        private breadcrumbService: BreadcrumbService,
        private domSanitizer: DomSanitizer,
        private router: Router,
        private changeDetectorRef: ChangeDetectorRef,
        private readonly refsetService: RefsetService) {

        this.authToken = localStorage.getItem('auth_token');

        this.environment = window.location.host.split(/[.]/)[0].split(/[-]/)[0];
        //this.userSubscription = this.authenticationService.getUser().subscribe(data => this.user = data);

    }

    ngOnInit() {
        //this.authenticationService.setUser();

        this.breadcrumbService.getBreadcrumbs().subscribe(breadcrumbs => {

            this.breadcrumbs = breadcrumbs;
            this.changeDetectorRef.detectChanges();
        });

        this.getUser();
    }

    private getUser(): void {
        this.user = this.authenticationService.getRefsetUserDetails();
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
        this.authenticationService.logoutUser().subscribe( data => {
            this.router.navigate(['login']);
            document.cookie = `csrftoken; expires= ${new Date()}; path=/`;
            // localStorage.clear();
        }, err => {
        });
    }

    logout() {
        this.authenticationService.logout();
    }

    isAssigned(): boolean {
        return this.refsetService.isAssigned;
    }
}
