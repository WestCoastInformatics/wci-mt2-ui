import {
    Component,
    OnInit
} from '@angular/core';
import 'jquery';
import { Title } from '@angular/platform-browser';
import { AuthoringService } from './services/authoring/authoring.service';
import { EnvService } from './services/environment/env.service';
import { NavigationStart, Router, RoutesRecognized } from '@angular/router';
import { Subject } from 'rxjs';
import { AuthenticationService } from './services/authentication/authentication.service';
import { BackendInterceptor } from './interceptors/backend.interceptor';
import { filter } from 'rxjs/operators';
@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
    versions: object;
    environment: string;
    isLanding = false;
    userActivity;
    userInactive: Subject<any> = new Subject();

    constructor(
        private authoringService: AuthoringService,
        private authenticationService: AuthenticationService,
        private envService: EnvService,
        private titleService: Title,
        private router: Router
    ) {
        authenticationService.apiCalled.subscribe(() => this.refreshUserState());

        router.events
            .pipe(
                filter(
                    (event) => {
                        return event instanceof NavigationStart && event.navigationTrigger === 'popstate' && event.restoredState != null;
                    }
                )
            )
            .subscribe((event: NavigationStart) => {
                location.reload();

            });
    }

    //***** Framework Functions *****/
    ngOnInit() {
        this.titleService.setTitle('Refset Tool');
        this.environment = this.envService.env;

        this.assignFavicon();
        this.router.events.subscribe((event: any) => {
            if (event instanceof RoutesRecognized) {
                this.isLanding = event.url.split('/')[1] === '';
            }
        });

        this.setTimeout();
        this.userInactive.subscribe(() => {
            this.authenticationService.logoutUser();
        });
    }

    assignFavicon() {
        const favicon = $('#favicon');

        switch (this.environment) {
            case 'local':
                favicon.attr('href', 'favicon_purple.ico');
                break;
            case 'dev':
                favicon.attr('href', 'favicon_green.ico');
                break;
            case 'uat':
                favicon.attr('href', 'favicon_blue.ico');
                break;
            case 'training':
                favicon.attr('href', 'favicon_yellow.ico');
                break;
            default:
                favicon.attr('href', 'favicon_red.ico');
                break;
        }
    }

    setTimeout() {
        let date = new Date();
        // console.log(`Last Activity:${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`)
        this.userActivity = setTimeout(() => {

            if (this.authenticationService.isUserLoggedIn) {
                this.userInactive.next(undefined);
                console.log('logged out');
            } else {
                console.log('not logged in');
                this.authenticationService.notAuthenticated();
            }
        }, 900000);
    }

    refreshUserState() {
        clearTimeout(this.userActivity);
        this.setTimeout();
    }
}
