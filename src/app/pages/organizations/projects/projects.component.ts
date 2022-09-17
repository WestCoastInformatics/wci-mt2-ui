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
import { TeamsService } from 'src/app/services/rest/teams.service';
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';

@Component({
    selector: 'organization-projects',
    templateUrl: './projects.component.html'
})
export class OrganizationProjectsComponent implements OnInit {

    menu: SidebarMenuItem[] = [];
    data = [];
    gridOptions: any;
    @ViewChild('descriptionSection') descriptionSection: TemplateRef<any>;
    columnDefs = [];
    projectList: any[] = [];
    organizationList: any[] = [];
    selectedOrganization: any;
    organizationId: string;
    editionId: any;
    selectedEdition: any;
    editionList: any[] = [];
    api: any;
    columnApi: any;
    gridParams: any;
    showLoadingSpinner = true;

    constructor(private readonly breadcrumbService: BreadcrumbService,
        private readonly titleService: Title,
        private readonly refsetService: RefsetService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly teamService: TeamsService,
        private location: Location) {
        document.body.scrollTop = 0;
    }

    ngOnInit(): void {

        this.titleService.setTitle('Reference Set Tool - Organizations');

        this.getOrganizations();

        this.data = [];
        this.columnDefs = [
            { field: 'name', headerName: 'Project Name', minWidth: 400, cellRenderer: params => `${params.data.name}` + (params.data.locked ? '<i class="ml-3 text-muted fa fa-lock"></i>' : ''), cellClass: 'pointer', unSortIcon: true },
            { field: 'description', headerName: 'Description', flex: 1, minWidth: 550, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.descriptionSection }, unSortIcon: true },
            {
                field: 'teams', tooltipValueGetter: (params) => {
                    return JSON.parse(params.data.teams).teams.length ? JSON.parse(params.data.teams).teams.map(team => team.name).join(', ') : '';
                },
                headerName: 'Teams', filter: false, resizable: false, sortable: false, cellRenderer: params => {
                    return `<span class="text-primary font-weight-bold">${this.getTeamCount(JSON.parse(params.data.teams))} teams</span>`;
                }
            }
        ];

