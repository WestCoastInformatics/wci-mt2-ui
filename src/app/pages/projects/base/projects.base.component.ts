import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { User } from 'src/app/models/user';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { ProjectsService } from 'src/app/services/rest/projects.service';
import { Title } from '@angular/platform-browser';

@Component({
    selector: 'projects-refset',
    templateUrl: './projects.base.component.html'
})
export class ProjectsBaseComponent implements OnInit, AfterViewInit {

    menu: SidebarMenuItem[] = [];
    user: User;
    projects = [];
    selectedProject: any;
    isSelectedProject: boolean;

    organizationId: any;
    selectedOrganization: any;
    organizations: any;

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

        this.titleService.setTitle('Refset Tool - Projects');

        this.route.params.subscribe(params => {
            this.organizationId = params['organizationId'];
            if (params['id'] !== undefined && params['id'] !== 'configuration' && params['id'] !== 'people') {
                this.getProject(params['id']);
                sessionStorage.setItem('selectedProjectId', JSON.stringify(params['id']));
            }
            this.setNavigation();
        });
        this.getUser();
        this.getOrganizations();
    }
    ngAfterViewInit(){

    }
    setNavigation() {}

    selectOrganization($event): void {
        this.organizationId = $event.value.id;
        this.selectedProject = null;
        this.router.navigate(this.routeUrl);
        this.ngAfterViewInit();
    }

    selectProject(): void {
        this.router.navigate(this.routeUrl);
    }

    getUser(): void {
        this.user = this.authService.getUser();
    }

    getProject(id: string): void {
        this.projectsService.getProject(id).subscribe((result) => {
            this.isSelectedProject = result;
            this.selectedOrganization = this.selectedProject?.organization;
        });
    }


    getOrganizations(): void {
        // get list of organizations
        this.refsetService.getOrganizations().subscribe((organizationResults) => {
            this.organizations = organizationResults?.items;
        })
    }

    get routeUrl(): any[] {
        return [];
    }

}
