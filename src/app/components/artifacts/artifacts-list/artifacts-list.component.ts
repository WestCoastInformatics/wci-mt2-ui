import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';
import { UiUtility } from '../../../utilities/ui.utility';
import { CodeUtility } from '../../../utilities/code.utility';
import { PaginationComponent } from '../../pagination/pagination.component';
import { ArtifactsService } from '../../../services/rest/artifacts.service';
import { DateTextFilterComponent } from '../../dateTextFilter/date-text-filter.component';

@Component({
    selector: 'artifacts-list',
    templateUrl: './artifacts-list.component.html'
})
export class ArtifactsListComponent implements OnInit, AfterViewInit {

    columnDefs = [];

    data: any;

    gridApi: any;
    gridColumnDefs = [];
    gridOptions: any;
    gridPaging = { pageSize: 10, pageSizeOptions: [10, 25, 50, 100], totalKnown: false, totalRows: null, manualStateRefresh: true };
    gridLastFilter = '';
    gridLastSort = '';
    datasource: any;
    showTable = false;
    showPaging = false;

    @Input() refsetInternalId: string;
    @Input() refset: any;
    @Output() downloadSelected: EventEmitter<any> = new EventEmitter();
    @ViewChild('pagination') paginationComponent: PaginationComponent;
    @ViewChild('descriptionSection') descriptionSection: TemplateRef<any>;
    @ViewChild('actionsSection') actionsSection: TemplateRef<any>;

    constructor(private readonly modalService: NgbModal, private artifactsService: ArtifactsService) {
    }

    get serviceUrl(): string {
        return this.artifactsService.contextPath.replace(/\/+$/, '');
    }

    get canAdd(): boolean {
        return this.refset?.roles.includes('AUTHOR') || this.refset?.roles.includes('ADMIN');
    }

