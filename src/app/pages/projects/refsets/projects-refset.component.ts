import { AfterViewInit, ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Context, Logger } from 'ag-grid-community';
import { forkJoin } from 'rxjs';
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
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProjectsService } from 'src/app/services/rest/projects.service';
import { User } from 'src/app/models/user';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { ProjectsBaseComponent } from '../base/projects.base.component';

@Component({
    selector: 'projects-refset',
    templateUrl: './projects-refset.component.html'
})
export class ProjectsRefsetComponent implements OnInit, AfterViewInit {

    menu: SidebarMenuItem[] = [];
    user: User;
    projectList = [];
    selectedProject: any;
    isSelectedProject: boolean;
    organizationId: any;
    selectedOrganization: any;
    organizations: any;
    searchInput: string;
    viewOptions = [{ value: 'all', display: 'All' }, { value: 'public', display: 'Public' }, { value: 'private', display: 'Private' }];
    selectedView: string = 'all';
    refsetGridApi: any;
    refsetGridColumnApi: any;
    columnDefs = [];
    refsetGridColumns = [{ name: 'information', show: true }, { name: 'refsetId', show: true }];
    refsetGridOptions: any;
    refsetGridPaging = {
        pageSize: 10,
        pageSizeOptions: [10, 25, 50, 100],
        totalKnown: false,
        totalRows: null,
        manualStateRefresh: new Boolean(true)
    };
    refsetGridLastFilter: string = '';
    refsetGridLastSort: string = '';
    showTable: boolean = false;
    refsetData: any;
    dialog: DialogService;
    versions: any;
    initialGridWidth: number;
    showFullNarrativeText = false;
    showFullNotesText = false;
    showLoadingSpinner = false;
    createRefsetProperties: any = {};
    metadataAndConcepts = true;
    dummydata = ['Your Usual Project', 'Project 2', 'Project 3'];
    selectedValue = this.dummydata[0];
    context: Context;
    originalGridParams: any;
    existingBranchVersions: any;
    numOfResults: number;
    projectIsUat: boolean;
    projectId: any;
    uiUtility = UiUtility;

    @ViewChild('projectNameSection') nameSection: TemplateRef<any>;
    @ViewChild('projectWorkflowStatusSection') workflowStatus: TemplateRef<any>;
    @ViewChild('projectPaging') paginationComponent: PaginationComponent;
    @ViewChild('projectActionSection') actionSection: TemplateRef<any>;
    

    constructor(
        protected router: Router,
        protected titleService: Title,
        protected refsetService: RefsetService,
        private changeDetectorRef: ChangeDetectorRef,
        private breadcrumbService: BreadcrumbService,
        readonly toggleService: ToggleService,
        protected authService: AuthenticationService,
        private readonly modalService: NgbModal,
        protected route: ActivatedRoute,
        protected readonly projectsService: ProjectsService,
        private location: Location
    ) {
        refsetService.getTaxonomyRoot();
    }

    //***** Framework Functions *****/
    ngOnInit() {
        
        this.titleService.setTitle('Refset Tool - Projects');

        this.route.params.subscribe(params => {

            this.organizationId = params['organizationId'];
			this.projectId = params['id'];
			this.setNavigation();
            sessionStorage.setItem('selectedProjectId', JSON.stringify(params['id']));
        });

        this.getUser();
        this.getOrganizations();

        this.showLoadingSpinner = true;
    }

    setNavigation() {

        let breadcrumbs: any = [{ path: '/dashboard', label: 'Dashboard' }];

        if (CodeUtility.hasValue(this.organizationId), true, true) {
            breadcrumbs.push({ path: 'organizations/projects/' + this.organizationId, label: 'Organization Projects' });
        }

        breadcrumbs.push({ label: 'Reference Sets' });
        this.breadcrumbService.setBreadcrumbs(breadcrumbs);

        this.menu = [
            { name: 'Reference Sets', link: '/organization/' + this.organizationId + '/projects', icon: 'fa fa-copy', isActive: true },
            { name: 'People', link: '/organization/' + this.organizationId + '/projects/people/', icon: 'fa fa-user' },
        ];
    }

    getUser(): void {
        this.user = this.authService.getUser();
    }

