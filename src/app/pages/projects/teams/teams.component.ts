import { AfterViewInit, ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Context } from 'ag-grid-community';
import { CategoryFilterComponent } from 'src/app/components/categoryFilter/category-filter.component';
import { DateTextFilterComponent } from 'src/app/components/dateTextFilter/date-text-filter.component';
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';
import { PaginationComponent } from 'src/app/components/pagination/pagination.component';
import { Debounce } from 'src/app/decorators/debounce.decorator';
import { DialogService } from 'src/app/dialog/services/dialog.service';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { ToggleService } from 'src/app/services/toggle-service/toggle.service';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { RefsetUtility } from 'src/app/utilities/refset.utility';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { NotificationService } from 'src/app/services/notification.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProjectsService } from 'src/app/services/rest/projects.service';
import { User } from 'src/app/models/user';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { P } from '@angular/cdk/keycodes';

@Component({
    selector: 'projects-teams',
    templateUrl: './teams.component.html'
})
export class ProjectsTeamsComponent implements OnInit, AfterViewInit {

    menu: SidebarMenuItem[] = [];
    user: User;
    projectList: any[] = [];
    selectedProject: any;
    projectId: any;
    organizationId: any;
    selectedOrganization: any;
    organizationList: any[] = [];
    editionId: any;
    selectedEdition: any;
    editionList: any[] = [];
    gridApi: any;
    gridColumnApi: any;
    gridColumnDefs = [];
    gridOptions: any;
    gridPaging = {
        pageSize: 10,
        pageSizeOptions: [10, 25, 50, 100],
        totalKnown: false,
        totalRows: null,
        manualStateRefresh: new Boolean(true)
    };
    showTable = false;
    teamData: any;
    showLoadingSpinner = false;
    originalGridParams: any;
    numberOfTeams = 0;
    uiUtility = UiUtility;

    @ViewChild('descriptionSection') descriptionSection: TemplateRef<any>;
    @ViewChild('peopleSection') peopleSection: TemplateRef<any>;

    constructor(
        protected router: Router,
        protected titleService: Title,
        protected refsetService: RefsetService,
        private breadcrumbService: BreadcrumbService,
        protected authService: AuthenticationService,
        protected route: ActivatedRoute,
        protected readonly projectsService: ProjectsService,
        private notificationService: NotificationService,
        private location: Location
    ) {
        document.body.scrollTop = 0;
        refsetService.getTaxonomyRoot();
    }

    // ***** Framework Functions *****/
    ngOnInit() {

        this.titleService.setTitle('Reference Set Tool - Projects - Teams');

        this.route.params.subscribe(params => {

            this.organizationId = params['organizationId'];
            this.editionId = params['editionId'];
            this.projectId = params['projectId'];
            this.setNavigation();
        });

        this.showLoadingSpinner = true;

        this.getUser();
        this.getOrganizations();
    }

    setNavigation() {

        const breadcrumbs: any = [{ path: '/dashboard', label: 'Dashboard' }];

        if (CodeUtility.hasValue(this.organizationId, true, true)) {
            breadcrumbs.push({ path: 'organizations/' + this.organizationId + '/edition/' + this.editionId + '/projects', label: this.selectedOrganization?.name ? this.selectedOrganization?.name + ' / Projects' : '' });
        }

        breadcrumbs.push({ label: 'Teams' });
        this.breadcrumbService.setBreadcrumbs(breadcrumbs);

        this.menu = [
            { name: 'Reference Sets', link: '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/refsets', icon: 'fa fa-copy'},
            { name: 'Teams', link: '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/teams/', icon: 'fa fa-users', isActive: true },
            { name: 'People', link: '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/people/', icon: 'fa fa-user' },
        ];

        const configShowing = this.menu[this.menu.length - 1].name == 'Configuration';

        if (!configShowing && this.selectedProject && this.selectedProject.roles.includes('ADMIN')) {
            this.menu.push({ name: 'Configuration', link: '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/configuration', icon: 'fa fa-cogs' });
        }

        this.location.replaceState('organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/teams');
    }

    getUser(): void {
        this.user = this.authService.getUser();
    }

