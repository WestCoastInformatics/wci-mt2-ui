import { AfterViewInit, ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
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


/**
 * @title Tree with nested nodes
 */
@Component({
    selector: 'app-refset-directory',
    templateUrl: 'refset-directory.html'
})

export class RefsetDirectory implements OnInit, AfterViewInit {

    searchInput: string;
    viewOptions = [{ value: 'all', display: 'All' }, { value: 'public', display: 'Public' }, { value: 'private', display: 'Private' }];
    selectedView: string = 'all';
    refsetGridApi: any;
    refsetGridColumnApi: any;
    columnDefs = [];
    refsetGridColumns = [{name: 'information', show: true}, {name: 'refsetId', show: true}];
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
	versionStatuses: any;
	versions: any;
	editions: any;
	organizations: any;
    initialGridWidth: number;
    showFullNarrativeText = false;
    showFullNotesText = false;
    showLoadingSpinner = false;

    @ViewChild('directoryInfoDialog') infoDialog: TemplateRef<any>;
    @ViewChild('directoryFeedbackDialog') feedbackDialog: TemplateRef<any>;
    @ViewChild('directoryInfoSection') infoSection: TemplateRef<any>;
    @ViewChild('directoryNameSection') nameSection: TemplateRef<any>;
    @ViewChild('directoryEditionSection') editionSection: TemplateRef<any>;
    @ViewChild('directoryActionSection') actionSection: TemplateRef<any>;
    @ViewChild('directoryPaging') paginationComponent: PaginationComponent;
    @ViewChild('directoryCategoryFilter') categoryFilter: TemplateRef<any>;
    toggleDropdown = false;
    numOfResults: any;
    directUrl: string;
    numOfMembers: any;
    //@ViewChild('directorySearchInput') searchInput: PaginationComponent;

    constructor(
        private router: Router,
        private titleService: Title,
        private dialogFactoryService: DialogFactoryService,
        private refsetService: RefsetService,
        private changeDetectorRef: ChangeDetectorRef,
        private breadcrumbService: BreadcrumbService
    ) {
        refsetService.getTaxonomyRoot();
    }

    //***** Framework Functions *****/
    ngOnInit() {

        this.showLoadingSpinner = true;
        this.titleService.setTitle('Refset Tool - Refset Directory');
        this.breadcrumbService.setBreadcrumbs([{ label: 'Directory' }]);
    }

    ngAfterViewInit() {

		forkJoin(this.refsetService.getVersionStatuses(), this.refsetService.getVersions(), this.refsetService.getEditions(), this.refsetService.getOrganizations()).
            subscribe({next: ([results, versionResults, editionResults, organizationResults]) => {

                this.versionStatuses = results;
                let versionStatusArray = this.versionStatuses?.items;
                this.versions = versionResults;
                let versionsArray = this.versions?.items;
                this.editions = editionResults;
                let editionsArray = this.editions?.items;
                this.organizations = organizationResults;
                let organizationsArray = this.organizations?.items;
                
                this.columnDefs = [
                    { field: 'id', tooltipField: 'id', colId: 'information', headerName: '', width: 65, cellClass: 'refset-tool-directory-column-information', cellRenderer: 'templateRenderer', cellRendererParams: { template: this.infoSection }, filter: false, pinned: 'left'},
                    { field: 'refsetId', tooltipField: 'refsetId', headerName: 'Refset ID', cellClass: 'refset-tool-directory-column-id', flex: 1, minWidth: 155},
                    { field: 'name', tooltipField: 'name', headerName: 'Refset Name', cellClass: 'refset-tool-directory-column-name', flex: 1, minWidth: 550, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.nameSection }, sort: 'asc' },
                    { field: 'editionName', tooltipField: 'editionName', headerName: 'Edition/Extension', cellClass: 'refset-tool-directory-column-edition', flex: 1, minWidth: 170, valueGetter: this.editionValueGetter, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.editionSection }, floatingFilterComponent: 'categoryFilterComponent',
                floatingFilterComponentParams: {suppressFilterButton: true, names: editionsArray}},
                    { field: 'organizationName', tooltipField: 'organizationName', headerName: 'Organization/Owner', cellClass: 'refset-tool-directory-column-organization', flex: 1, minWidth: 180, floatingFilterComponent: 'categoryFilterComponent',
                floatingFilterComponentParams: {suppressFilterButton: true, names: organizationsArray}},
                    { field: 'versionStatus', tooltipField: 'versionStatus', headerName: 'Version Status', cellClass: 'refset-tool-directory-column-version-status', flex: 1, minWidth: 150, floatingFilterComponent: 'categoryFilterComponent',
                floatingFilterComponentParams: {suppressFilterButton: true, names: versionStatusArray}},
                    { field: 'versionDate', tooltipField: 'versionDate', headerName: 'Version Date', cellClass: 'refset-tool-directory-column-version-date', flex: 1, minWidth: 140, valueGetter: UiUtility.gridDateValueGetter , floatingFilterComponent: 'categoryFilterComponent',
                floatingFilterComponentParams: {suppressFilterButton: true, names: versionsArray}},
                    { field: 'modified', tooltipField: 'modified', headerName: 'Last Modified Date', cellClass: 'refset-tool-directory-column-modified-date', flex: 1, minWidth: 180, valueGetter: UiUtility.gridDateValueGetter, floatingFilterComponent: 'dateTextFilterComponent',
                    floatingFilterComponentParams: {suppressFilterButton: true}},
                    { field: 'downloadable', tooltipField: 'downloadable', colId: 'actions', headerName: '', width: 70, cellClass: 'refset-tool-directory-column-actions', cellRenderer: 'templateRenderer', cellRendererParams: { template: this.actionSection }, filter: false, pinned: 'right'}
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
                    enableBrowserTooltips: true,
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
                        'refset_tool_grid_inactive_row': function(params) {

                            var inactivatedRow = false;

                            if (params.data){
                                inactivatedRow = params.data.active == false;
                            }

                            return inactivatedRow;
                        }
                    }
                };

                this.showTable = true
                this.changeDetectorRef.detectChanges();
                // this.overrideHeaderScroll();
            },
            error: (error) => {
                this.showLoadingSpinner = true;
            }}
        );
    }

    showDropdown(): void {
        if (!this.toggleDropdown) {
            this.toggleDropdown = true;
        } else {
            this.toggleDropdown = false;
        }
    }

    //***** AG Grid Functions *****/
    onGridReady = (gridReadyParams) => {
        this.refsetGridApi = gridReadyParams.api;
        this.refsetGridColumnApi = gridReadyParams.columnApi;
        this.onResize(undefined);
        let dataSource = {
            rowCount: null,
            getRows: (rowParams) => {

                this.refsetGridApi.showLoadingOverlay();

                let pageNumber = rowParams.endRow / this.refsetGridApi.paginationGetPageSize();
                let query = UiUtility.formatFilterData(rowParams.filterModel);
                let sort = UiUtility.formatSortData(rowParams.sortModel);

                if (this.selectedView === 'public') {
                    query = CodeUtility.addIfNotEmpty(query, ' AND ') + 'privateRefset: false';
                } else if (this.selectedView === 'private') {
                    query = CodeUtility.addIfNotEmpty(query, ' AND ') + 'privateRefset: true';
                }

                if (CodeUtility.hasValue(this.searchInput) && this.searchInput.length > 2) {
                    query = CodeUtility.addIfNotEmpty(query, ' AND ') + this.searchInput;
                }

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

                let restParams: any = {
                    limit: this.refsetGridApi.paginationGetPageSize(),
                    offset: (pageNumber - 1) * this.refsetGridApi.paginationGetPageSize(),
                    searchConcepts: true,
                    showInDevelopment: false,
                    sortModel: rowParams.sortModel, //not needed once we get rid of mocking the backend
                    filterModel: rowParams.filterModel, //not needed once we get rid of mocking the backend
                };

                if (CodeUtility.hasValue(query)) {

                    query = query.replace(/\//g, '%2F').replace(/\%/g, '%25');
                    restParams.query = query;
                }

                this.refsetService.getRefsets({ ...restParams, ...sort }).subscribe({next: (results) => {

                    this.numOfMembers = this.numOfMembers ? this.numOfMembers : results.total;
                    this.numOfResults = results.total;

                    if (results.items.length == 0 && pageNumber > 1) {

                        this.refsetGridPaging.totalRows = this.refsetGridApi.paginationGetPageSize() * (pageNumber - 1);
                        this.refsetGridPaging.totalKnown = true;
                        this.paginationComponent.goToPage(pageNumber - 1);
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

                                currentRowCount = data.length + (pageNumber - 1) * this.refsetGridApi.paginationGetPageSize();
                                lastRow = currentRowCount;
                            }

                            this.refsetGridPaging.totalRows = lastRow;
                            this.refsetGridPaging.totalKnown = true;

                        } else {
                            currentRowCount = data.length + (pageNumber - 1) * this.refsetGridApi.paginationGetPageSize();
                        }

                        rowParams.successCallback(data, lastRow);

                    } else {

                        this.refsetGridApi.showNoRowsOverlay();
                        rowParams.successCallback([], 0);
                    }

                    this.refsetGridPaging.manualStateRefresh = new Boolean(true); 
                    this.showLoadingSpinner = false;
                },
                error: (error) => {

                    this.refsetGridApi.showNoRowsOverlay();
                    rowParams.successCallback([], 0);
                }});
            }
        };

        gridReadyParams.api.setDatasource(dataSource);

        // set placeholders on the grid floating filter fields
        Array.from(document.querySelectorAll('.ag-floating-filter-full-body .ag-input-field-input')).forEach((obj: any) => {

            if (obj.attributes['disabled']) {
                // skip columns with disabled filter
                return;
            }

            let label = obj.getAttribute('aria-label');
            let value = label.substring(0, label.indexOf('Filter Input')) + '...';
            obj.setAttribute('placeholder', value);
        });
    };

    editionValueGetter = function (params) {

        if (!CodeUtility.hasValue(params?.data)) {
            return '';
        }

        let flagIcon = RefsetUtility.getEditionFlagIcon(params?.data?.edition?.branch);
        params.data.flagIcon = flagIcon;
        return params?.data?.edition?.name;
    };

    onGridCellClick = (event) => {
        if (
            event.column.colId === 'information' ||
            event.column.colId === 'actions'
        ) {
        } else {
            let selectedRows = this.refsetGridApi.getSelectedRows();
            let selectedId: string;

            selectedRows.forEach(function (selectedRow, index) {
                selectedId = selectedRow.id;
            });

            this.goToDetailsPage(selectedId);
        }
    };

    @Debounce()
    changedViewFilter() {
        this.refsetGridApi.purgeInfiniteCache();
    }

    //***** General Functions *****/

    openEclBuilder(fieldId) {
        UiUtility.openEclBuilder(fieldId, "MAIN");
    }

    goToDetailsPage(refsetId){
        this.router.navigate(['/details', refsetId]);
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

        let refset = this.getRefsetRow(refsetId);
        this.refsetService.getRefset(refset.id).subscribe((results) => {
            refset.descriptions = results.descriptions;
        const dialogId = 'directoryInfoDialog';
        this.directUrl = (window.location.host + this.router.url).replace("directory", "details/" + refset.id);

        if (CodeUtility.hasValue(refset)){

            refset.status = RefsetUtility.getStatus(refset.active);
            if (CodeUtility.hasValue(refset.narrative)){
                refset.narrativeShortText = refset.narrative;
            }

            if (CodeUtility.hasValue(refset.versionNotes)){
                refset.versionNotesShortText = refset.versionNotes;
            }

            refset.versionDate = CodeUtility.formatJsonDate(refset.versionDate);
            refset.flagIcon = RefsetUtility.getEditionFlagIcon(refset.edition.branch);
        }

        let tags = '';

        for (const tag of refset.tags){
            tags += tag + "; ";
        }

        //refset.tags = CodeUtility.removeFinal(tags, ';');
        const dialogData = {
            dialogId: dialogId,
            showCancel: false,
            cancelText: 'Close',
            confirmText: 'View Complete Refset',
            showTitle: false,
            template: this.infoDialog,
            data: refset,
            showCloseIcon: true
        }

        const dialogOptions = {
            id: dialogId,
            width: '1000px',
            disableClose: true
        }

        this.dialog = this.dialogFactoryService.open(dialogData, dialogOptions);

        this.dialog.confirmed().subscribe(data => {

            if (data) {
                this.goToDetailsPage(refset.id);
            }
            });
        });
    }

    openFeedback(refsetId: string) {

        let refset = this.getRefsetRow(refsetId);
        const dialogId = 'directoryFeedbackDialog';

        const dialogData = {
            headerText: `Refset Feedback for ${refset.name} (${refset.refsetId})`,
            template: this.feedbackDialog,
            data: refset
        }

        const dialogOptions = {
            id: dialogId
        }

        this.dialog = this.dialogFactoryService.open(dialogData);

        this.dialog.confirmed().subscribe(data => {

            if (data) {
                refset.feedback = data.feedback;
            }
        });
    }

    clearSearch() {

        if (this.searchInput != '') {

            this.searchInput = '';
            this.onSearchChange();
            this.paginationComponent.setPageSize(10);
        }
    }

    @Debounce()
    onSearchChange() {
        if (!CodeUtility.hasValue(this.searchInput) || (CodeUtility.hasValue(this.searchInput) && this.searchInput.length > 2)) {
            this.refsetGridApi.purgeInfiniteCache();
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
        let gridWidth = document.getElementsByClassName('refset-tool-ag-grid')[0].clientWidth;
        document.getElementsByClassName('ag-header')[0].setAttribute('style', `width: ${gridWidth}px;`);
    }

    setDescriptions(refsetData: any): Array<string> {
        return refsetData?.descriptions;
    }
}