    ngOnInit(): void {
        this.columnDefs = [
            {
                field: 'fileName',
                headerName: 'Name',
                flex: 1,
                unSortIcon: true,
                sortable: true,
                minWidth: 110
            },
            { field: 'fileType', headerName: 'Type', unSortIcon: true, sortable: true, minWidth: 110, flex: 1 },
            { field: 'modifiedBy', headerName: 'Uploaded By', unSortIcon: true, flex: 2, sortable: true },
            {
                field: 'created',
                tooltipField: 'Uploaded Date',
                headerName: 'Uploaded Date',
                unSortIcon: true,
                sortable: true,
                flex: 2,
                sort: 'desc',
                valueFormat: CodeUtility.DATE_FORMAT_REVERSE_WITH_TIME,
                valueGetter: UiUtility.gridDateValueGetter,
                floatingFilterComponent: 'dateTextFilterComponent'
            },
            { field: 'description', headerName: 'Description', minWidth: 250, flex: 4, width: 550 },
            {
                field: 'id',
                headerName: '',
                filter: false,
                sortable: false,
                flex: 1,
                cellRenderer: 'templateRenderer',
                resizable: false,
                cellRendererParams: { template: this.actionsSection }, maxWidth: 110
            }];
        // , cellRenderer: 'templateRenderer', cellRendererParams: { template: this.descriptionSection }

        this.gridOptions = {
            context: { componentParent: this },
            pagination: true,
            suppressColumnVirtualisation: true,
            // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
            suppressPaginationPanel: true,
            cacheBlockSize: this.gridPaging.pageSize,
            maxBlocksInCache: 1,
            rowModelType: 'infinite',
            enableCellTextSelection: true,
            // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
            // suppressPaginationPanel: true,
            paginationPageSize: this.gridPaging.pageSize,
            // onCellClicked: this.onGridCellClick,
            onGridReady: this.onGridReady,
            onFilterChanged: function () {
                if (this.api.getDisplayedRowCount() === 0) {
                    this.api.showNoRowsOverlay();
                } else {
                    this.api.hideOverlay();
                }
            },
            frameworkComponents: {
                'templateRenderer': TemplateRenderer,
                dateTextFilterComponent: DateTextFilterComponent
            },
            defaultColDef: {
                sortable: true,
                resizable: true,
                suppressMenu: true,
                sortingOrder: ['asc', 'desc'],
                flex: 1,
                filterParams: {
                    debounceMs: 2000
                },
                floatingFilter: true,
                floatingFilterComponentParams: { placeholder: '', suppressFilterButton: true, debounceMs: 2000 },
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
    }

    ngAfterViewInit(): void {
        this.showTable = true;


        this.gridColumnDefs = [];
    }

    onGridReady = (gridReadyParams) => {

        this.gridApi = gridReadyParams.api;
        this.columnDefs[4].cellRendererParams = { template: this.descriptionSection };
        this.columnDefs[5].cellRendererParams = { template: this.actionsSection };
        this.gridApi.setColumnDefs(this.columnDefs);

        this.onResize(undefined);
        this.datasource = {
            rowCount: null,
            getRows: (rowParams) => {

                this.gridApi.showLoadingOverlay();
                // this.showLoadingSpinner = true;

                let pageNumber = rowParams.endRow / this.gridApi.paginationGetPageSize();
                let query = UiUtility.formatFilterData(rowParams.filterModel);
                const sort = UiUtility.formatSortData(rowParams.sortModel);

                const newFilterString = query;
                const newSortString = JSON.stringify(sort);

                // if the filters or sort have changed then move to the first page
                if (newFilterString !== this.gridLastFilter || newSortString !== this.gridLastSort) {

                    pageNumber = 1;
                    this.gridApi?.api?.paginationGoToPage(0);
                }

                // if the filters have changed then reset the total row variables
                if (newFilterString !== this.gridLastFilter) {

                    this.gridPaging.totalRows = null;
                    this.gridPaging.totalKnown = false;
                }

                this.gridLastFilter = newFilterString;
                this.gridLastSort = newSortString;

                const restParams: any = {
                    limit: this.gridApi.paginationGetPageSize(),
                    offset: (pageNumber - 1) * this.gridApi.paginationGetPageSize(),
                    sortModel: rowParams.sortModel, // not needed once we get rid of mocking the backend
                    filterModel: rowParams.filterModel, // not needed once we get rid of mocking the backend
                };
                const refsetFilter = `entityId:${this.refsetInternalId} AND entityType:REFSET`;
                if (CodeUtility.hasValue(query)) {
                    query += ` AND ${refsetFilter}`;
                } else {
                    query = refsetFilter;
                }
                query = query.replace(/\//g, '%2F').replace(/%/g, '%25');
                restParams.query = query;
                this.artifactsService.getArtifacts({ ...restParams, ...sort }).subscribe({
                    next: (results) => {
                        this.showPaging = results.total > 0;
                        if (results.items.length === 0 && pageNumber > 1) {

                            this.gridPaging.totalRows = this.gridApi.paginationGetPageSize() * (pageNumber - 1);
                            this.gridPaging.totalKnown = true;
                            this.paginationComponent.goToPage(pageNumber - 1);
                            return;
                        }

                        const data = results.items;
                        this.data = data;
                        if (results.total) {
                            results.totalKnown = true;
                        }
                        if (data?.length > 0) {

                            this.gridApi.hideOverlay();
                            let currentRowCount = null;
                            let lastRow = -1;

                            if (results.totalKnown || data.length < this.gridApi.paginationGetPageSize() || this.gridPaging.totalKnown) {

                                if (results.totalKnown) {
                                    lastRow = results.total;

                                } else if (this.gridPaging.totalKnown) {
                                    lastRow = this.gridPaging.totalRows;

                                } else {

                                    currentRowCount = data.length + (pageNumber - 1) * this.gridApi.paginationGetPageSize();
                                    lastRow = currentRowCount;
                                }

                                this.gridPaging.totalRows = lastRow;
                                this.gridPaging.totalKnown = true;

                            } else {
                                currentRowCount = data.length + (pageNumber - 1) * this.gridApi.paginationGetPageSize();
                            }


                            rowParams.successCallback(data, lastRow);

                        } else {

                            this.gridApi.showNoRowsOverlay();
                            rowParams.successCallback([], 0);
                        }

                        this.gridPaging.manualStateRefresh = Boolean(true);
                    },
                    error: (error) => {

                        this.gridApi.showNoRowsOverlay();
                        rowParams.successCallback([], 0);
                    }
                });
            }
        };

        gridReadyParams.api.setDatasource(this.datasource);

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

    onGridCellClick = (event) => {

        // this.selectedThread = event.data;
        // this.openThreadModal();
    }

    openArtifactsModal(artifactsDialog: NgbModal) {
        this.modalService.open(artifactsDialog, {
            // backdrop : 'static',
            // keyboard : false,
            modalDialogClass: 'full-modal',
            centered: true,
            windowClass: 'artifact-modal'
        });
    }

    onReload() {
        this.gridApi.setDatasource(this.datasource);
    }

    onDownloadSelected() {
        this.downloadSelected.emit(this.gridApi.getSelectedRows());
    }

    onResize(event) {
        const gridWidth = document.getElementsByClassName('refset-tool-ag-grid')[0]?.clientWidth;
        document.getElementsByClassName('ag-header')[0].setAttribute('style', `width: ${gridWidth}px;`);
    }

    formatDate(date) {
        return CodeUtility.formatJsonDate(date, CodeUtility.DATE_FORMAT_REVERSE);
    }
}
