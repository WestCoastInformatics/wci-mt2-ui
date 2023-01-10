import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryFilterComponent } from 'src/app/components/categoryFilter/category-filter.component';
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { UiUtility } from 'src/app/utilities/ui.utility';

@Component({
    selector: 'projects-people',
    templateUrl: './people.component.html'
})
export class ProjectsPeopleComponent implements OnInit {

    menu: SidebarMenuItem[] = [];
    data = [];
    peopleList: any[] = [];
    selectedProject: any;
    selectedOrganization: any;
    editionId: any;
    selectedEdition: any;
    editionList: any[] = [];
    projectId: any;
    projectList = [];
    gridOptions: any;
    gridPaging = { pageSize: 10, pageSizeOptions: [10, 25, 50, 100], totalKnown: false, totalRows: null, manualStateRefresh: true };
    gridParams: any;
    gridApi: any;
    gridColumnDefs = [];
    uiUtility = UiUtility;
    organizationList: any[] = [];
    organizationId: string;
    showLoadingSpinner = false;
    showTable = false;

    @ViewChild('peopleNameSection') peopleNameSection: TemplateRef<any>;
    @ViewChild('peopleTeamsSection') peopleTeamsSection: TemplateRef<any>;

    constructor(private readonly breadcrumbService: BreadcrumbService,
        private readonly titleService: Title,
        private readonly refsetService: RefsetService,
        private readonly route: ActivatedRoute,
        private changeDetectorRef: ChangeDetectorRef,
        private readonly router: Router,
        private location: Location) {
        document.body.scrollTop = 0;
    }

    get dataCount() {
        return this.data.length;
    }

    ngOnInit(): void {

        this.titleService.setTitle('Reference Set Tool - Projects - People');

        this.route.params.subscribe(params => {

            this.organizationId = params['organizationId'];
            this.editionId = params['editionId'];
            this.projectId = params['projectId'];
            this.setNavigation();
        });

        this.showLoadingSpinner = true;
        this.data = [];
        this.getOrganizations();
    }

