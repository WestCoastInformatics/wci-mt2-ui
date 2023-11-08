import { Component, EventEmitter, Input, Output, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { NotificationService } from 'src/app/services/notification.service';
import { Router } from '@angular/router';
import { Constants } from 'src/app/utilities/constants.utility';
import { PaginationComponent } from '../pagination/pagination.component';
import { CategoryFilterComponent } from '../categoryFilter/category-filter.component';
import { TemplateRendererComponent } from '../cellRenderers/template.renderer';

@Component({
	selector: 'bulk-upgrade-modal',
	templateUrl: './bulk-upgrade-modal.component.html',
	styleUrls: ['bulk-upgrade-modal.component.scss'],
})
export class BulkUpgradeModalComponent {
	refsetsForUpgrade: any[] = [];
	selectedRefsets: any[] = [];
	openedModel: NgbModalRef;
	restParams: {};
	gridApi: any;
	gridColumnDefs = [];
	gridOptions: any;
	gridPaging = { pageSize: 10, pageSizeOptions: [10, 25, 50, 100], totalKnown: false, totalRows: null, manualStateRefresh: new Boolean(true) };
	originalGridParams: any;

	@Input() project: any;
	@Output() processComplete = new EventEmitter<any>(true);
	@Output() loadingSpinner = new EventEmitter<boolean>(false);

	@ViewChild('refsetBulkUpgradePaging') paginationComponent: PaginationComponent;
	@ViewChild('refsetIDSection') refsetIDSection: TemplateRef<any>;
	@ViewChild('refsetNameSection') refsetNameSection: TemplateRef<any>;
	@ViewChild('refsetTypeSection') refsetTypeSection: TemplateRef<any>;

	constructor(private modalService: NgbModal, private refsetService: RefsetService, private notificationService: NotificationService, private readonly router: Router) {}

	openUpgradeModal(bulkUpgradeDialog: NgbModal) {
		this.selectedRefsets = [];
		this.gridPaging = { pageSize: 10, pageSizeOptions: [10, 25, 50, 100], totalKnown: false, totalRows: null, manualStateRefresh: new Boolean(true) };

		this.restParams = {
			limit: -1,
			offset: 0,
			searchConcepts: true,
			showInDevelopment: true,
			query: 'projectId:' + this.project.id + " AND workflowStatus:('PUBLISHED' OR 'READY_FOR_EDIT')",
		};

		this.openedModel = this.modalService.open(bulkUpgradeDialog, { backdrop: 'static', keyboard: false, windowClass: 'bulk-upgrade-dialog' });

		this.gridOptions = {
			context: { componentParent: this },
			pagination: true,
			suppressColumnVirtualisation: false, // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
			suppressPaginationPanel: true,
			paginationPageSize: this.gridPaging.pageSize,
			rowSelection: 'multiple',
			suppressRowClickSelection: true,
			enableCellTextSelection: true,
			onSelectionChanged: this.onGridCellClick,
			onGridReady: this.onGridReady,
			frameworkComponents: {
				templateRenderer: TemplateRendererComponent,
				'categoryFilterComponent': CategoryFilterComponent,
			},
			defaultColDef: {
				sortable: true,
				resizable: true,
				sortingOrder: ['asc', 'desc'],
				suppressMenu: true,
				filter: true,
				floatingFilter: true,
				floatingFilterComponentParams: { placeholder: '', suppressFilterButton: true },
			},
			enableBrowserTooltips: true,
		};

		this.gridColumnDefs = [
			{
				field: 'refsetId',
				colId: 'refsetId',
				flex: 1,
				headerName: 'Reference Set ID',
				headerTooltip: 'Select to Upgrade all',
				cellClass: 'rt2-bulk-upgrade-id',
				tooltipField: 'refsetId',
				resizable: true,
				minWidth: 200,
				headerCheckboxSelectionFilteredOnly: true,
				headerCheckboxSelection: true,
				checkboxSelection: true,
				cellRenderer: 'templateRenderer',
				cellRendererParams: { template: this.refsetIDSection },
				unSortIcon: true,
				filter: true,
			},
			{
				field: 'name',
				colId: 'type',
				flex: 2,
				headerName: 'Reference Set Name',
				headerTooltip: 'Reference Set Name',
				cellClass: 'rt2-directory-column-name',
				tooltipField: 'name',
				resizable: true,
				minWidth: 250,
				cellRenderer: 'templateRenderer',
				cellRendererParams: { template: this.refsetNameSection },
				sort: 'asc',
				unSortIcon: true,
				filter: true,
			},
			{
				field: 'type',
				colId: 'type',
				flex: 1,
				headerName: 'Type',
				headerTooltip: 'Type',
				cellClass: 'rt2-bulk-upgrade-type',
				tooltipField: 'type',
				resizable: true,
				minWidth: 130,
				cellRenderer: 'templateRenderer',
				cellRendererParams: { template: this.refsetTypeSection },
				unSortIcon: true,
				filter: true,
			},
		];
	}

	onGridReady = (gridReadyParams) => {
		this.originalGridParams = gridReadyParams;
		this.gridApi = gridReadyParams.api;
		this.refsetsForUpgrade = [];

		this.refsetService.getRefsets({ ...this.restParams }).subscribe({
			next: (results) => {
				const pageNumber = 1;
				for (const refset of results.items) {
					if (refset.type !== 'EXTERNAL') {
						this.refsetsForUpgrade.push({
							checked: false,
							id: refset.id,
							name: refset.name,
							type: refset.type,
							refsetId: refset.refsetId,
						});
					}
				}

				this.refsetsForUpgrade = this.sortRefsets(this.refsetsForUpgrade);
				results.items = this.refsetsForUpgrade;

				UiUtility.applyServerPagedGridResults(results, this.gridApi, this.gridPaging, pageNumber, null, false);
				UiUtility.applyGridPlaceholders('.ag-floating-filter-input .ag-input-field-input');

				this.changeModalSize();
			},
			error: (error) => {
				//
			},
		});
	};

	onGridCellClick = (event) => {
		const currentRefsets = this.refsetsForUpgrade;
		const currentSelectedRefsets = [];
		const selectedRows = event.api.getSelectedNodes();

		selectedRows.forEach(function (selectedRow) {
			const selectedNode = selectedRow?.data;
			for (let i = 0; i < currentRefsets.length; i++) {
				if (currentRefsets[i].id == selectedNode.id) {
					currentSelectedRefsets.push(currentRefsets[i]);
				}
			}
		});
		this.selectedRefsets = currentSelectedRefsets;
	};

	changeModalSize(): void {
		const modalDialog = <HTMLElement>document.getElementsByClassName('modal-dialog')[0];
		if (modalDialog) {
			modalDialog.style.width = '1000px';
			modalDialog.style.maxWidth = '1240px';
		}

		const modalContent = <HTMLElement>document.getElementsByClassName('modal-content')[0];
		if (modalContent) {
			modalContent.style.height = '100%';
		}
	}

	upgradeRefsets(): void {
		let refsetInternalIds = '';
		let refsetIds = '';

		for (const refset of this.selectedRefsets) {
			refsetInternalIds += refset.id + ',';
			refsetIds += refset.refsetId + ', ';
		}

		refsetInternalIds = refsetInternalIds.slice(0, -1);
		refsetIds = refsetIds.slice(0, -2);

		this.modalService.dismissAll();

		this.refsetService.initializeUpgrade(refsetInternalIds).subscribe();

		UiUtility.manageProcessNotifications(
			refsetInternalIds,
			refsetIds,
			Constants.IN_DEVELOPMENT,
			this.emitProcessComplete,
			this.notificationService,
			this.refsetService,
			this.router,
			'bulk upgrade'
		);
	}

	emitProcessComplete = () => {
		this.processComplete.emit(true);
	};

	sortRefsets(refsets) {
		return refsets.sort((refset1, refset2) => {
			const name1 = refset1.name;
			const name2 = refset2.name;

			const compareValue = name1.localeCompare(name2);
			return compareValue;
		});
	}
}