    ngAfterViewInit() {

        this.refsetService.getVersions().subscribe((versionResults) => {

            this.versions = versionResults;
            let versionsArray = this.versions?.items;
            this.showLoadingSpinner = false;

            let workflowStatuses = [
                { type: 'status', name: 'Ready For Edit', value: 'READY_FOR_EDIT' },
                { type: 'status', name: 'In Edit', value: 'IN_EDIT' },
                { type: 'status', name: 'In Upgrade', value: 'IN_UPGRADE' },
                { type: 'status', name: 'Ready For Review', value: 'READY_FOR_REVIEW' },
                { type: 'status', name: 'In Review', value: 'IN_REVIEW' },
                { type: 'status', name: 'Review Completed', value: 'REVIEW_COMPLETED' },
                { type: 'status', name: 'Ready For Publication', value: 'READY_FOR_PUBLICATION' },
                { type: 'status', name: 'Published', value: 'PUBLISHED' }
            ];
    
            this.columnDefs = [
                { field: 'refsetId', headerName: 'Refset ID', cellClass: 'refset-tool-directory-column-id', minWidth: 155, resizable: false },
                { field: 'name', headerName: 'Refset Name', cellClass: 'refset-tool-directory-column-name', flex: 1, minWidth: 550, resizable: true, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.nameSection } },
                { field: 'assignedUser', headerName: 'Assignee', cellClass: 'refset-tool-directory-column-assignee', minWidth: 150, resizable: false },
                {
                    field: 'workflowStatus', headerName: 'Workflow Status', cellClass: 'refset-tool-directory-column-workflow-status', minWidth: 180, resizable: false, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.workflowStatus },
                    floatingFilterComponent: 'categoryFilterComponent', floatingFilterComponentParams: { suppressFilterButton: true, names: workflowStatuses }
                },
                {
                    field: 'versionDate', tooltipField: 'versionDate', headerName: 'Version Date', cellClass: 'refset-tool-directory-column-version-date', minWidth: 150, resizable: false, valueGetter: UiUtility.gridDateValueGetter,
                    floatingFilterComponent: 'categoryFilterComponent', floatingFilterComponentParams: { suppressFilterButton: true, names: versionsArray }
                },
                {
                    field: 'modified', tooltipField: 'modified', headerName: 'Last Modified Date', cellClass: 'refset-tool-directory-column-modified-date', minWidth: 180, resizable: false, valueGetter: UiUtility.gridDateValueGetter,
                    floatingFilterComponent: 'dateTextFilterComponent', floatingFilterComponentParams: { suppressFilterButton: true }, sort: 'desc'
                },
                { field: 'downloadable', colId: 'actions', headerName: '', width: 110, cellClass: 'refset-tool-directory-column-actions', cellRenderer: 'templateRenderer', cellRendererParams: { template: this.actionSection }, sortable: false, filter: false, resizable: false }
            ];
    
            this.refsetGridOptions = {
                context: { componentParent: this },
                pagination: true,
                suppressColumnVirtualisation: true, // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
                suppressPaginationPanel: true,
                paginationPageSize: this.refsetGridPaging.pageSize,
                cacheBlockSize: this.refsetGridPaging.pageSize,
                maxBlocksInCache: 1,
                rowModelType: 'infinite',
                enableCellTextSelection: true,
                rowSelection: 'single',
                onCellClicked: this.onGridCellClick,
                onGridReady: this.onGridReady,
                frameworkComponents: {
                    'templateRenderer': TemplateRenderer,
                    'categoryFilterComponent': CategoryFilterComponent,
                    'dateTextFilterComponent': DateTextFilterComponent
                },
                defaultColDef: {
                    sortable: true,
                    filter: true,
                    floatingFilter: true,
                    floatingFilterComponentParams: { placeholder: '', suppressFilterButton: true },
                    suppressMenu: true,
                    menuTabs: ['columnsMenuTab'],
                    resizable: true
                },
                rowClassRules: {
                    'refset_tool_grid_inactive_row': function (params) {
    
                        var inactivatedRow = false;
    
                        if (params.data) {
                            inactivatedRow = params.data.active == false;
                        }
    
                        return inactivatedRow;
                    }
                }
            };
        });

        this.changeDetectorRef.detectChanges();
    }

    getOrganizations(): void {

        this.refsetService.getOrganizations().subscribe((organizationResults) => {

            this.organizations = organizationResults?.items;

            for (let organization of this.organizations) {

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
        this.getProjects();
    }

    getProjects(): void {

        this.refsetService.getProjects('includeMembers=true&query=organizationId:' + this.selectedOrganization.id + '&limit=500&offset=0&sort=name&sortAscending=true').subscribe((results) => {

			this.projectList = results.items;

			for (let project of this.projectList) {

                if (this.projectId == project.id) {

                    this.selectedProject = project;
                    this.showProjectData();
                    break; 
                }
            }

            this.getStorageItems();
		});
    }

    showProjectData(): void {

		let configShowing = this.menu[this.menu.length -1].name == 'Configuration';

        if (!configShowing && this.selectedOrganization.roles.includes('ADMIN')) { 
            this.menu.push({ name: 'Configuration', link: '/organization/' + this.organizationId + '/projects/configuration', icon: 'fa fa-cogs' });

        } else if (configShowing && !this.selectedOrganization.roles.includes('ADMIN'))  {
            this.menu.pop;
        }

        this.showRefsets();
	}

    selectProject($event): void {
        
        this.projectId = this.selectedProject.id;
        this.location.replaceState('organization/' + this.organizationId + '/projects/' + this.projectId);
        this.showProjectData();
    }

    getStorageItems(): void {

        if (sessionStorage.getItem('selectedProjectId')) {

            let storedProjectId = JSON.parse(sessionStorage.getItem('selectedProjectId'));

            for (let project of this.projectList) {

                if (project.id == storedProjectId) {

                    this.selectedProject = project;
                    this.selectProject(null);
                    return;
                }
            }

            // if the stored project ID doesn't match anything remove it
            sessionStorage.removeItem('selectedProjectId');
        }

        // set to first in project list if none stored
        else if (this.projectList && this.projectList.length > 0) {

            this.selectedProject = this.projectList[0];
            this.selectProject(null);
        }
    }

    showRefsets() {

        if (this.originalGridParams) {
            this.onGridReady(this.originalGridParams);
        } else {
            this.showTable = true;
        }
        
        this.isSelectedProject = JSON.stringify(this.selectedProject.id) === sessionStorage.getItem('selectedProjectId');
        sessionStorage.setItem('selectedProjectId', JSON.stringify(this.selectedProject.id));
        this.projectIsUat = this.selectedProject.name.includes("UAT");
    }

    onGridReady = (gridReadyParams) => {

        if (!this.selectedProject) {
            return;
        }

        this.createRefsetProperties = { project: this.selectedProject, definitionClauses: [{ value: '', negated: false }] };
        this.getBranchVersions();
        this.originalGridParams = gridReadyParams;
        this.refsetGridApi = gridReadyParams.api;
        this.refsetGridColumnApi = gridReadyParams.columnApi;

        let dataSource = {
            rowCount: null,
            getRows: (rowParams) => {

                this.refsetGridApi.showLoadingOverlay();
                // this.showLoadingSpinner = true;

                let pageNumber = rowParams.endRow / this.refsetGridApi.paginationGetPageSize();
                let query = UiUtility.formatFilterData(rowParams.filterModel);
                let sort = UiUtility.formatSortData(rowParams.sortModel);

                query = CodeUtility.addIfNotEmpty(query, ' AND ') + "projectId:" + this.selectedProject.id;


                let newFilterString = query;
                let newSortString = JSON.stringify(sort);

                // if the filters or sort have changed then move to the first page
                if (newFilterString !== this.refsetGridLastFilter || newSortString !== this.refsetGridLastSort) {

                    pageNumber = 1;
                    this.refsetGridApi?.api?.paginationGoToPage(0);
                }

                // if the filters have changed then reset the total row variables
                if (newFilterString !== this.refsetGridLastFilter) {

                    this.refsetGridPaging.totalRows = null;
                    this.refsetGridPaging.totalKnown = false;
                }

                this.refsetGridLastFilter = newFilterString;
                this.refsetGridLastSort = newSortString;

                query = query.replace(/\//g, '%2F');

                let restParams: any = {
                    limit: this.refsetGridApi.paginationGetPageSize(),
                    offset: (pageNumber - 1) * this.refsetGridApi.paginationGetPageSize(),
                    searchConcepts: this.metadataAndConcepts,
                    showInDevelopment: true,
                    countComments: true,
                    sortModel: rowParams.sortModel,
                    filterModel: rowParams.filterModel,
                    query: query
                }

                this.refsetService.getRefsets({ ...restParams, ...sort }).subscribe(results => {

                    this.numOfResults = results.total;

                    if (results.items.length == 0 && pageNumber > 1) {

                        this.refsetGridPaging.totalRows = (this.refsetGridApi.paginationGetPageSize() * (pageNumber - 1));
                        this.refsetGridPaging.totalKnown = true;
                        this.paginationComponent.goToPage(pageNumber - 1);
                        this.showLoadingSpinner = false;

                        return;
                    }

                    let data = results.items;
                    this.refsetData = data;

                    if (data?.length > 0) {

                        this.refsetGridApi.hideOverlay();
                        let currentRowCount = null;
                        let lastRow = -1;

                        if (results.totalKnown || data.length < this.refsetGridApi.paginationGetPageSize() || this.refsetGridPaging.totalKnown) {

                            if (results.totalKnown) {

                                lastRow = results.total;

                            } else if (this.refsetGridPaging.totalKnown) {

                                lastRow = this.refsetGridPaging.totalRows;
                            } else {

                                currentRowCount = data.length + ((pageNumber - 1) * this.refsetGridApi.paginationGetPageSize());
                                lastRow = currentRowCount;
                            }

                            this.refsetGridPaging.totalRows = lastRow;
                            this.refsetGridPaging.totalKnown = true;

                        } else {
                            currentRowCount = data.length + ((pageNumber - 1) * this.refsetGridApi.paginationGetPageSize());
                        }

                        for (let i = 0; i < data?.length; i++) {
                            this.refsetService.getDiscussionThreads("REFSET", data[i].id, null).subscribe({
                                next: (results) => {
                                    data[i].unresolvedDiscussionCount = 0;
                                    for (let discussion of results.items) {

                                        if (discussion.status == 'Open') {
                                            data[i].unresolvedDiscussionCount++;
                                        }
                                    }
                                }
                            });
                        }
                        
                        rowParams.successCallback(data, lastRow);
                    } else {

                        this.refsetGridApi.showNoRowsOverlay();
                        rowParams.successCallback([], 0);
                    }

                    this.refsetGridPaging.manualStateRefresh = new Boolean(true);
                    this.showLoadingSpinner = false;
                },
                    error => {

                        this.refsetGridApi.showNoRowsOverlay();
                        rowParams.successCallback([], 0);
                    });
            }
        };

        gridReadyParams.api.setDatasource(dataSource);

        // set placeholders on the grid floating filter fields
        Array.from(document.querySelectorAll('.ag-floating-filter-full-body .ag-input-field-input')).forEach((obj: any) => {

            if (obj.attributes['disabled']) { // skip columns with disabled filter
                return;
            }

            let label = obj.getAttribute('aria-label');
            let value = label.substring(0, label.indexOf('Filter Input')) + '...';
            obj.setAttribute('placeholder', value);
        });
        this.showLoadingSpinner = false;

    }

    onGridCellClick = (event) => {

        if (event.column.colId === 'information' || event.column.colId === 'actions') {


        } else {

            let selectedRows = this.refsetGridApi.getSelectedRows();
            let refsetId: string;
            let versionDate: string;

            selectedRows.forEach(function (selectedRow, index) {
                refsetId = selectedRow.refsetId;
                versionDate = RefsetUtility.getVersionDateForRefsetApiCall(selectedRow);
            });

            this.goToDetailsPage(refsetId, versionDate);
        }
    }

    @Debounce()
    changedViewFilter() {
        this.refsetGridApi.purgeInfiniteCache();
    }

    goToDetailsPage(refsetId, versionDate) {
        this.router.navigate(['/details', refsetId, versionDate]);
    }

    getRefsetRow(refsetId: string) {

        let refset;

        for (let i = 0; i < this.refsetData.length; i++) {

            if (this.refsetData[i].refsetId == refsetId) {

                refset = this.refsetData[i];
                break;
            }
        }

        return refset;
    }

    private getBranchVersions(): void {
        if (this.selectedProject) {
            this.refsetService.getBranchVersions(`branch=${this.selectedProject?.organization?.edition?.branch.toString()}`).subscribe(results => {
                this.existingBranchVersions = results.items ? results.items : undefined;
            });
        }
    }

    capitalizeFirstLetterOfString(stringValue: string): string {
        if (stringValue) {
            return stringValue.replace(/(?:^|\s|[-"'([{])+\S/g, (c) =>
                c.toUpperCase()
            );
        }

        return stringValue;
    }

    getRoleString(): string {

        if (!this.selectedProject) {
            return '';
        }

        return UiUtility.getRoleString(this.selectedProject.roles);
    }

    openWorkflowDiagramModal(workflowDiagramModal: NgbModal) {
        this.modalService.open(workflowDiagramModal, {
            //backdrop : 'static',
            //keyboard : false,
            windowClass: 'workflow-diagram-modal'
        });
    }

    get routeUrl(): any[] {
        let url = ['/organization', this.organizationId ? this.organizationId : 0, 'projects'];
        if (this.selectedProject?.id) {
            url.push(this.selectedProject.id);
        }
        return url;
    }
}
