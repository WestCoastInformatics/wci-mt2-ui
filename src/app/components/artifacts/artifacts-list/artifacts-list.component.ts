import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';

@Component({
    selector: 'artifacts-list',
    templateUrl: './artifacts-list.component.html'
})
export class ArtifactsListComponent implements OnInit, AfterViewInit {


    isResolved = false;
    columnDefs = [

    ];

    data = [
        { id: 1, name: 'File 1', type: 'XLS', uploader: 'Tim', uploaded: '2020-02-14 UTC at 16:05:22', description: 'List of concepts we must be in Refset based on ECL', checked: false },
        { id: 2, name: 'File 2', type: 'TXT', uploader: 'Eza', uploaded: '2020-02-14 UTC at 16:05:22', description: 'We listed the expected ECL in this file', checked: false },
        { id: 3, name: 'File 3', type: 'DOC', uploader: 'Tim', uploaded: '2020-02-14 UTC at 16:05:22', description: 'New additions for the laboratory tests', checked: false },
        { id: 4, name: 'File 4', type: 'XLS', uploader: 'Wendy', uploaded: '2020-02-14 UTC at 16:05:22', description: 'Checking US descriptions for medications, new additions for laboratory tests, Upgraded the expected ECL in this file', checked: false },
        { id: 5, name: 'File 5', type: 'PDF', uploader: 'Jesse', uploaded: '2020-02-14 UTC at 16:05:22', description: 'Review rules for nursing procedures refset', checked: false }
    ];

    gridApi: any;
    gridColumnDefs = [];
    gridOptions: any;
    gridPaging = { pageSize: 10, pageSizeOptions: [10, 25, 50, 100], totalKnown: false, totalRows: null, manualStateRefresh: new Boolean(true) };
    showTable: boolean = false;

    @Input() refsetInternalId: string;
    @Output() downloadSelected : EventEmitter<any> = new EventEmitter();
    @ViewChild('descriptionSection') descriptionSection: TemplateRef<any>;

    constructor(private route: ActivatedRoute, private readonly modalService: NgbModal, private refsetService: RefsetService,
        private changeDetectorRef: ChangeDetectorRef) { }

    ngOnInit(): void {
        this.columnDefs = [
        { field: 'name', headerName: 'Name', unSortIcon: true, sortable: true, checkboxSelection: true, headerCheckboxSelection: true },
        { field: 'type', headerName: 'Type', unSortIcon: true, sortable: true },
        { field: 'uploader', headerName: 'Uploaded By', unSortIcon: true, sortable: true },
        { field: 'uploaded', tooltipField: 'Uploaded Date', headerName: 'Uploaded Date', unSortIcon: true, sortable: true },
        { field: 'description', headerName: 'Description', minWidth: 550 }]; //, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.descriptionSection }

        this.gridOptions = {
            context: { componentParent: this },
            pagination: false,
            suppressColumnVirtualisation: false, // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
            suppressPaginationPanel: true,
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
        this.columnDefs[4].cellRendererParams = { template: this.descriptionSection };
        this.gridApi.setColumnDefs(this.columnDefs);
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

        // this.selectedThread = event.data;
        // this.openThreadModal();
    }

    openArtifactsModal(artifactsDialog: NgbModal) {
        this.modalService.open(artifactsDialog, {
            //backdrop : 'static',
            //keyboard : false,
            modalDialogClass: 'full-modal',
            centered: true,
            windowClass: 'artifact-modal'
        });
    }

    onDownloadSelected(){
        this.downloadSelected.emit(this.gridApi.getSelectedRows());
    }
}
