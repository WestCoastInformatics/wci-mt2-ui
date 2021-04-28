import { ChangeDetectorRef, Component, TemplateRef, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { DialogService } from 'src/app/dialog/services/dialog.service';
import { DialogFactoryService } from 'src/app/dialog/services/dialog-factory.service';
import { Observable } from 'rxjs';
import { AgGridAngular } from 'ag-grid-angular';
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { Title } from '@angular/platform-browser';
import { Refset } from 'src/app/models/refset';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { PaginationComponent } from 'src/app/components/pagination/pagination.component';


/**
 * @title Tree with nested nodes
 */
@Component({
    selector: 'app-refset-directory',
    templateUrl: 'refset-directory.html'
})

export class RefsetDirectory {

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

    @ViewChild('directoryInfoDialog') infoDialog: TemplateRef<any>;
    @ViewChild('directoryFeedbackDialog') feedbackDialog: TemplateRef<any>;
    @ViewChild('directoryInfoSection') infoSection: TemplateRef<any>;
    @ViewChild('directoryNameSection') nameSection: TemplateRef<any>;
    @ViewChild('directoryEditionSection') editionSection: TemplateRef<any>;
    @ViewChild('directoryActionSection') actionSection: TemplateRef<any>;
    @ViewChild('directoryPaging') paginationComponent: PaginationComponent;
    //@ViewChild('directorySearchInput') searchInput: PaginationComponent;


    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private titleService: Title,
        private dialogFactoryService: DialogFactoryService,
        private refsetService: RefsetService,
        private changeDetectorRef: ChangeDetectorRef,
        private breadcrumbService: BreadcrumbService
    ) {
    }

    //***** Framework Functions *****/
    ngOnInit() {

        this.titleService.setTitle('Refset Tool - Refset Directory');
        this.breadcrumbService.setBreadcrumbs([{label: 'Directory'}]);
    }

    ngAfterViewInit() {

        this.columnDefs = [
            { field: 'id', colId: 'information', headerName: '', width: 70, cellClass: 'refset-tool-directory-column-information', cellRenderer: 'templateRenderer', cellRendererParams: { template: this.infoSection }, filter: false },
            { field: 'refsetId', headerName: 'Refset ID', cellClass: 'refset-tool-directory-column-id' },
            { field: 'name', headerName: 'Refset Name', cellClass: 'refset-tool-directory-column-name', cellRenderer: 'templateRenderer', cellRendererParams: { template: this.nameSection } },
            { field: 'editionName', headerName: 'Edition/Extension', cellClass: 'refset-tool-directory-column-edition' },
            { field: 'organizationName', headerName: 'Organization/Owner', cellClass: 'refset-tool-directory-column-organization' },
            { field: 'versionStatus', headerName: 'Version Status', cellClass: 'refset-tool-directory-column-version-status' },
            { field: 'versionDate', headerName: 'Version Date', cellClass: 'refset-tool-directory-column-version-date', valueGetter: UiUtility.gridDateValueGetter },
            { field: 'modified', headerName: 'Last Modified Date', cellClass: 'refset-tool-directory-column-modified-date', valueGetter: UiUtility.gridDateValueGetter },
            { field: 'downloadable', colId: 'actions', headerName: '', width: 70, cellClass: 'refset-tool-directory-column-actions', cellRenderer: 'templateRenderer', cellRendererParams: { template: this.actionSection }, filter: false }
        ];

        this.refsetGridOptions = {
            context: { componentParent: this },
            pagination: true,
            onGridSizeChanged: UiUtility.resizeGridColumns,
            suppressColumnVirtualisation: true, // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
            suppressPaginationPanel: true,
            paginationPageSize: this.refsetGridPaging.pageSize,
            cacheBlockSize: this.refsetGridPaging.pageSize,
            maxBlocksInCache: 1,
            loadingCellRenderer: 'agLoadingOverlay',
            rowModelType: 'infinite',
            rowSelection: 'single',
            onCellClicked: this.onGridCellClick,
            onGridReady: this.onGridReady,
            frameworkComponents: {
                'templateRenderer': TemplateRenderer
            },
            defaultColDef: {
                sortable: true,
                resizable: true,
                filter: true,
                floatingFilter: true,
                floatingFilterComponentParams: { placeholder: 'Warehouses', suppressFilterButton: true },
                suppressMenu: false,
                menuTabs: ['columnsMenuTab']
            }
        };

        this.showTable = true
        this.changeDetectorRef.detectChanges();
    }

    //***** AG Grid Functions *****/
    onGridReady = (gridReadyParams) => {

        console.log("In onGridReady", this.actionSection);
        this.refsetGridApi = gridReadyParams.api;
        this.refsetGridColumnApi = gridReadyParams.columnApi;

        let dataSource = {
            rowCount: null,
            getRows: (rowParams) => {

                this.refsetGridApi.showLoadingOverlay();

                let pageNumber = rowParams.endRow / this.refsetGridApi.paginationGetPageSize();
                let query = UiUtility.formatFilterData(rowParams.filterModel);
                let sort = UiUtility.formatSortData(rowParams.sortModel);

                if (this.selectedView === 'public'){
                    query = CodeUtility.addIfNotEmpty(query, ' AND ') + 'privateRefset: false';
                } else if (this.selectedView === 'private'){
                    query = CodeUtility.addIfNotEmpty(query, ' AND ') + 'privateRefset: true';
                }

                console.log("^^^^^^ query after viewFilters: " + query);
                //query = CodeUtility.addIfNotEmpty(query, ' AND ') + this.searchInput;

                let newFilterString = query;
                let newSortString = JSON.stringify(sort);

                // if the filters or sort have changed then move to the first page
                if (newFilterString !== this.refsetGridLastFilter || newSortString !== this.refsetGridLastSort) {

                    pageNumber = 1;
                    this.refsetGridApi?.api?.paginationGoToPage(0);
                }

                // if the filters have changed then reset the total row variables
                if (newFilterString !== this.refsetGridLastFilter){

                    this.refsetGridPaging.totalRows = null;
                    this.refsetGridPaging.totalKnown = false;
                }

                this.refsetGridLastFilter = newFilterString;
                this.refsetGridLastSort = newSortString;

                let restParams = {
                    query: query,
                    limit: this.refsetGridApi.paginationGetPageSize(),
                    offset: pageNumber - 1,
                    sortModel: rowParams.sortModel, //not needed once we get rid of mocking the backend
                    filterModel: rowParams.filterModel, //not needed once we get rid of mocking the backend
                }

                console.log("^^^^^^ {...restParams, ...sort}: ", {...restParams, ...sort});

                this.refsetService.getRefsets({...restParams, ...sort}).subscribe(results => {

                    if (results.items.length == 0 && pageNumber > 1) {

                        this.refsetGridPaging.totalRows = (this.refsetGridApi.paginationGetPageSize() * (pageNumber - 1));
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

                                lastRow = results.totalResults;

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
                        
                        rowParams.successCallback(data, lastRow);
                    } else {

                        this.refsetGridApi.showNoRowsOverlay();
                        rowParams.successCallback(data, 0);
                    }

                    this.refsetGridPaging.manualStateRefresh = new Boolean(true);
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

    }

    onGridCellClick = (event) => {

        if (event.column.colId === 'information' || event.column.colId === 'actions') {


        } else {

            let selectedRows = this.refsetGridApi.getSelectedRows();
            let selectedId: string;
            console.log(selectedRows);

            selectedRows.forEach(function (selectedRow, index) {
                selectedId = selectedRow.id;
                console.log('Selected Row: ' + selectedRow.refsetId);
            });

            this.goToDetailsPage(selectedId);
        }
    }

    changedViewFilter() {
        this.refsetGridApi.purgeInfiniteCache();
    }

    //***** General Functions *****/

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
        const dialogId = 'directoryInfoDialog';

        if (CodeUtility.hasValue(refset)){

            if (CodeUtility.hasValue(refset.narrative)){
                refset.narrativeShortText = CodeUtility.textOverflow(CodeUtility.stripHtml(refset.narrative), 25);
            }

            if (CodeUtility.hasValue(refset.versionNotes)){
                refset.versionNotesShortText = CodeUtility.textOverflow(CodeUtility.stripHtml(refset.versionNotes), 25);
            }

            refset.versionDate = CodeUtility.formatJsonDate(refset.versionDate);
        }

        let tags = '';

        for (const tag of refset.tags){
            tags += tag + "; ";
        }

        //refset.tags = CodeUtility.removeFinal(tags, ';');
        const dialogData = {
            dialogId: dialogId,
            showCancel: true,
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
            disableClose: false
        }

        this.dialog = this.dialogFactoryService.open(dialogData, dialogOptions);

        this.dialog.confirmed().subscribe(data => {

            this.goToDetailsPage(refset.id);
        });
    }

    openFeedback(refsetId: string) {

        let refset = this.getRefsetRow(refsetId);
        const dialogId = 'directoryFeedbackDialog';

        const dialogData = {
            headerText: `Refset Feedback for ${refset.name} (${refset.id})`,
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
        }
    }

    onSearchChange() {
        this.refsetGridApi.purgeInfiniteCache();
    }

}