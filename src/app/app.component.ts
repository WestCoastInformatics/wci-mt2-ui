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
    styleUrls: ['app.component.scss']
})
export class AppComponent implements OnInit {
    versions: object;
    environment: string;

    constructor(
        private authoringService: AuthoringService,
        private authenticationService: AuthenticationService,
        private envService: EnvService,
        private titleService: Title,
        private router: Router
    ) {

        router.events
            .pipe(
                filter(
                    (event) => {
                        return event instanceof NavigationStart && event.navigationTrigger === 'popstate';
                    }
                )
            )
            .subscribe((event: NavigationStart) => {
                location.reload();

            });
    }

    // ***** Framework Functions *****/
    ngOnInit() {
        this.titleService.setTitle('Reference Set Tool');
        this.environment = this.envService.env;

        this.assignFavicon();

        this.authenticationService.prepareUserSession();
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
}
