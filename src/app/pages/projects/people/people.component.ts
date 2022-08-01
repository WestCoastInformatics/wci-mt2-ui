import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryFilterComponent } from 'src/app/components/categoryFilter/category-filter.component';
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';
import { CustomTooltipComponent } from 'src/app/components/custom-tooltip/custom-tooltip.component';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { ProjectsService } from 'src/app/services/rest/projects.service';
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
    peopleList = [];
    selectedProject: any;
    selectedOrganization: any;
    projectId: any;
    projectList = [];
    gridOptions: any;
    gridPaging = { pageSize: 10, pageSizeOptions: [10, 25, 50, 100], totalKnown: false, totalRows: null, manualStateRefresh: new Boolean(true) };
    gridParams: any;
    gridApi: any;
    gridColumnDefs = [];
    uiUtility = UiUtility;
    organizations: any;
    organizationId: string;
    showLoadingSpinner = false;

    @ViewChild('peopleNameSection') peopleNameSection: TemplateRef<any>;
    @ViewChild('peopleTeamsSection') peopleTeamsSection: TemplateRef<any>;

    constructor(private readonly breadcrumbService: BreadcrumbService,
        private readonly titleService: Title,
        private readonly refsetService: RefsetService,
        private readonly projectsService: ProjectsService,
        private readonly route: ActivatedRoute,
        private changeDetectorRef: ChangeDetectorRef,
        private readonly router: Router,
        private location: Location) {
        document.body.scrollTop = 0;
    }

    ngOnInit(): void {

        this.titleService.setTitle('Refset Tool - Projects');

        this.route.params.subscribe(params => {

            this.organizationId = params['organizationId'];
            this.projectId = params['id'];
            this.setNavigation();
        });

        this.showLoadingSpinner = true;
        this.data = [];
        this.getOrganizations();
    }

    ngAfterViewInit() {

        this.gridColumnDefs = [
            { field: 'name', headerName: 'Members', minWidth: 300, flex: 1, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.peopleNameSection } },
            { field: 'company', flex: 1, headerName: 'Company Name' },
            { field: 'email', flex: 1, headerName: 'Email' },
            { field: 'teams', tooltipComponentFramework: CustomTooltipComponent, tooltipField: 'teams', tooltipComponentParams: { color: '#ececec' }, flex: 1, headerName: 'Teams', filter: false, sortable: false, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.peopleTeamsSection } }
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
                templateRenderer: TemplateRenderer,
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

        if (CodeUtility.hasValue(this.organizationId), true, true) {
            breadcrumbs.push({ path: 'organizations/projects/' + this.organizationId, label: 'Organization Projects' });
        }

        breadcrumbs.push({ label: 'People' });
        this.breadcrumbService.setBreadcrumbs(breadcrumbs);

        this.menu = [
            { name: 'Reference Sets', link: '/organization/' + this.organizationId + '/projects', icon: 'fa fa-copy' },
            { name: 'People', link: '/organization/' + this.organizationId + '/projects/people', icon: 'fa fa-user', isActive: true },
        ];
    }

    getOrganizations(): void {

        this.refsetService.getOrganizations().subscribe((organizationResults) => {

            this.showLoadingSpinner = false;
            this.organizations = organizationResults?.items;

            for (const organization of this.organizations) {

                if (this.organizationId == organization.id) {

                    this.selectedOrganization = organization;
                    this.getProjects();
                    break;
                }
            }
        });
    }

    selectOrganization($event): void {

        this.organizationId = $event.value.id;
        this.selectedProject = null;
        this.projectList = [];
        this.data = [];
        this.getProjects();
    }

    onGridReady = (params) => {
        this.gridParams = params;
        this.gridApi = params.api;
    }

    onGridCellClick = (event) => {

        const selectedRows = this.gridApi.getSelectedRows();
        let selectedId: string;

        selectedRows.forEach(function (selectedRow, index) {

            selectedId = selectedRow.id;
        });

        this.router.navigate(['/personal/landing', selectedId]);
    }

    onMemberCellClick = (event) => {
        if (event.data.id) {
            this.router.navigate(['/personal/landing', event.data.id]);
        }
    }

    get dataCount() {
        return this.data.length;
    }

    getProjects(): void {

        this.showLoadingSpinner = true;

        this.refsetService.getProjects('includeMembers=true&query=organizationId:' + this.selectedOrganization.id + '&limit=500&offset=0&sort=name&sortAscending=true').subscribe((results) => {

            this.showLoadingSpinner = false;
            this.projectList = results.items;

            for (const project of this.projectList) {

                if (this.projectId == project.id) {

                    this.selectedProject = project;
                    this.showProjectData();
                }
            }

            if (this.projectList && this.projectList.length > 0) {

                this.selectedProject = this.projectList[0];
                this.selectProject(null);
            }
        });
    }

    showProjectData(): void {

        this.data = this.selectedProject.memberList;

        const configShowing = this.menu[this.menu.length - 1].name == 'Configuration';

        if (!configShowing && this.selectedOrganization.roles.includes('ADMIN')) {
            this.menu.push({ name: 'Configuration', link: '/organization/' + this.organizationId + '/projects/configuration', icon: 'fa fa-cogs' });
        }
    }

    selectProject($event): void {

        this.projectId = this.selectedProject.id;
        this.location.replaceState('organization/' + this.organizationId + '/projects/people/' + this.projectId);
        this.showProjectData();
    }

    getTeamCount(teams: any): number {
        return teams.length;
    }
}
