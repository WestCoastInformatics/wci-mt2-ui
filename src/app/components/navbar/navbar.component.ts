import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { User } from '../../models/user';
import { AuthenticationService } from '../../services/authentication/authentication.service';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

    environment: string;
    user: User;
    userSubscription: Subscription;

    constructor(private authenticationService: AuthenticationService) {
        this.environment = window.location.host.split(/[.]/)[0].split(/[-]/)[0];
        //this.userSubscription = this.authenticationService.getUser().subscribe(data => this.user = data);
    }

    ngOnInit() {
        //this.authenticationService.setUser();
    }

    logout() {
        this.authenticationService.logout();
    }
}
