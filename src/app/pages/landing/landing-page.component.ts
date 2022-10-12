import { AfterViewInit, ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { UiUtility } from '../../utilities/ui.utility';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { Debounce } from '../../decorators/debounce.decorator';
import { CodeUtility } from '../../utilities/code.utility';
import { RefsetUtility } from '../../utilities/refset.utility';
import { RefsetService } from '../../services/rest/refset.service';
import { TemplateRenderer } from '../../components/cellRenderers/template.renderer';
import { CategoryFilterComponent } from '../../components/categoryFilter/category-filter.component';
import { DateTextFilterComponent } from '../../components/dateTextFilter/date-text-filter.component';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';


@Component({
    // tslint:disable-next-line:component-selector
    selector: 'landing',
    templateUrl: './landing-page.component.html',
    styleUrls: ['./landing-page.component.scss']
})
export class LandingComponent implements OnInit, AfterViewInit {
    year: number = new Date().getFullYear();
    searchInput: string;
    selectedView = 'public';
    refsetGridApi: any;
    refsetGridColumnApi: any;
    columnDefs = [];
    refsetGridOptions: any;
    refsetGridPaging = {
        pageSize: 10,
        pageSizeOptions: [10, 25, 50, 100],
        totalKnown: false,
        totalRows: null,
        manualStateRefresh: Boolean(true)
    };
    refsetGridLastFilter = '';
    refsetGridLastSort = '';
    showTable = false;
    refsetData: any;
    versionStatuses: any;
    versions: any;
    organizations: any;
    showLoadingSpinner = false;
    numOfResults: any;
    numOfMembers: any;
    uiUtility = UiUtility;

    @ViewChild('directoryNameSection') nameSection: TemplateRef<any>;
    @ViewChild('directoryEditionSection') editionSection: TemplateRef<any>;
    @ViewChild('directoryPaging') paginationComponent: PaginationComponent;
    @ViewChild('directoryCategoryFilter') categoryFilter: TemplateRef<any>;
    @ViewChild('directoryWorkflowStatusSection') versionStatus: TemplateRef<any>;

    constructor(private authService: AuthenticationService, private refsetService: RefsetService,
        private changeDetectorRef: ChangeDetectorRef, private router: Router) {
        document.body.scrollTop = 0;
    }

    get showResults(): boolean {
        return !!this.searchInput;
    }

    ngOnInit(): void {
    }

    login(): void {
        this.authService.imsLogin();
    }

    ngAfterViewInit() {

        forkJoin(this.refsetService.getVersionStatuses(), this.refsetService.getVersions(), this.refsetService.getEditions('limit=500&sort=name'), this.refsetService.getOrganizationsKeyValue()).subscribe({
            next: ([results, versionResults, editionResults, organizationResults]) => {

                this.versionStatuses = results;
                const versionStatusArray = this.versionStatuses?.items;
                this.versions = versionResults;
                const versionsArray = this.versions?.items;
                const editionsArray = editionResults.items;
                this.organizations = organizationResults;
                const organizationsArray = this.organizations?.items;

                for (let i = 0; i < versionStatusArray.length; i++) {
                    versionStatusArray[i].key = versionStatusArray[i].key.toLowerCase();
                    versionStatusArray[i].value = versionStatusArray[i].value.toLowerCase();
                }

                this.columnDefs = [
                    {
                        field: 'refsetId',
                        tooltipField: 'refsetId',
                        headerName: 'Reference ID',
                        cellClass: 'refset-tool-directory-column-id',
                        minWidth: 140,
                        resizable: false,
                        unSortIcon: true
                    },
                    {
                        field: 'name', tooltipField: 'name', headerName: 'Reference Name', cellClass: 'refset-tool-directory-column-name',
                        flex: 1, resizable: true, minWidth: 550,
                        sort: 'asc', unSortIcon: true
                    },
                    {
                        field: 'editionName',
                        tooltipField: 'editionName',
                        headerName: 'Edition/Extension',
                        cellClass: 'refset-tool-directory-column-edition',
                        minWidth: 140,
                        resizable: true,
                        valueGetter: this.editionValueGetter,
                        floatingFilterComponent: 'categoryFilterComponent',
                        floatingFilterComponentParams: { suppressFilterButton: true, names: editionsArray },
                        unSortIcon: true
                    },
                    {
                        field: 'organizationName',
                        tooltipField: 'organizationName',
                        headerName: 'Organization/Owner',
                        cellClass: 'refset-tool-directory-column-organization',
                        minWidth: 140,
                        resizable: true,
                        floatingFilterComponent: 'categoryFilterComponent',
                        floatingFilterComponentParams: { suppressFilterButton: true, names: organizationsArray },
                        unSortIcon: true
                    },
                    {
                        field: 'versionStatus',
                        tooltipField: 'versionStatus',
                        headerName: 'Version Status',
                        cellClass: 'refset-tool-directory-column-version-status',
                        minWidth: 140,
                        resizable: false,
                        valueGetter: this.versionStatusValueGetter,
                        floatingFilterComponent: 'categoryFilterComponent',
                        floatingFilterComponentParams: { suppressFilterButton: true, names: versionStatusArray },
                        unSortIcon: true
                    },
                    {
                        field: 'versionDate',
                        tooltipValueGetter: UiUtility.gridDateValueGetter,
                        headerName: 'Version Date',
                        cellClass: 'refset-tool-directory-column-version-date',
                        width: 140,
                        resizable: false,
                        valueGetter: UiUtility.gridDateValueGetter,
                        floatingFilterComponent: 'categoryFilterComponent',
                        floatingFilterComponentParams: { suppressFilterButton: true, names: versionsArray },
                        unSortIcon: true
                    },
                    {
                        field: 'modified', tooltipValueGetter: UiUtility.gridDateValueGetter, headerName: 'Last Modified Date',
                        cellClass: 'refset-tool-directory-column-modified-date', width: 190, resizable: false,
                        valueGetter: UiUtility.gridDateValueGetter, floatingFilterComponent: 'dateTextFilterComponent',
                        floatingFilterComponentParams: { suppressFilterButton: true }, unSortIcon: true
                    },
                ];
                this.refsetGridOptions = {
                    context: { componentParent: this },
                    pagination: true,
                    // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
                    suppressColumnVirtualisation: true,
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
                    enableBrowserTooltips: true,
                    defaultColDef: {
                        sortable: true,
                        filter: true,
                        sortingOrder: ['asc', 'desc'],
                        floatingFilter: true,
                        floatingFilterComponentParams: { placeholder: '', suppressFilterButton: false, suppressAndOrCondition: true },
                        suppressMenu: true,
                        menuTabs: ['columnsMenuTab'],
                        resizable: true
                    },
                    rowClassRules: {
                        'refset_tool_grid_inactive_row': function (params) {

                            let inactivatedRow = false;

                            if (params.data) {
                                inactivatedRow = params.data.active === false;
                            }

                            return inactivatedRow;
                        }
                    }
                };

                this.showTable = true;
                this.changeDetectorRef.detectChanges();
            },
            error: (error) => {
                this.showLoadingSpinner = true;
            }
        }
        );
    }

    // ***** AG Grid Functions *****/
    onGridReady = (gridReadyParams) => {
        this.refsetGridApi = gridReadyParams.api;
        this.refsetGridColumnApi = gridReadyParams.columnApi;
        this.onResize(undefined);
        const dataSource = {
            rowCount: null,
            getRows: (rowParams) => {

                this.refsetGridApi.showLoadingOverlay();

                let pageNumber = rowParams.endRow / this.refsetGridApi.paginationGetPageSize();
                let query = UiUtility.formatFilterData(rowParams.filterModel);
                const sort = UiUtility.formatSortData(rowParams.sortModel);

                if (this.selectedView === 'public') {
                    query = CodeUtility.addIfNotEmpty(query, ' AND ') + 'privateRefset: false';
                } else if (this.selectedView === 'private') {
                    query = CodeUtility.addIfNotEmpty(query, ' AND ') + 'privateRefset: true';
                }

                if (CodeUtility.hasValue(this.searchInput) && this.searchInput.length > 2) {
                    query = CodeUtility.addIfNotEmpty(query, ' AND ') + this.searchInput;
                }

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

                const restParams: any = {
                    limit: this.refsetGridApi.paginationGetPageSize(),
                    offset: (pageNumber - 1) * this.refsetGridApi.paginationGetPageSize(),
                    searchConcepts: true,
                    showInDevelopment: false,
                    countComments: true,
                    sortModel: rowParams.sortModel, // not needed once we get rid of mocking the backend
                    filterModel: rowParams.filterModel, // not needed once we get rid of mocking the backend
                };

                if (CodeUtility.hasValue(query)) {

                    query = query.replace(/\//g, '%2F').replace(/%/g, '%25');
                    restParams.query = query;
                }

                this.refsetService.getRefsets({ ...restParams, ...sort }).subscribe({
                    next: (results) => {

                        this.numOfMembers = this.numOfMembers ? this.numOfMembers : results.total;
                        this.numOfResults = results.total;

                        if (results.items.length === 0 && pageNumber > 1) {

                            this.refsetGridPaging.totalRows = this.refsetGridApi.paginationGetPageSize() * (pageNumber - 1);
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

                            if (results.totalKnown || data.length < this.refsetGridApi.paginationGetPageSize() ||
                                this.refsetGridPaging.totalKnown) {

                                if (results.totalKnown) {
                                    lastRow = results.total;

                                } else if (this.refsetGridPaging.totalKnown) {
                                    lastRow = this.refsetGridPaging.totalRows;

                                } else {

                                    currentRowCount = data.length + (pageNumber - 1) * this.refsetGridApi.paginationGetPageSize();
                                    lastRow = currentRowCount;
                                }
                                this.refsetGridPaging.totalRows = lastRow;
                                this.refsetGridPaging.totalKnown = true;

                            } else {
                                currentRowCount = data.length + (pageNumber - 1) * this.refsetGridApi.paginationGetPageSize();
                            }

                            rowParams.successCallback(data, lastRow);
                            this.paginationComponent.getCurrentPage();

                        } else {

                            this.refsetGridApi.showNoRowsOverlay();
                            rowParams.successCallback([], 0);
                        }

                        this.refsetGridPaging.manualStateRefresh = Boolean(true);
                        this.showLoadingSpinner = false;
                    },
                    error: (error) => {

                        this.refsetGridApi.showNoRowsOverlay();
                        rowParams.successCallback([], 0);
                    }
                });
            }
        };

        gridReadyParams.api.setDatasource(dataSource);

        // set placeholders on the grid floating filter fields
        Array.from(document.querySelectorAll('.ag-floating-filter-full-body .ag-input-field-input')).forEach((obj: any) => {

            if (obj.attributes['disabled']) {
                // skip columns with disabled filter
                return;
            }

            const label = obj.getAttribute('aria-label');
            const value = label.substring(0, label.indexOf('Filter Input')) + '...';
            obj.setAttribute('placeholder', value);
        });
    }

    onResize(event) {
        const gridWidth = document.getElementsByClassName('refset-tool-ag-grid')[0]?.clientWidth;
        document.getElementsByClassName('ag-header')[0].setAttribute('style', `width: ${gridWidth}px;`);
    }

    onGridCellClick = (event) => {

        if (event.column.colId === 'information' || event.column.colId === 'actions') {
            console.log(event);
        } else {

            const selectedRows = this.refsetGridApi.getSelectedRows();
            let selectedId: string;
            let selectedVersionDate: string;

            selectedRows.forEach(function (selectedRow, index) {

                selectedId = selectedRow.refsetId;
                selectedVersionDate = RefsetUtility.getVersionDateForRefsetApiCall(selectedRow);
            });

            this.goToDetailsPage(selectedId, selectedVersionDate);
        }
    };

    goToDetailsPage(refsetId, versionDate) {
        const url = new URL(window.location.href);
        url.searchParams.set('reload', 'true');
        window.history.pushState({}, '', url.href);
        this.router.navigate(['/details', refsetId, versionDate]);
    }

    editionValueGetter = function (params) {

        if (!CodeUtility.hasValue(params?.data)) {
            return '';
        }

        params.data.flagIcon = RefsetUtility.getEditionFlagIcon(params?.data?.edition?.branch);
        return params?.data?.edition?.name;
    };

    versionStatusValueGetter = function (params) {

        if (!CodeUtility.hasValue(params?.data)) {
            return '';
        }

        return params.data.versionStatus.toLowerCase();
    };

    @Debounce(500)
    onSearchChange() {
        this.searchInput = this.searchInput.trim();
        if ((!CodeUtility.hasValue(this.searchInput) || (CodeUtility.hasValue(this.searchInput) && this.searchInput.length > 2)) &&
            this.refsetGridApi) {
            this.refsetGridApi.purgeInfiniteCache();
        }
    }

    clearSearch(): void {
        this.searchInput = '';
        this.onSearchChange();
    }

    showFlagIcon(event, show) {

        if (show) {
            event.target.style.display = 'inline';
        } else {
            event.target.style.display = 'none';
        }
    }
}
