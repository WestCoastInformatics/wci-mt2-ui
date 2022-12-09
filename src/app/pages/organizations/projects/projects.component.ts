import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { CustomTooltipComponent } from 'src/app/components/custom-tooltip/custom-tooltip.component';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
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
    @ViewChild('teamSection') teamSection: TemplateRef<any>;
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
        private readonly authService: AuthenticationService,
        private location: Location) {
        document.body.scrollTop = 0;
    }

    ngOnInit(): void {

        this.titleService.setTitle('Reference Set Tool - Organizations');

        this.getOrganizations();

        this.data = [];
        this.columnDefs = [
            { field: 'name', tooltipField: 'name', headerName: 'Project Name', flex: 1, minWidth: 65, cellRenderer: params => `${params.data.name}` + (params.data.locked ? '<i class="ml-3 text-muted fa fa-lock"></i>' : ''), cellClass: 'pointer', unSortIcon: true, resizable: true },
            { field: 'description', tooltipField: 'description', headerName: 'Description', flex: 2, wrapText: true, autoHeight: true, minWidth: 65, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.descriptionSection }, unSortIcon: true, resizable: true },
            { field: 'teams', headerName: 'Teams', filter: false, minWidth: 65, resizable: false, sortable: false, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.teamSection } }
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
            { label: this.selectedOrganization?.name ? this.selectedOrganization?.name + ' / Projects' : '' },
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
        // BAC: these are here because column defs are set up before view children are injected?
        this.columnDefs[1].cellRendererParams = { template: this.descriptionSection };
        this.columnDefs[2].cellRendererParams = { template: this.teamSection };
        this.api.setColumnDefs(this.columnDefs);
    }

    onGridCellClick = (event) => {

        // If clicking on teams, go to teams page
        if (event.column.colId === 'teams') {
            this.router.navigate(['organizations', this.organizationId, 'teams']);
        } else {
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

                // If no organizations, assume we are logged out
                if (!this.organizationList || this.organizationList.length == 0) {
                    this.authService.notAuthenticated();
                }

                for (const organization of this.organizationList) {

                    if (this.organizationId == organization.id) {

                        this.selectedOrganization = organization;
                        this.getEditions();
                        return;
                    }
                }

                // this calls getEditions() if it finds a selected org
                this.getStoredOrganizationId();

                if (!this.selectedOrganization) {
                    // Pick the first one if nothing is working out
                    this.selectedOrganization.id = this.organizationList[0].id;
                    this.selectedOrganization = this.organizationList[0];
                    this.selectOrganization();
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
                    // Pick the first one if nothing is working out
                    this.selectedEdition.id = this.editionList[0].id;
                    this.selectedEdition = this.editionList[0];
                    this.selectEdition();
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

        localStorage.setItem('selectedOrganizationId', JSON.stringify(this.selectedOrganization.id));
        localStorage.setItem('selectedEditionId', JSON.stringify(this.selectedEdition.id));

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

        if (localStorage.getItem('selectedOrganizationId')) {

            const storedOrganizationId = JSON.parse(localStorage.getItem('selectedOrganizationId'));

            for (const organization of this.organizationList) {

                if (organization.id == storedOrganizationId) {

                    this.selectedOrganization = organization;
                    this.selectOrganization();
                    return;
                }
            }

            // if the stored organization ID doesn't match anything remove it
            localStorage.removeItem('selectedOrganizationId');
        }
    }

    getStoredEditionId(): void {

        if (localStorage.getItem('selectedEditionId')) {

            const storedEditionId = JSON.parse(localStorage.getItem('selectedEditionId'));

            for (const edition of this.editionList) {

                if (edition.id == storedEditionId) {

                    this.selectedEdition = edition;
                    this.selectEdition();
                    return;
                }
            }

            // if the stored edition ID doesn't match anything remove it
            localStorage.removeItem('selectedEditionId');

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
        if (data && data.teams) {
            let teams = JSON.parse(data.teams).teams;
            return teams.length;
        }
        return 0;
    }

    getTeamsTitle(data: any): string{
        if (data && data.teams) {
           let teams = JSON.parse(data.teams).teams;
           return teams.map(t => t.name).join(', \n');
        }
        console.log('xxx')
        return 'No teams';
    }
    
}

