import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';

@Component({
    selector: 'audit-trail-list',
    templateUrl: './audit-trail-list.component.html'
})
export class AuditTrailListComponent implements OnInit, AfterViewInit {


    isResolved = false;
    columnDefs = [

    ];

    data = [
        {'date': '2019-03-12 at 06:11:35', 'modifiedBy': 'TestUser', 'message': 'Workflow action', 'details': 'FINISH as AUTHOR on refset 8533297'},
        {'date': '2019-03-12 at  01:46:11', 'modifiedBy': 'TestUser', 'message': 'Workflow action', 'details': 'ASSIGN as REVIEWER on refset 8533297'},
        {'date': '2018-03-12 at 16:55:01', 'modifiedBy': 'TestUser', 'message': 'Upgrade refset', 'details': 'Upgrade refset 8533297'},
        {'date': '2018-03-11 at 14:45:28', 'modifiedBy': 'TestUser', 'message': 'Clone refset', 'details': 'Clone from refset 8533297 to refset 7896523'},
        {'date': '2020-07-20 at 16:06:50', 'modifiedBy': 'TestUser', 'message': 'Begin refset release', 'details': 'Begin release 8533297'},
        {'date': '2020-07-20 at 15:00:12', 'modifiedBy': 'TestUser', 'message': 'Add member', 'details': 'Add Member 5216742 to refset 8533297'},
        {'date': '2018-03-11 at 14:45:28', 'modifiedBy': 'TestUser', 'message': 'Clone refset', 'details': 'Clone from refset 8533297 to refset 7896523'},
        {'date': '2020-07-20 at 16:06:50', 'modifiedBy': 'TestUser', 'message': 'Begin refset release', 'details': 'Begin release 8533297'},
        {'date': '2020-07-20 at 15:00:12', 'modifiedBy': 'TestUser', 'message': 'Add member', 'details': 'Add Member 5216742 to refset 8533297'},
        {'date': '2018-03-11 at 14:45:28', 'modifiedBy': 'TestUser', 'message': 'Clone refset', 'details': 'Clone from refset 8533297 to refset 7896523'},
        {'date': '2020-07-20 at 16:06:50', 'modifiedBy': 'TestUser', 'message': 'Begin refset release', 'details': 'Begin release 8533297'},
        {'date': '2020-07-20 at 15:00:12', 'modifiedBy': 'TestUser', 'message': 'Add member', 'details': 'Add Member 5216742 to refset 8533297'},
        {'date': '2018-03-11 at 14:45:28', 'modifiedBy': 'TestUser', 'message': 'Clone refset', 'details': 'Clone from refset 8533297 to refset 7896523'}
    ];

    gridApi: any;
    gridColumnDefs = [];
    gridOptions: any;
    gridPaging = { pageSize: 6, pageSizeOptions: [6, 10, 25, 50, 100], totalKnown: false, totalRows: null, manualStateRefresh: new Boolean(true) };
    showTable: boolean = false;

    @Input() refsetInternalId: string;
    @ViewChild('detailsSection') detailsSection: TemplateRef<any>;

    constructor(private route: ActivatedRoute, private readonly modalService: NgbModal, private refsetService: RefsetService,
        private changeDetectorRef: ChangeDetectorRef) { }

    ngOnInit(): void {
        this.columnDefs = [
        { field: 'date', headerName: 'Date', unSortIcon: true, sortable: true },
        { field: 'modifiedBy', headerName: 'Modified By', unSortIcon: true, sortable: true },
        { field: 'message', headerName: 'Message', unSortIcon: true, sortable: true },
        { field: 'details', headerName: 'Details', minWidth: 550 }]; //, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.descriptionSection }

        this.gridOptions = {
            context: { componentParent: this },
            pagination: true,
            suppressColumnVirtualisation: false, // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
            // suppressPaginationPanel: true,
            paginationPageSize: this.gridPaging.pageSize,
            enableCellTextSelection: true,
            // onCellClicked: this.onGridCellClick,
            onGridReady: this.onGridReady,
            onFilterChanged: function () {
                if (this.api.getDisplayedRowCount() === 0) {
                    this.api.showNoRowsOverlay();
                } else {
                    this.api.hideOverlay();
                };
            },
            frameworkComponents: {
                'templateRenderer': TemplateRenderer,
            },
            defaultColDef: {
                sortable: true,
                resizable: true,
                suppressMenu: true,
                flex: 1,
                filter: true,
                floatingFilter: true,
                floatingFilterComponentParams: { placeholder: '', suppressFilterButton: true },
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
    }

    ngAfterViewInit(): void {
        this.showTable = true;


        this.gridColumnDefs = [

        ];
    }

    onGridReady = (gridReadyParams) => {

        this.gridApi = gridReadyParams.api;
        // this.columnDefs[4].cellRendererParams = { template: this.descriptionSection };
        // this.gridApi.setColumnDefs(this.columnDefs);
        // let conceptId = null;

        // if (CodeUtility.hasValue(this.conceptId)) {
        // 	conceptId = this.conceptId;
        // }
        return;

        this.refsetService.getArtifacts(this.refsetInternalId, '?limit=500&offset=0&sort=modified&sortAscending=false').subscribe({
            next: (results) => {

                results.total = results.items.length;
                results.totalKnown = true;
                // this.threadsData = results.items;
                let pageNumber = 1;

                if (results.items.length == 0) {
                    this.gridApi.showNoRowsOverlay();
                    this.gridApi.setRowData([]);

                    if (pageNumber > 1) {

                        this.gridPaging.totalRows = this.gridApi.paginationGetPageSize() * (pageNumber - 1);
                        this.gridPaging.totalKnown = true;
                        // this.paginationComponent.goToPage(pageNumber - 1);
                    }

                    return;
                }

                // UiUtility.applyServerPagedGridResults(results, this.gridApi, this.gridPaging, pageNumber, null, false);
            },
            error: (error) => {

                this.gridApi.showNoRowsOverlay();
                this.gridApi.setRowData([]);
            }
        });
    }

    onGridCellClick = (event) => {

    }

    
}
