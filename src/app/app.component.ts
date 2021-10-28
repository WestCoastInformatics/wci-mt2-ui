import {
    Component,
    OnInit,
    ViewChild,
    AfterViewInit,
    TemplateRef,
} from '@angular/core';
import 'jquery';
import { Title } from '@angular/platform-browser';
import { AuthoringService } from './services/authoring/authoring.service';
import { EnvService } from './services/environment/env.service';
import { RouterOutlet } from '@angular/router';
import { Observable } from 'rxjs';

import { TemplateRenderer } from './components/cellRenderers/template.renderer';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
    versions: object;
    environment: string;

    constructor(
        private authoringService: AuthoringService,
        private envService: EnvService,
        private titleService: Title
    ) {}

    //***** Framework Functions *****/
    ngOnInit() {
        this.titleService.setTitle('Refset Tool');
        this.environment = this.envService.env;

        // this.authoringService.getVersions().subscribe(versions => {
        //     this.versions = versions;
        // });

        // this.authoringService.getUIConfiguration().subscribe(config => {
        //     this.authoringService.uiConfiguration = config;
        // });

        this.assignFavicon();
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
