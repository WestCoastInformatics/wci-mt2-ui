import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DialogService } from 'src/app/dialog/services/dialog.service';
import { DialogFactoryService } from 'src/app/dialog/services/dialog-factory.service';
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';
import { CategoryFilterComponent } from 'src/app/components/categoryFilter/category-filter.component';
import { DateTextFilterComponent } from 'src/app/components/dateTextFilter/date-text-filter.component';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { Title } from '@angular/platform-browser';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { RefsetUtility } from 'src/app/utilities/refset.utility';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { PaginationComponent } from 'src/app/components/pagination/pagination.component';
import { Debounce } from '../decorators/debounce.decorator';
import { forkJoin } from 'rxjs';
import { User } from '../models/user';
import { AuthenticationService } from '../services/authentication/authentication.service';


/**
 * @title Tree with nested nodes
 */
@Component({
    selector: 'app-refset-directory',
    templateUrl: 'refset-directory.html'
})

export class RefsetDirectory implements OnInit, AfterViewInit {

    user: User;
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
        manualStateRefresh: Boolean(true)
    };
    refsetGridLastFilter = '';
    refsetGridLastSort = '';
    refsetGridLastQuery = '';
    showTable = false;
    refsetData: any;
    dialog: DialogService;
    versionStatuses: any;
    versions: any;
    organizations: any;
    initialGridWidth: number;
    showFullNarrativeText = false;
    showFullNotesText = false;
    showLoadingSpinner = false;
    toggleDropdown = false;
    numOfResults: any;
    directUrl: string;
    numOfMembers: any;
    disableChannel = new BroadcastChannel('disable-button-channel');
    uiUtility = UiUtility;

    @ViewChild('directoryInfoDialog') infoDialog: TemplateRef<any>;
    @ViewChild('directoryFeedbackDialog') feedbackDialog: TemplateRef<any>;
    @ViewChild('directoryInfoSection') infoSection: TemplateRef<any>;
    @ViewChild('directoryNameSection') nameSection: TemplateRef<any>;
    @ViewChild('directoryEditionSection') editionSection: TemplateRef<any>;
    @ViewChild('directoryActionSection') actionSection: TemplateRef<any>;
    @ViewChild('directoryPaging') paginationComponent: PaginationComponent;
    @ViewChild('directoryCategoryFilter') categoryFilter: TemplateRef<any>;
    @ViewChild('directoryWorkflowStatusSection') versionStatus: TemplateRef<any>;

    @Output() loadingSpinner = new EventEmitter<boolean>(true);
    originalGridParams: any;

    constructor(
        private router: Router,
        private titleService: Title,
        private dialogFactoryService: DialogFactoryService,
        private refsetService: RefsetService,
        private changeDetectorRef: ChangeDetectorRef,
        private breadcrumbService: BreadcrumbService,
        private authenticationService: AuthenticationService
    ) {
        document.body.scrollTop = 0;
        refsetService.getTaxonomyRoot();
    }

    //***** Framework Functions *****/
    ngOnInit() {
        this.user = this.authenticationService.getUser();
        this.titleService.setTitle('Reference Set Tool - Reference Set Library');
        this.breadcrumbService.setBreadcrumbs([{ label: 'Reference Set Library' }]);

        this.disableChannel.postMessage(false);
    }

    ngAfterViewInit() {

        forkJoin(this.refsetService.getVersionStatuses(), this.refsetService.getVersions(), this.refsetService.getEditions('limit=500&sort=name'), this.refsetService.getOrganizationsKeyValue()).
            subscribe({
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
                        { field: 'id', colId: 'information', headerName: '', maxWidth: 80, minWidth: 80, width: 80, cellClass: 'refset-tool-directory-column-information', cellRenderer: 'templateRenderer', cellRendererParams: { template: this.infoSection }, filter: false, resizable: false, sortable: false },
                        { field: 'refsetId', tooltipField: 'refsetId', headerName: 'Reference ID', cellClass: 'refset-tool-directory-column-id', minWidth: 140, resizable: false, unSortIcon: true },
                        { field: 'name', tooltipField: 'name', headerName: 'Reference Name', cellClass: 'refset-tool-directory-column-name', flex: 1, resizable: true, minWidth: 200, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.nameSection }, sort: 'asc', unSortIcon: true },
                        {
                            field: 'editionName', tooltipField: 'editionName', headerName: 'Edition/Extension', cellClass: 'refset-tool-directory-column-edition', minWidth: 140, resizable: true, valueGetter: this.editionValueGetter, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.editionSection }, floatingFilterComponent: 'categoryFilterComponent',
                            floatingFilterComponentParams: { suppressFilterButton: true, names: editionsArray }, unSortIcon: true
                        },
                        {
                            field: 'organizationName', tooltipField: 'organizationName', headerName: 'Organization/Owner', cellClass: 'refset-tool-directory-column-organization', minWidth: 200, flex: 1, resizable: true, floatingFilterComponent: 'categoryFilterComponent',
                            floatingFilterComponentParams: { suppressFilterButton: true, names: organizationsArray }, unSortIcon: true
                        },
                        {
                            field: 'versionStatus', tooltipField: 'versionStatus', headerName: 'Version Status', cellClass: 'refset-tool-directory-column-version-status', minWidth: 140, resizable: false,
                            valueGetter: this.versionStatusValueGetter, floatingFilterComponent: 'categoryFilterComponent', floatingFilterComponentParams: { suppressFilterButton: true, names: versionStatusArray }, unSortIcon: true
                        },
                        {
                            field: 'versionDate', tooltipValueGetter: UiUtility.gridDateValueGetter, headerName: 'Version Date', cellClass: 'refset-tool-directory-column-version-date', minWidth: 140, resizable: false, valueGetter: UiUtility.gridDateValueGetter, floatingFilterComponent: 'categoryFilterComponent',
                            floatingFilterComponentParams: { suppressFilterButton: true, names: versionsArray }, unSortIcon: true
                        },
                        {
                            field: 'modified', tooltipValueGetter: UiUtility.gridDateValueGetter, headerName: 'Last Modified Date', cellClass: 'refset-tool-directory-column-modified-date', width: 190, resizable: true, valueGetter: UiUtility.gridDateValueGetter, floatingFilterComponent: 'dateTextFilterComponent',
                            floatingFilterComponentParams: { suppressFilterButton: true }, unSortIcon: true
                        },
                        { field: 'downloadable', colId: 'actions', headerName: '', width: 120, cellClass: 'refset-tool-directory-column-actions', cellRenderer: 'templateRenderer', cellRendererParams: { template: this.actionSection }, sortable: false, filter: false, resizable: false }
                    ];
                    this.refsetGridOptions = {
                        context: { componentParent: this },
                        pagination: true,
                        suppressColumnVirtualisation: true, // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
                        suppressPaginationPanel: true,
                        paginationPageSize: this.refsetGridPaging.pageSize,
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
                                    inactivatedRow = params.data.active == false;
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

    showDropdown(): void {
        this.toggleDropdown = !this.toggleDropdown;
    }

    //***** AG Grid Functions *****/
    onGridReady = (gridReadyParams) => {

        this.originalGridParams = gridReadyParams;
        this.refsetGridApi = gridReadyParams.api;
        this.refsetGridColumnApi = gridReadyParams.columnApi;
        this.onResize(undefined);

        this.refsetGridApi.showLoadingOverlay();
        let pageNumber = this.refsetGridApi.paginationGetCurrentPage() + 1;
        let query = '';
        const filter = UiUtility.formatFilterData(gridReadyParams.filterModel);

        if (this.selectedView === 'public') {
            query = CodeUtility.addIfNotEmpty(query, ' AND ') + 'privateRefset: false';
        } else if (this.selectedView === 'private') {
            query = CodeUtility.addIfNotEmpty(query, ' AND ') + 'privateRefset: true';
        }

        if (CodeUtility.hasValue(this.searchInput) && this.searchInput.length > 2) {
            query = CodeUtility.addIfNotEmpty(query, ' AND ') + this.searchInput;
        }

        const newQueryString = query;
        const newFilterString = filter;

        // if the filters or sort have changed then move to the first page
        if (newQueryString !== this.refsetGridLastQuery) {

            pageNumber = 1;
            this.refsetGridPaging.totalRows = null;
            this.refsetGridPaging.totalKnown = false;
            this.refsetGridApi?.api?.paginationGoToPage(0);
        }

        this.refsetGridLastFilter = newFilterString;
        this.refsetGridLastQuery = newQueryString;

        const restParams: any = {
            displayType: 'list',
            offset: pageNumber - 1,
            searchConcepts: true,
            showInDevelopment: false,
            countComments: true,
        };

        if (CodeUtility.hasValue(this.refsetGridLastQuery)) {
            this.refsetGridLastQuery = this.refsetGridLastQuery.replace(/\//g, '%2F').replace(/%/g, '%25');
            restParams.query = this.refsetGridLastQuery;
        }

        this.refsetService.getRefsets({ ...restParams, }).subscribe({
            next: (results) => {
                const data = results.items;
                this.refsetData = data;
                this.numOfMembers = this.numOfMembers ? this.numOfMembers : results.total;
                this.numOfResults = results.total;

                if (results.items.length == 0) {

                    this.refsetGridPaging.totalKnown = true
                    this.refsetGridApi.showNoRowsOverlay();
                    this.refsetGridApi.setRowData([]);

                    if (pageNumber > 1) {

                        this.refsetGridPaging.totalRows = this.refsetGridApi.paginationGetPageSize() * (pageNumber - 1);
                        this.refsetGridPaging.totalKnown = true;
                        this.paginationComponent.goToPage(pageNumber - 1);
                        this.showLoadingSpinner = false;
                    }

                    return;
                }

                UiUtility.applyServerPagedGridResults(results, this.refsetGridApi, this.refsetGridPaging, pageNumber, null, false);

                this.showLoadingSpinner = false;
            },
            error: (error) => {

                this.refsetGridApi.showNoRowsOverlay();
                this.refsetGridApi.setRowData([]);
            }
        });

        // set placeholders on the grid floating filter fields
        Array.from(document.querySelectorAll('.ag-floating-filter-body .ag-input-field-input')).forEach((obj: any) => {
            if (obj.attributes['disabled']) {
                // skip columns with disabled filter
                return;
            }

            const label = obj.getAttribute('aria-label');
            const value = label.substring(0, label.indexOf('Filter Input')) + '...';
            obj.setAttribute('placeholder', value);
        });
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

    onGridCellClick = (event) => {

        if (event.column.colId === 'information' || event.column.colId === 'actions') {

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

    @Debounce()
    changedViewFilter() {
        this.onGridReady(this.originalGridParams);
    }

    delay = (function () {
        var timer = 0;
        return function (callback, ms) {
            clearTimeout(timer);
            setTimeout(callback, ms);
        };
    })()
    //***** General Functions *****/

    openEclBuilder(fieldId) {
        UiUtility.openEclBuilder(fieldId, "MAIN");
    }

    goToDetailsPage(refsetId, versionDate) {
        const url = new URL(window.location.href);
        url.searchParams.set('reload', 'true');
        window.history.pushState({}, '', url.href);
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

    openInformation(refsetId: string) {

        if (this.showLoadingSpinner == false) {
            this.showLoadingSpinner = true;
            this.loadingSpinner.emit(true);
        } else {
            return;
        }

        const refsetDirectoryData = this.getRefsetRow(refsetId);

        this.refsetService.getRefset(refsetDirectoryData.refsetId, RefsetUtility.getVersionDateForRefsetApiCall(refsetDirectoryData)).subscribe((results) => {

            let refset = results;
            const dialogId = 'directoryInfoDialog';
            this.directUrl = (window.location.protocol + '//' + window.location.host + this.router.url).replace("library", "details/" + refset.refsetId + '/'
                + RefsetUtility.getVersionDateForRefsetApiCall(refset));

            if (CodeUtility.hasValue(refset)) {

                refset.status = RefsetUtility.getStatus(refset.active);
                if (CodeUtility.hasValue(refset.narrative)) {
                    refset.narrativeShortText = refset.narrative;
                }

                if (CodeUtility.hasValue(refset.versionNotes)) {
                    refset.versionNotesShortText = refset.versionNotes;
                }

                refset.versionDate = CodeUtility.formatJsonDate(refset.versionDate);
                refset.flagIcon = RefsetUtility.getEditionFlagIcon(refset.edition.branch);
            }

            refset.versionList = results.versionList;

            const dialogData = {
                dialogId: dialogId,
                showCancel: false,
                cancelText: 'Close',
                actionText: 'View Complete Reference Set',
                showConfirm: false,
                template: this.infoDialog,
                headerText: 'Reference Set Metadata',
                data: refset,
                showAction: true,
                showCloseIcon: true
            };

            const dialogOptions = {
                id: dialogId,
                width: '1000px',
                disableClose: false
            }

            if (this.showLoadingSpinner) {
                this.showLoadingSpinner = false;
                this.loadingSpinner.emit(false);
            }

            this.dialog = this.dialogFactoryService.open(dialogData, dialogOptions);

            this.dialog.confirmed().subscribe(data => {

                if (data) {
                    this.goToDetailsPage(refset.refsetId, RefsetUtility.getVersionDateForRefsetApiCall(refset));
                }
            });
        });
    }

    openFeedback(refsetId: string) {

        const refset = this.getRefsetRow(refsetId);
        const dialogId = 'directoryFeedbackDialog';

        const dialogData = {
            headerText: `Reference Set Feedback for ${refset.name} (${refset.refsetId})`,
            template: this.feedbackDialog,
            data: refset
        };

        const dialogOptions = {
            id: dialogId,
            disableClose: false
        };

        this.dialog = this.dialogFactoryService.open(dialogData, dialogOptions);

        this.dialog.confirmed().subscribe(data => {

            if (data) {
                refset.feedback = data.feedback;
            }
        });
    }

    clearSearch() {
        if (this.searchInput) {
            this.searchInput = '';
            this.paginationComponent.setPageSize(10);
        }
    }

    @Debounce()
    onSearchChange() {
        this.searchInput = this.searchInput.trim();
        if (!CodeUtility.hasValue(this.searchInput) || (CodeUtility.hasValue(this.searchInput) && this.searchInput.length > 2)) {
            this.delay(() => {
                this.onGridReady(this.originalGridParams);
            }, 500)
        }
    }

    setFullNarrativeText(show: boolean): void {
        this.showFullNarrativeText = show;
    }

    setFullNotesText(show: boolean): void {
        this.showFullNotesText = show;
    }

    capitalizeFirstLetterOfString(stringValue: string): string {
        if (stringValue) {
            return stringValue.toLowerCase().replace(/(?:^|\s|[-"'([{])+\S/g, (c) =>
                c.toUpperCase()
            );
        }

        return stringValue;
    }

    onResize(event) {
        const gridWidth = document.getElementsByClassName('refset-tool-ag-grid')[0]?.clientWidth;
        document.getElementsByClassName('ag-header')[0]?.setAttribute('style', `width: ${gridWidth}px;`);
    }

    setDescriptions(refsetData: any): Array<string> {
        return refsetData?.descriptions;
    }

    showFlagIcon(event, show) {

        if (show) {
            event.target.style.display = 'inline';
        } else {
            event.target.style.display = 'none';
        }
    }

    latestDate(refset, versionList: any[]): string {
        if (refset.versionStatus === RefsetUtility.IN_DEVELOPMENT) {
            return 'Latest';
        }
        return versionList && versionList[0] ? `${versionList[0].date}` : '';
    }
}