    ngAfterViewInit() {

        this.gridColumnDefs = [
            { field: 'id', hide: true },
            { field: 'name', tooltipField: 'name', headerName: 'Team Name', flex: 2, minWidth: 65, maxWidth: 500, unSortIcon: true, resizable: true },
            { field: 'description', tooltipField: 'description', headerName: 'Description', flex: 2, minWidth: 65, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.descriptionSection }, unSortIcon: true, resizable: true },
            {
                field: 'role', tooltipField: 'role', headerName: 'Role', flex: 1, minWidth: 65, resizable: true, cellClass: 'text-camel', unSortIcon: true,
                filter: 'agTextColumnFilter',
                filterParams: {
                    textCustomComparator: (filter, value, filterText) => {
                        if (!value && filterText) { return false; }
                        if (!filterText) { return true; }
                        const filterTextLowerCase = filterText.toLowerCase();
                        return value.split(',').map((role) => role.trim().toLowerCase()).filter((role) => role === filterTextLowerCase).length > 0;
                    }
                },
                floatingFilterComponent: 'categoryFilterComponent', floatingFilterComponentParams: {
                    suppressMenu: true, suppressFilterButton: true, names: [
                        {
                            'type': 'role',
                            'name': 'Admin',
                            'value': 'Admin'
                        },
                        {
                            'type': 'role',
                            'name': 'Author',
                            'value': 'Author'
                        },
                        {
                            'type': 'role',
                            'name': 'Reviewer',
                            'value': 'Reviewer'
                        },
                        {
                            'type': 'role',
                            'name': 'Viewer',
                            'value': 'Viewer'
                        }
                    ],
                }
            },
            { field: 'email', tooltipField: 'email', headerName: 'Contact Email', flex: 2, minWidth: 65, resizable: true, unSortIcon: true},
            {
                field: 'members', headerName: 'People', minWidth: 65, filter: false, resizable: false, sortable: false, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.peopleSection },
                tooltipValueGetter: (params) => {
                    return params?.data?.memberList ?
                        ('Team Users:\n' + params.data.memberList.map(member => member.name).join(', \n')) :
                        'No Team Users';
                }
            }
        ];

        this.gridOptions = {
            context: { componentParent: this },
            pagination: false,
            suppressColumnVirtualisation: false, // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
            suppressPaginationPanel: true,
            paginationPageSize: this.gridPaging.pageSize,
            rowSelection: 'single',
            enableCellTextSelection: true,
            onGridReady: this.onGridReady,
            onCellClicked: this.onGridCellClick,
            frameworkComponents: {
                'templateRenderer': TemplateRenderer,
                'categoryFilterComponent': CategoryFilterComponent,
            },
            defaultColDef: {
                sortable: true,
                resizable: true,
                suppressMenu: true,
                filter: true,
                floatingFilter: true,
                floatingFilterComponentParams: { placeholder: '', suppressFilterButton: false, suppressAndOrCondition: true },
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

        this.teamData = [];
    }

    onGridCellClick = (event) => {

        const selectedRows = this.gridApi.getSelectedRows();
        let selectedId: string;

        selectedRows.forEach(function (selectedRow, index) {
            selectedId = selectedRow.id;
        });

        this.router.navigate(['/organization/' + this.organizationId + '/teams/' + selectedId + '/people']);
    }

    getOrganizations(): void {

        this.refsetService.getOrganizations().subscribe({
            next: (results) => {
                this.organizationList = results?.items;

                // If no organizations, back to landing page
                if (!this.organizationList || this.organizationList.length == 0) {
                    this.notificationService.show('No organizations, you are likely logged out', null, 'error', {
                        timeOut: 500,
                        extendedTimeOut: 0
                    });
                    this.authService.notAuthenticated();
                    //this.router.navigate(['/']);
                    return;
                }

                for (const organization of this.organizationList) {

                    if (this.organizationId == organization.id) {

                        this.selectedOrganization = organization;
                        this.getEditions();
                        return;
                    }
                }

                this.getStoredOrganizationId();

                if (!this.selectedOrganization) {
                    this.selectedOrganization = this.organizationList[0];
                }

                this.getEditions();
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
        this.setNavigation();
        this.getEditions();
    }

    getEditions(): void {

        this.refsetService.getEditions('&query=organizationId:' + this.selectedOrganization.id + '&sort=name&sortAscending=true').subscribe({
            next: (results) => {

                this.editionList = results?.items;

                if (!this.editionList || this.editionList.length == 0) {
                    this.notificationService.show('No editions', null, 'error', {
                        timeOut: 500,
                        extendedTimeOut: 0
                    });
                    this.showLoadingSpinner = false;
                    return;
                }

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

    getProjects(): void {

        this.refsetService.getProjects('includeMembers=true&query=editionId:' + this.selectedEdition.id + '&sort=name&sortAscending=true').subscribe({
            next: (results) => {

                this.projectList = results.items;

                for (const project of this.projectList) {

                    if (this.projectId == project.id) {

                        this.selectedProject = project;
                        this.showTeamData();
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

    selectProject(): void {

        this.showLoadingSpinner = true;
        this.projectId = this.selectedProject.id;
        this.showTeamData();
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

    showTeamData() {

        if (this.originalGridParams) {
            this.onGridReady(this.originalGridParams);
        } else {
            this.showTable = true;
        }

        localStorage.setItem('selectedOrganizationId', JSON.stringify(this.selectedOrganization.id));
        localStorage.setItem('selectedEditionId', JSON.stringify(this.selectedEdition.id));
        localStorage.setItem('selectedProjectId', JSON.stringify(this.selectedProject.id));

        this.setNavigation();
    }

    onGridReady = (gridReadyParams) => {

        if (!this.selectedProject) {
            return;
        }

        this.originalGridParams = gridReadyParams;
        this.gridApi = gridReadyParams.api;
        this.gridColumnApi = gridReadyParams.columnApi;

        this.projectsService.getProjectTeams(this.selectedProject.id).subscribe((results) => {

            this.teamData = [];
            this.numberOfTeams = 0;

            for (const team of results.items) {
                this.teamData.push({ id: team.id, name: team.name, description: team.description, role: team.roles.sort().join(', ').toLowerCase(), email: team.primaryContactEmail, members: team.members ? team.members.length : '0', memberList: team.memberList });
            }

            this.numberOfTeams = this.teamData.length;
            this.gridApi.setRowData(this.teamData);
            this.showLoadingSpinner = false;
        });

    }
}
