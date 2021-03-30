import { ChangeDetectorRef, Component, TemplateRef, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
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
    refsetGridOptions: any;
    refsetGridPaging = {
        pageSize: 10,
        pageSizeOptions: [10, 25, 50, 100]
    };
    pageEvent: PageEvent;
    showTable: boolean;
    refsetData: any;
    dialog: DialogService;

    @ViewChild('directoryInfoDialog') infoDialog: TemplateRef<any>;
    @ViewChild('directoryDownloadDialog') downloadDialog: TemplateRef<any>;
    @ViewChild('directoryFeedbackDialog') feedbackDialog: TemplateRef<any>;
    @ViewChild('directoryInfoSection') infoSection: TemplateRef<any>;
    @ViewChild('directoryNameSection') nameSection: TemplateRef<any>;
    @ViewChild('directoryEditionSection') editionSection: TemplateRef<any>;
    @ViewChild('directoryActionSection') actionSection: TemplateRef<any>;
    @ViewChild(MatPaginator) paginator: MatPaginator;


    constructor(
        private titleService: Title,
        private dialogFactoryService: DialogFactoryService,
        private refsetService: RefsetService,
        private changeDetectorRef: ChangeDetectorRef
    ) {
    }

    //***** Framework Functions *****/
    ngOnInit() {

        this.titleService.setTitle('Refset Tool - Refset Directory');
        this.showTable = false;
    }

    ngAfterViewInit() {

        this.columnDefs = [
            { field: 'id', colId: 'information', headerName: '', cellRenderer: 'templateRenderer', width: 70, cellClass: 'refset-tool-directory-column-information', cellRendererParams: { template: this.infoSection }, filter: false },
            { field: 'refsetId', headerName: 'Refset ID', cellClass: 'refset-tool-directory-column-id' },
            { field: 'name', headerName: 'Refset Name', cellRenderer: 'templateRenderer', cellClass: 'refset-tool-directory-column-name', cellRendererParams: { template: this.nameSection } },
            { field: 'edition', headerName: 'Edition/Extension', cellClass: 'refset-tool-directory-column-edition', cellRenderer: 'templateRenderer', cellRendererParams: { template: this.editionSection } },
            { field: 'organization', headerName: 'Organization/Owner', cellClass: 'refset-tool-directory-column-organization' },
            { field: 'versionStatus', headerName: 'Version Status', cellClass: 'refset-tool-directory-column-version-status' },
            { field: 'versionDate', headerName: 'Version Date', cellClass: 'refset-tool-directory-column-version-date' },
            { field: 'modified', headerName: 'Last Modified Date', cellClass: 'refset-tool-directory-column-modified-date' },
            { field: 'downloadable', colId: 'actions', headerName: '', cellRenderer: 'templateRenderer', width: 70, cellClass: 'refset-tool-directory-column-actions', cellRendererParams: { template: this.actionSection }, filter: false }
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
                suppressMenu: true
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
                let viewFilter = ''

                if (this.selectedView === 'public'){
                    viewFilter = 'privateRefset: false';
                } else {
                    viewFilter = 'privateRefset: true';
                }

                query = CodeUtility.addIfNotEmpty(query, ' AND ') + viewFilter;
                query = CodeUtility.addIfNotEmpty(query, ' AND ') + this.searchInput;

                let restParams = {
                    query: query,
                    sortModel: rowParams.sortModel,
                    limit: this.refsetGridApi.paginationGetPageSize(),
                    offset: pageNumber
                }

                this.refsetService.getRefsets(restParams).subscribe(results => {

                    let data = results.items;
                    this.refsetData = data;

                    if (data.length > 0) {

                        this.refsetGridApi.hideOverlay();
                        let currentRowCount = null;
                        let lastRow = -1;

                        if (results.totalKnown || data.length < this.refsetGridApi.paginationGetPageSize()) {

                            if (results.totalKnown) {

                                lastRow = results.totalResults;
                            } else {

                                currentRowCount = data.length + ((pageNumber - 1) * this.refsetGridApi.paginationGetPageSize());
                                lastRow = currentRowCount;
                            }
                        } else {
                            currentRowCount = data.length + ((pageNumber - 1) * this.refsetGridApi.paginationGetPageSize());
                        }
                        
                        rowParams.successCallback(data, lastRow);
                    } else {

                        this.refsetGridApi.showNoRowsOverlay();
                        rowParams.successCallback(data, 0);
                    }
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

        if (event.column.colId === 'private' || event.column.colId === 'canDownload') {


        } else {

            let selectedRows = this.refsetGridApi.getSelectedRows();
            console.log(selectedRows);

            selectedRows.forEach(function (selectedRow, index) {
                console.log('Selected Row: ' + selectedRow.refsetId);
            });
        }
    }

    changedViewFilter() {
        this.refsetGridApi.purgeInfiniteCache();
    }

    //***** General Functions *****/
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
            disableClose: false
        }

        this.dialog = this.dialogFactoryService.open(dialogData, dialogOptions);
    }

    openDownload(refsetId: string) {

        let refset = this.getRefsetRow(refsetId);
        const dialogId = 'directoryInfoDialog';

        const dialogData = {
            dialogId: dialogId,
            headerText: `Download Refset ${refset.name} (${refset.refsetId})`,
            showCancel: false,
            template: this.downloadDialog,
            data: refset
        }

        const dialogOptions = {
            id: dialogId,
            disableClose: false
        }

        this.dialog = this.dialogFactoryService.open(dialogData, dialogOptions);
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

}