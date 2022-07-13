import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { CustomTooltipComponent } from 'src/app/components/custom-tooltip/custom-tooltip.component';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { OrganizationsService } from 'src/app/services/rest/organizations.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { RefsetUtility } from 'src/app/utilities/refset.utility';
import { TeamsService } from 'src/app/services/rest/teams.service';
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';

@Component({
    selector: 'organization-projects',
    templateUrl: './projects.component.html'
})
export class OrganizationProjectsComponent implements OnInit {
    menu: SidebarMenuItem[] = [
        { name: 'Projects', link: '/organizations/projects', icon: 'fa fa-folder-open', isActive: true },
        { name: 'Teams', link: '/organizations/teams', icon: 'fa fa-users' },
        { name: 'People', link: '/organizations/people', icon: 'fa fa-user' }
    ];

    data = [];
    gridOptions: any;
    @ViewChild('descriptionSection') descriptionSection: TemplateRef<any>;
    columnDefs = [];
    projectList = []
    organizationList = [];
    selectedOrganization: any;
    organizationId: string;
    api: any;
    columnApi: any;
    gridParams: any;
    showLoadingSpinner = true;

    constructor(private readonly breadcrumbService: BreadcrumbService,
        private readonly titleService: Title,
        private readonly refsetService: RefsetService,
        private readonly organizationsService: OrganizationsService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly teamService: TeamsService,
        private authenticationService: AuthenticationService,
        private location: Location) {
        if (authenticationService.isAdmin()) {
            this.menu.push({ name: 'Configuration', link: '/organizations/configuration', icon: 'fa fa-cogs' });
        }
    }

    ngOnInit(): void {

        this.titleService.setTitle('Refset Tool - Organizations');
        this.breadcrumbService.setBreadcrumbs([
            { path: '/organizations/projects', label: 'Organizations' },
            { label: 'Projects' },
        ]);

        this.getOrganizations();

        this.data = [];
        this.columnDefs = [
            { field: 'name', headerName: 'Project Name', flex: 1, minWidth: 450, cellRenderer: params => { return `${params.data.name}` + (params.data.locked ? '<i class="ml-3 text-muted fa fa-lock"></i>' : ''); }, cellClass: 'pointer' },
            { field: 'description', headerName: 'Description', minWidth: 550, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.descriptionSection } },
            {
                field: 'teams', tooltipComponentFramework: CustomTooltipComponent, tooltipField: 'teams', headerName: 'Teams', filter: false, sortable: false, cellRenderer: params => {
                    return `<span class="text-primary font-weight-bold">${this.getTeamCount(JSON.parse(params.data.teams))} teams</span>`;
                }
            }
        ];

        this.route.params.subscribe(params => {
            this.organizationId = params['id'];
        });

        this.gridOptions = {
            onCellClicked: this.onGridCellClick,
            onGridReady: this.onGridReady,
            frameworkComponents: {
                'templateRenderer': TemplateRenderer,
            },
            defaultColDef: {
                filter: true, suppressMenu: true, floatingFilter: true, unSortIcon: true, sortable: true, resizable: true
            }
        };
    }

    onGridReady = (params) => {

        this.gridParams = params;
        this.api = params.api;
        this.columnApi = params.columnApi;
        this.columnDefs[1].cellRendererParams = { template: this.descriptionSection };
        this.api.setColumnDefs(this.columnDefs);
        this.getProjects();
    }

    onGridCellClick = (event) => {

        if (event.column.colId === 'name') {
            this.router.navigate(['organization', this.organizationId, 'projects', event.data.id]);
        }
    }

    get dataCount() {
        return this.data.length;
    }

    getProjects(): void {

        this.showLoadingSpinner = true;
        this.refsetService.getProjects('limit=500&offset=0&sort=name&sortAscending=true').subscribe(async (results) => {

            this.data = [];
            this.projectList = results.items;

            for (let project of this.projectList) {

                if (project?.organization?.id === this.selectedOrganization?.id) {
                    this.data.push({ name: `${project?.name}`, locked: project?.privateProject, description: `${project?.description}`, teams: `${(await this.getTeams(project?.teams))}`, id: project.id })
                }
            }

            this.api.setRowData(this.data.slice(0, 10));
            this.api.redrawRows();
            this.showLoadingSpinner = false;
        });
    }

    async getTeams(teams: any): Promise<any> {

        console.log(teams)
        const teamObject = { teams: [] };

        if (teams === 'undefined' || teams === undefined) {
            return JSON.stringify(teamObject);
        } else {

            for (let team of teams) {
                teamObject.teams.push(await lastValueFrom(this.teamService.getTeam(team)));
            }

            return JSON.stringify(teamObject);
        }
    }

    getOrganizations(): void {

        this.refsetService.getOrganizations().subscribe((results) => {

            this.organizationList = results.items;

            for (let organization of this.organizationList) {

                if (this.organizationId == organization.id) {
                    this.setOrganizationData(organization);
                }
            }
        });
    }

    selectOrg($event): void {
        this.setOrganizationData(this.selectedOrganization);
        this.location.replaceState("/organizations/projects/" + this.selectedOrganization.id);
    }

    setOrganizationData(organization: any) {

        this.organizationId = organization.id;
        this.selectedOrganization = organization;

        this.onGridReady(this.gridParams);
    }

    getTeamCount(data: any): number {
        return data.teams.length;
    }
}

