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
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProjectsService } from 'src/app/services/rest/projects.service';
import { User } from 'src/app/models/user';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';

@Component({
    selector: 'projects-refset',
    templateUrl: './projects-refset.component.html'
})
export class ProjectsRefsetComponent implements OnInit, AfterViewInit {

    menu: SidebarMenuItem[] = [];
    user: User;
    projectList: any[] = [];
    selectedProject: any;
    organizationId: any;
    selectedOrganization: any;
    organizationList: any[] = [];
    editionId: any;
    selectedEdition: any;
    editionList: any[] = [];
    searchInput: string;
    viewOptions = [{ value: 'all', display: 'All' }, { value: 'public', display: 'Public' }, { value: 'private', display: 'Private' }];
    selectedView = 'all';
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
    refsetGridLastFilter = '';
    refsetGridLastSort = '';
    showTable = false;
    refsetData: any;
    dialog: DialogService;
    versions: any;
    initialGridWidth: number;
    showFullNarrativeText = false;
    showFullNotesText = false;
    showLoadingSpinner = false;
    createRefsetProperties = {};
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
        document.body.scrollTop = 0;
        refsetService.getTaxonomyRoot();
    }

    // ***** Framework Functions *****/
    ngOnInit() {

        this.titleService.setTitle('Refset Tool - Projects');

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
            breadcrumbs.push({ path: 'organizations/' + this.organizationId + '/edition/' + this.editionId + '/projects', label: 'Organization Edition Projects' });
        }

        breadcrumbs.push({ label: 'Reference Sets' });
        this.breadcrumbService.setBreadcrumbs(breadcrumbs);

        this.menu = [
            { name: 'Reference Sets', link: '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/refsets', icon: 'fa fa-copy', isActive: true },
            { name: 'People', link: '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/people/', icon: 'fa fa-user' },
        ];

        const configShowing = this.menu[this.menu.length - 1].name == 'Configuration';

        if (!configShowing && this.selectedOrganization && this.selectedOrganization.roles.includes('ADMIN')) {
            this.menu.push({ name: 'Configuration', link: '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/configuration', icon: 'fa fa-cogs' });
        }

        this.location.replaceState('organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/refsets');
    }

    getUser(): void {
        this.user = this.authService.getUser();
    }

    ngAfterViewInit() {

        this.refsetService.getVersions().subscribe((versionResults) => {

            this.versions = versionResults;
            const versionsArray = this.versions?.items;

            const workflowStatuses = [
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
                    field: 'versionDate', tooltipValueGetter: UiUtility.gridDateValueGetter, headerName: 'Version Date', cellClass: 'refset-tool-directory-column-version-date', minWidth: 150, resizable: false, valueGetter: UiUtility.gridDateValueGetter,
                    floatingFilterComponent: 'categoryFilterComponent', floatingFilterComponentParams: { suppressFilterButton: true, names: versionsArray }
                },
                {
                    field: 'modified', tooltipValueGetter: UiUtility.gridDateValueGetter, headerName: 'Last Modified Date', cellClass: 'refset-tool-directory-column-modified-date', minWidth: 180, resizable: false, valueGetter: UiUtility.gridDateValueGetter,
                    floatingFilterComponent: 'dateTextFilterComponent', floatingFilterComponentParams: { suppressFilterButton: true }, sort: 'desc', sortingOrder: ['desc', 'asc', null]
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

                        let inactivatedRow = false;

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
        this.selectedProject = null;
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

        this.refsetService.getProjects('includeMembers=true&query=editionId:' + this.selectedEdition.id + '&limit=500&offset=0&sort=name&sortAscending=true').subscribe({
            next: (results) => {

                this.projectList = results.items;

                for (const project of this.projectList) {

                    if (this.projectId == project.id) {

                        this.selectedProject = project;
                        this.showRefsetData();
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
        this.showRefsetData();
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

    getStoredProjectId(): void {

        if (sessionStorage.getItem('selectedProjectId')) {

            const storedProjectId = JSON.parse(sessionStorage.getItem('selectedProjectId'));

            for (const project of this.projectList) {

                if (project.id == storedProjectId) {

                    this.selectedProject = project;
                    this.selectProject();
                    return;
                }
            }

            // if the stored project ID doesn't match anything remove it
            sessionStorage.removeItem('selectedProjectId');

            if (this.projectList && this.projectList.length > 0) {

                this.selectedProject = this.projectList[0];
                this.selectProject();
            }
        } else if (this.projectList && this.projectList.length > 0) {

            this.selectedProject = this.projectList[0];
            this.selectProject();
        }
    }

    showRefsetData() {

        if (this.originalGridParams) {
            this.onGridReady(this.originalGridParams);
        } else {
            this.showTable = true;
        }

        sessionStorage.setItem('selectedOrganizationId', JSON.stringify(this.selectedOrganization.id));
        sessionStorage.setItem('selectedEditionId', JSON.stringify(this.selectedEdition.id));
        sessionStorage.setItem('selectedProjectId', JSON.stringify(this.selectedProject.id));

        this.setNavigation();

        this.projectIsUat = this.selectedProject.name.includes('UAT');
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

        const dataSource = {
            rowCount: null,
            getRows: (rowParams) => {

                this.refsetGridApi.showLoadingOverlay();

                let pageNumber = rowParams.endRow / this.refsetGridApi.paginationGetPageSize();
                let query = UiUtility.formatFilterData(rowParams.filterModel);
                const sort = UiUtility.formatSortData(rowParams.sortModel);

                query = CodeUtility.addIfNotEmpty(query, ' AND ') + 'projectId:' + this.selectedProject.id;

                const newFilterString = query;
                const newSortString = JSON.stringify(sort);

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

                const restParams: any = {
                    limit: this.refsetGridApi.paginationGetPageSize(),
                    offset: (pageNumber - 1) * this.refsetGridApi.paginationGetPageSize(),
                    searchConcepts: this.metadataAndConcepts,
                    showInDevelopment: true,
                    countComments: true,
                    sortModel: rowParams.sortModel,
                    filterModel: rowParams.filterModel,
                    query: query
                };

                this.refsetService.getRefsets({ ...restParams, ...sort }).subscribe(results => {

                    this.numOfResults = results.total;

                    if (results.items.length == 0 && pageNumber > 1) {

                        this.refsetGridPaging.totalRows = (this.refsetGridApi.paginationGetPageSize() * (pageNumber - 1));
                        this.refsetGridPaging.totalKnown = true;
                        this.paginationComponent.goToPage(pageNumber - 1);
                        this.showLoadingSpinner = false;

                        return;
                    }

                    const data = results.items;
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
                            this.refsetService.getDiscussionThreads('REFSET', data[i].id, null).subscribe({
                                next: (results) => {
                                    data[i].unresolvedDiscussionCount = 0;
                                    for (const discussion of results.items) {

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
                        this.showLoadingSpinner = false;
                    });
            }
        };

        gridReadyParams.api.setDatasource(dataSource);

        // set placeholders on the grid floating filter fields
        Array.from(document.querySelectorAll('.ag-floating-filter-full-body .ag-input-field-input')).forEach((obj: any) => {

            if (obj.attributes['disabled']) { // skip columns with disabled filter
                return;
            }

            const label = obj.getAttribute('aria-label');
            const value = label.substring(0, label.indexOf('Filter Input')) + '...';
            obj.setAttribute('placeholder', value);
        });

    }

    onGridCellClick = (event) => {

        if (event.column.colId === 'information' || event.column.colId === 'actions') {
            return;
        } else {

            const selectedRows = this.refsetGridApi.getSelectedRows();
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
            windowClass: 'workflow-diagram-modal'
        });
    }
}