    ngAfterViewInit() {

        this.gridColumnDefs = [
            { field: 'name', tooltipField: 'name', headerName: 'User', minWidth: 65, flex: 2, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.peopleNameSection }, unSortIcon: true, resizable: true },
            { field: 'company', tooltipField: 'company', minWidth: 65, flex: 2, headerName: 'Company Name', unSortIcon: true, resizable: true },
            { field: 'email', tooltipField: 'email', minWidth: 65, flex: 2, headerName: 'Email', unSortIcon: true, resizable: true },
            { field: 'teams', flex: 1, headerName: 'Teams', filter: false, sortable: false, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.peopleTeamsSection }, minWidth: 65, resizable: false }
            //       {
            //     field: 'name',
            //     tooltipField: 'name',
            //     headerName: 'Users',
            //     minWidth: 65,
            //     flex: 1,
            //     cellRenderer: 'templateRenderer',
            //     cellRendererParams: { template: this.peopleNameSection }, unSortIcon: true, resizable: true
            // },
            // { field: 'company', tooltipField: 'company', flex: 1, headerName: 'Company Name', unSortIcon: true },
            // { field: 'email', tooltipField: 'email', flex: 1, headerName: 'Email', unSortIcon: true },
            // {
            //     field: 'teams',
            //     tooltipComponentFramework: CustomTooltipComponent,
            //     tooltipField: 'teams',
            //     tooltipComponentParams: { color: '#ececec' },
            //     flex: 1,
            //     headerName: 'Teams',
            //     filter: false,
            //     sortable: false,
            //     cellRenderer: 'templateRenderer',
            //     cellRendererParams: { template: this.peopleTeamsSection }
            // }
        ];

        this.gridOptions = {
            context: { componentParent: this },
            pagination: false,
            suppressColumnVirtualisation: false, // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
            suppressPaginationPanel: true,
            paginationPageSize: this.gridPaging.pageSize,
            rowSelection: 'single',
            enableCellTextSelection: true,
            onCellClicked: this.onGridCellClick,
            onGridReady: this.onGridReady,
            frameworkComponents: {
                'templateRenderer': TemplateRenderer,
                'categoryFilterComponent': CategoryFilterComponent
            },
            defaultColDef: {
                sortable: true,
                resizable: true,
                suppressMenu: true,
                filter: true,
                floatingFilter: true,
                floatingFilterComponentParams: { placeholder: '', suppressFilterButton: true },
                unSortIcon: true
            },
            enableBrowserTooltips: true,
            rowClassRules: {
                refset_tool_grid_inactive_row: function (params) {

                    let inactivatedRow = false;

                    if (params.data) {
                        inactivatedRow = params.data.active == false;
                    }

                    return inactivatedRow;
                },
            },
        };

        this.changeDetectorRef.detectChanges();
    }

    setNavigation() {

        const breadcrumbs: any = [{ path: '/dashboard', label: 'Dashboard' }];

        if (CodeUtility.hasValue(this.organizationId, true, true)) {
            breadcrumbs.push({ path: 'organizations/' + this.organizationId + '/edition/' + this.editionId + '/projects', label: this.selectedOrganization?.name ? this.selectedOrganization?.name + ' / Projects' : '' });
        }

        breadcrumbs.push({ label: 'People' });
        this.breadcrumbService.setBreadcrumbs(breadcrumbs);

        this.menu = [
            { name: 'Reference Sets', link: '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/refsets', icon: 'fa fa-copy' },
            { name: 'Teams', link: '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/teams/', icon: 'fa fa-users' },
            { name: 'People', link: '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/people/', icon: 'fa fa-user', isActive: true },
        ];

        const configShowing = this.menu[this.menu.length - 1].name == 'Configuration';

        if (!configShowing && this.selectedOrganization && this.selectedOrganization.roles.includes('ADMIN')) {
            this.menu.push({ name: 'Configuration', link: '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/configuration', icon: 'fa fa-cogs' });
        }

        this.location.replaceState('organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/people');
    }

    getOrganizations(): void {

        this.refsetService.getOrganizations().subscribe({
            next: (results) => {

                this.showTable = true;
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
        this.selectedProject = null;
        this.projectList = [];
        this.data = [];
        this.getEditions();
    }

    getEditions(): void {

        this.refsetService.getEditions('&query=organizationId:' + this.selectedOrganization.id + '&sort=name&sortAscending=true').subscribe({
            next: (results) => {

                this.editionList = results?.items;

                for (const edition of this.editionList) {

                    if (this.editionId == edition.id) {

                        this.selectedEdition = edition;
                        this.getProjects();
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
        this.selectedProject = null;
        this.projectList = [];
        this.setNavigation();
        this.getProjects();
    }

    onGridReady = (params) => {
        this.gridParams = params;
        this.gridApi = params.api;
    }

    onGridCellClick = (event) => {
        const selectedRows = this.gridApi.getSelectedRows();
        const router = this.router;
        selectedRows.forEach(function (selectedRow, index) {
            router.navigate(['/personal/' + selectedRow.id + '/landing']);
            return;
        });
    }

    clickTeams = (event) => {
        //if (event.column.colId === 'name') {
        this.router.navigate(['organizations', this.organizationId, 'teams']);
        event.stopPropagation();
        //}
    }


    getProjects(): void {

        this.showTable = false;

        this.refsetService.getProjects('includeMembers=true&query=editionId:' + this.selectedEdition.id + '&sort=name&sortAscending=true').subscribe({
            next: (results) => {

                this.showTable = true;
                this.projectList = results.items;

                for (const project of this.projectList) {

                    if (this.projectId == project.id) {

                        this.selectedProject = project;
                        this.showProjectData();
                        return;
                    }
                }

                this.getStoredProjectId();

                if (!this.selectedProject) {
                    this.showLoadingSpinner = false;
                }
            },
            error: (error) => {
                this.showLoadingSpinner = false;
            }
        });
    }

    showProjectData(): void {

        this.setNavigation();
        this.data = this.selectedProject.memberList;

        const configShowing = this.menu[this.menu.length - 1].name == 'Configuration';

        if (!configShowing && this.selectedOrganization.roles.includes('ADMIN')) {
            this.menu.push({ name: 'Configuration', link: '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/configuration', icon: 'fa fa-cogs' });
        }

        this.showLoadingSpinner = false;

        localStorage.setItem('selectedOrganizationId', JSON.stringify(this.selectedOrganization.id));
        localStorage.setItem('selectedEditionId', JSON.stringify(this.selectedEdition.id));
        localStorage.setItem('selectedProjectId', JSON.stringify(this.selectedProject.id));

        this.setNavigation();
    }

    selectProject(): void {

        this.showLoadingSpinner = true;
        this.projectId = this.selectedProject.id;
        this.showProjectData();
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

    getStoredProjectId(): void {

        if (localStorage.getItem('selectedProjectId')) {

            const storedProjectId = JSON.parse(localStorage.getItem('selectedProjectId'));

            for (const project of this.projectList) {

                if (project.id == storedProjectId) {

                    this.selectedProject = project;
                    this.selectProject();
                    return;
                }
            }

            // if the stored project ID doesn't match anything remove it
            localStorage.removeItem('selectedProjectId');

            if (this.projectList && this.projectList.length > 0) {

                this.selectedProject = this.projectList[0];
                this.selectProject();
            }
        } else if (this.projectList && this.projectList.length > 0) {

            this.selectedProject = this.projectList[0];
            this.selectProject();
        }
    }

    getTeamCount(teams: any): number {
        return teams.length;
    }


    getTeamsTitle(data: any): string {
        if (data) {
          if (data.teams) {
            return 'User Teams:\n' + (data?.teams.map(t => t.name).join(', \n'));
          } else {
            return 'No User Teams'
          }
        }
      }

}
