import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { User } from '../../models/user';
import { AuthenticationService } from '../../services/authentication/authentication.service';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';

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

    constructor(private authenticationService: AuthenticationService,
        private breadcrumbService: BreadcrumbService,
        private domSanitizer: DomSanitizer,
        private router: Router,
        private changeDetectorRef: ChangeDetectorRef) {

        this.environment = window.location.host.split(/[.]/)[0].split(/[-]/)[0];
        //this.userSubscription = this.authenticationService.getUser().subscribe(data => this.user = data);

        
    }

    ngOnInit() {
        //this.authenticationService.setUser();

        this.breadcrumbService.getBreadcrumbs().subscribe(breadcrumbs => {

            this.breadcrumbs = breadcrumbs;
            this.changeDetectorRef.detectChanges();
        });
    }

    navigate(breadcrumbId){

        let breadcrumb = this.breadcrumbs[breadcrumbId];

        if (breadcrumb.selectable){
            this.router.navigate([breadcrumb.path]);
        }
    }

    logout() {
        this.authenticationService.logout();
    }
}