        this.route.params.subscribe(params => {

            this.organizationId = params['organizationId'];
            this.editionId = params['editionId'];
            this.setNavigation();
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

    setNavigation() {

        this.breadcrumbService.setBreadcrumbs([
            { path: '/dashboard', label: 'Dashboard' },
            { label: 'Organization Projects' },
        ]);

        this.menu = [
            { name: 'Projects', link: '/organizations/' + this.organizationId + '/edition/' + this.editionId + '/projects', icon: 'fa fa-folder-open', isActive: true },
            { name: 'Teams', link: '/organizations/' + this.organizationId + '/teams', icon: 'fa fa-users' },
            { name: 'People', link: '/organizations/' + this.organizationId + '/people', icon: 'fa fa-user' }
        ];

        const configShowing = this.menu[this.menu.length - 1].name == 'Configuration';

        if (!configShowing && this.selectedOrganization && this.selectedOrganization.roles.includes('ADMIN')) {
            this.menu.push({ name: 'Configuration', link: '/organizations/' + this.organizationId + '/configuration', icon: 'fa fa-cogs' });
        }

        this.location.replaceState('organizations/' + this.organizationId + '/edition/' + this.editionId + '/projects');
    }

    onGridReady = (params) => {

        this.gridParams = params;
        this.api = params.api;
        this.columnApi = params.columnApi;
        this.columnDefs[1].cellRendererParams = { template: this.descriptionSection };
        this.api.setColumnDefs(this.columnDefs);
    }

    onGridCellClick = (event) => {

        if (event.column.colId === 'name') {
            this.router.navigate(['organization', this.organizationId, 'edition', this.editionId, 'projects', event.data.id, 'refsets']);
        }
    }

    get dataCount() {
        return this.data.length;
    }

    getOrganizations(): void {

        this.refsetService.getOrganizations().subscribe({
            next: (results) => {

                this.organizationList = results?.items;

                for (const organization of this.organizationList) {

                    if (this.organizationId == organization.id) {

                        this.selectedOrganization = organization;
                        this.getEditions();
                        return;
                    }
                }

                this.getStoredOrganizationId();

                if (!this.selectedOrganization) {
                    this.showLoadingSpinner = false;
                }
            },
            error: (error) => {
                this.showLoadingSpinner = false;
            }
        });
    }

    selectOrganization(): void {

        this.showLoadingSpinner = true;
        this.organizationId = this.selectedOrganization.id;
        this.selectedEdition = null;
        this.editionList = [];
        this.projectList = [];
        this.setNavigation();
        this.getEditions();
    }

    getEditions(): void {

        this.refsetService.getEditions('&query=organizationId:' + this.selectedOrganization.id + '&limit=500&offset=0&sort=name&sortAscending=true').subscribe({
            next: (results) => {

                this.editionList = results?.items;

                for (const edition of this.editionList) {

                    if (this.editionId == edition.id) {

                        this.selectedEdition = edition;
                        this.showEditionData();
                        return;
                    }
                }

                this.getStoredEditionId();

                if (!this.selectedEdition) {
                    this.showLoadingSpinner = false;
                }
            },
            error: (error) => {
                this.showLoadingSpinner = false;
            }
        });
    }

    selectEdition(): void {

        this.showLoadingSpinner = true;
        this.editionId = this.selectedEdition.id;
        this.projectList = [];
        this.showEditionData();
    }

    showEditionData() {

        sessionStorage.setItem('selectedOrganizationId', JSON.stringify(this.selectedOrganization.id));
        sessionStorage.setItem('selectedEditionId', JSON.stringify(this.selectedEdition.id));

        this.setNavigation();
        this.onGridReady(this.gridParams);
        this.getProjects();
    }

    getProjects(): void {

        this.showLoadingSpinner = true;
        this.refsetService.getProjects('query=editionId:' + this.selectedEdition.id + '&limit=500&offset=0&sort=name&sortAscending=true').subscribe({
            next: async (results) => {

                this.data = [];
                this.projectList = results.items;

                for (const project of this.projectList) {
                    this.data.push({ name: `${project?.name}`, locked: project?.privateProject, description: `${project?.description}`, teams: `${(await this.getTeams(project?.teams))}`, id: project.id });
                }

                this.api.setRowData(this.data);
                this.api.redrawRows();
                this.showLoadingSpinner = false;
            },
            error: (error) => {
                this.showLoadingSpinner = false;
            }
        });
    }

    async getTeams(teams: any): Promise<any> {

        console.log(teams);
        const teamObject = { teams: [] };

        if (teams === 'undefined' || teams === undefined) {
            return JSON.stringify(teamObject);
        } else {

            for (const team of teams) {
                teamObject.teams.push(await lastValueFrom(this.teamService.getTeam(team)));
            }

            return JSON.stringify(teamObject);
        }
    }

    getStoredOrganizationId(): void {

        if (sessionStorage.getItem('selectedOrganizationId')) {

            const storedOrganizationId = JSON.parse(sessionStorage.getItem('selectedOrganizationId'));

            for (const organization of this.organizationList) {

                if (organization.id == storedOrganizationId) {

                    this.selectedOrganization = organization;
                    this.selectOrganization();
                    return;
                }
            }

            // if the stored organization ID doesn't match anything remove it
            sessionStorage.removeItem('selectedOrganizationId');
        }
    }

    getStoredEditionId(): void {

        if (sessionStorage.getItem('selectedEditionId')) {

            const storedEditionId = JSON.parse(sessionStorage.getItem('selectedEditionId'));

            for (const edition of this.editionList) {

                if (edition.id == storedEditionId) {

                    this.selectedEdition = edition;
                    this.selectEdition();
                    return;
                }
            }

            // if the stored edition ID doesn't match anything remove it
            sessionStorage.removeItem('selectedEditionId');

            if (this.editionList && this.editionList.length > 0) {

                this.selectedEdition = this.editionList[0];
                this.selectEdition();
            }
        } else if (this.editionList && this.editionList.length > 0) {

            this.selectedEdition = this.editionList[0];
            this.selectEdition();
        }
    }

    getTeamCount(data: any): number {
        return data.teams.length;
    }
}

