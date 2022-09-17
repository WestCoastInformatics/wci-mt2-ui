import { AfterViewInit, ChangeDetectorRef, Component, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';
import { UiUtility } from '../../../utilities/ui.utility';
import { CodeUtility } from '../../../utilities/code.utility';
import { PaginationComponent } from '../../pagination/pagination.component';
import { AuditService } from 'src/app/services/rest/audit.service';
import { DateTextFilterComponent } from '../../dateTextFilter/date-text-filter.component';

@Component({
    selector: 'audit-trail-list',
    templateUrl: './audit-trail-list.component.html'
})
export class AuditTrailListComponent implements OnInit, AfterViewInit {


    columnDefs = [];

    data: any;

    gridApi: any;
    gridColumnDefs = [];
    gridOptions: any;
    gridPaging = {
        pageSize: 10, pageSizeOptions: [10, 25, 50, 100], totalKnown: false, totalRows: null,
        manualStateRefresh: Boolean(true)
    };
    gridColumnApi: any;
    gridLastFilter = '';
    gridLastSort = '';
    showTable = false;
    showPaging = false;

    @Input() refsetInternalId: string;
    @ViewChild('detailsSection') detailsSection: TemplateRef<any>;
    @ViewChild('pagination') paginationComponent: PaginationComponent;

    constructor(private route: ActivatedRoute, private readonly modalService: NgbModal, private auditService: AuditService,
        private changeDetectorRef: ChangeDetectorRef) {
    }

    ngOnInit(): void {
        this.columnDefs = [
            {
                field: 'created', headerName: 'Date', unSortIcon: true, sortable: true, sortingOrder: ['desc', 'asc', null],
                filterParams: { debounceMs: 2000 }, floatingFilterComponentParams: { debounceMs: 2000 },
                valueFormat: CodeUtility.DATE_FORMAT_REVERSE_WITH_TIME, valueGetter: UiUtility.gridDateValueGetter, floatingFilterComponent: 'dateTextFilterComponent'
            },
            { field: 'modifiedBy', headerName: 'Modified By', unSortIcon: true, sortable: true, sort: 'desc' },
            { field: 'message', headerName: 'Message', unSortIcon: true, sortable: true },
            { field: 'details', headerName: 'Details', minWidth: 550, sortable: false }];

        this.gridOptions = {
            context: { componentParent: this },
            pagination: true,
            // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
            suppressColumnVirtualisation: true,
            suppressPaginationPanel: true,
            cacheBlockSize: this.gridPaging.pageSize,
            maxBlocksInCache: 1,
            rowModelType: 'infinite',
            enableCellTextSelection: true,
            // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
            paginationPageSize: this.gridPaging.pageSize,
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
                filter: true,
                floatingFilter: true,
                floatingFilterComponentParams: { placeholder: '', suppressFilterButton: true, debounceMs: 100 },
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
        this.gridColumnApi = gridReadyParams.columnApi;
        const sortModel = [
            { colId: 'created', sort: 'desc' }
        ];
        this.gridApi.setSortModel(sortModel);
        this.onResize(undefined);
        const dataSource = {
            rowCount: null,
            getRows: (rowParams) => {

                this.gridApi.showLoadingOverlay();

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
                query = query.replace(/\//g, '%2F').replace(/%/g, '%25');
                restParams.query = query;
                this.auditService.getRefsetAuditTrial(this.refsetInternalId, { ...restParams, ...sort }).subscribe({
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

    formatDate(date) {
        return CodeUtility.formatJsonDate(date, CodeUtility.DATE_FORMAT_REVERSE_WITH_TIME);
    }
}
