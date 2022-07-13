import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
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
    id: any;
    projectList = [];
    gridOptions: any;
    gridPaging = { pageSize: 10, pageSizeOptions: [10, 25, 50, 100], totalKnown: false, totalRows: null, manualStateRefresh: new Boolean(true) };
    gridParams: any;
    gridApi: any;
    gridColumnDefs = [];
    uiUtility = UiUtility;

    @ViewChild('peopleNameSection') peopleNameSection: TemplateRef<any>;
    organizations: any;
    organizationId: string;

    constructor(private readonly breadcrumbService: BreadcrumbService,
        private readonly titleService: Title,
        private readonly refsetService: RefsetService,
        private readonly projectsService: ProjectsService,
        private readonly route: ActivatedRoute,
        private authenticationService: AuthenticationService,
        private readonly router: Router) { }

    ngOnInit(): void {
        this.titleService.setTitle('Refset Tool - Projects');

        this.gridColumnDefs = [
            { field: 'name', headerName: 'Members', minWidth: 300, flex: 1, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.peopleNameSection } },
            { field: 'company', flex: 1, headerName: 'Company Name' },
            { field: 'email', flex: 1, headerName: 'Email' },
            { field: 'teams', tooltipComponentFramework: CustomTooltipComponent, tooltipField: 'teams', tooltipComponentParams: { color: '#ececec' }, flex: 1, headerName: 'Teams', filter: false, sortable: false, cellClass: 'text-primary font-weight-bold' }
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

                    var inactivatedRow = false;

                    if (params.data) {
                        inactivatedRow = params.data.active == false;
                    }

                    return inactivatedRow;
                },
            },
        };

        this.data = [];

        this.route.params.subscribe(params => {

            this.organizationId = params['organizationId'];
            if (!params['id']?.includes('configuration') && !params['id']?.includes('people')) {
                this.id = params['id'];
                this.getProject();
            }
            this.setNavigation();
        });
        this.getProjects();
        this.getPeople();
        this.getOrganizations();
    }

    setNavigation() {

        let breadcrumbs: any = [{ path: '/dashboard', label: 'Dashboard' }];

        if (CodeUtility.hasValue(this.organizationId), true, true) {
            breadcrumbs.push({ path: 'organizations/projects/' + this.organizationId, label: 'Organization Projects' });
        }

        breadcrumbs.push({ label: 'People' });
        this.breadcrumbService.setBreadcrumbs(breadcrumbs);

        this.menu = [
            { name: 'Reference Sets', link: '/organization/' + this.organizationId + '/projects', icon: 'fa fa-copy' },
            { name: 'People', link: '/organization/' + this.organizationId + '/projects/people', icon: 'fa fa-user', isActive: true },
        ];

        if (true) {
            this.menu.push({ name: 'Configuration', link: '/organization/' + this.organizationId + '/projects/configuration', icon: 'fa fa-cogs' });
        }
    }

    getOrganizations(): void {
        // get list of organizations
        this.refsetService.getOrganizations().subscribe((organizationResults) => {
            this.organizations = organizationResults?.items;
        })
    }

    selectOrganization($event): void {
        this.organizationId = $event.value.id;
        this.selectedProject = null;
        this.getProjects();
    }

    onGridReady = (params) => {
        this.gridParams = params;
        this.gridApi = params.api;
    }

    onGridCellClick = (event) => {

        let selectedRows = this.gridApi.getSelectedRows();
        let selectedId: string;

        selectedRows.forEach(function (selectedRow, index) {

            selectedId = selectedRow.id;
        });

        this.router.navigate(['/personal/landing', selectedId]);
    };

    getPeople(): void {
        // this.projectsService.getProjectUsers(this.id).subscribe((results) => {
        //   this.peopleList = results.items;
        //   console.log(this.peopleList);
        // });
    }

    get dataCount() {
        return this.data.length;
    }

    getProjects(): void {
        this.refsetService.getProjects('limit=500&offset=0&sort=name&sortAscending=true').subscribe((results) => {
            this.projectList = results.items.filter((items) => {
                return this.organizationId === items.organizationId;
            });
        });
    }

    getProject(): void {
        this.projectsService.getProject(this.id).subscribe((result) => {
            this.selectedProject = result;
            this.selectedOrganization = this.selectedProject?.organization;
        });
    }

    selectProject($event): void {
        this.router.navigate(['organization/' + this.organizationId + '/projects/people', $event['value'].id]);
        this.route.params.subscribe(params => {
            this.id = params['id'];
            this.getProject();
        });
    }
}
