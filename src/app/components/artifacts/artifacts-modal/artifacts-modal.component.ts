import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RefsetService } from 'src/app/services/rest/refset.service';

@Component({
	selector: 'artifacts-modal',
	templateUrl: './artifacts-modal.component.html'
})
export class ArtifactsModalComponent implements AfterViewInit{

	
    isResolved = false;
    gridApi: any;
    gridColumnDefs = [];
    gridOptions: any;
    gridPaging = { pageSize: 10, pageSizeOptions: [10, 25, 50, 100], totalKnown: false, totalRows: null, manualStateRefresh: new Boolean(true) };
    showTable: boolean = false;

	@Input() refsetInternalId: string;
	@Input() isDetails: boolean = true;

	constructor(private route: ActivatedRoute, private readonly modalService: NgbModal, private refsetService: RefsetService) { }

	ngAfterViewInit(): void {
		this.showTable = true;
        this.gridOptions = {
            context: { componentParent: this },
            pagination: false,
            suppressColumnVirtualisation: false, // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
            suppressPaginationPanel: true,
            paginationPageSize: this.gridPaging.pageSize,
            rowSelection: 'single',
            enableCellTextSelection: true,
            onCellClicked: this.onGridCellClick,
            onGridReady: this.onGridReady, 
            onFilterChanged: function() {
                if (this.api.getDisplayedRowCount() === 0) {
                    this.api.showNoRowsOverlay();
                } else {
                    this.api.hideOverlay();
                };
            },
            frameworkComponents: {
                // templateRenderer: TemplateRenderer,
                
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

        this.gridColumnDefs = [
            
        ];
	}

	onGridReady = (gridReadyParams) => {

        this.gridApi = gridReadyParams.api;
        
        // let conceptId = null;

        // if (CodeUtility.hasValue(this.conceptId)) {
        // 	conceptId = this.conceptId;
        // }

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

    downloadSelected(selected: any){
        alert(`Downloading ${selected.length} selected file(s)`);
    }
}
