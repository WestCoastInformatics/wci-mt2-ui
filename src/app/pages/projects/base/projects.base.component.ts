import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { User } from 'src/app/models/user';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { ProjectsService } from 'src/app/services/rest/projects.service';
import { Title } from '@angular/platform-browser';

@Component({
    selector: 'app-projects',
    template: ''
})
export class ProjectsBaseComponent implements OnInit, AfterViewInit {


    constructor(
        protected router: Router,
        protected route: ActivatedRoute,
        protected authService: AuthenticationService,
        protected projectsService: ProjectsService,
        protected refsetService: RefsetService,
        protected titleService: Title
    ) {
    }

    //***** Framework Functions *****/
    ngOnInit() {
    }
    ngAfterViewInit(){
    }

}
