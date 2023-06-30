import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { ThemePalette } from '@angular/material/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { Debounce } from 'src/app/decorators/debounce.decorator';
import { TreeOptions } from 'src/app/models/tree-options.model';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { RefsetUtility } from 'src/app/utilities/refset.utility';
import { Constants } from 'src/app/utilities/constants.utility';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { NotificationService } from 'src/app/services/notification.service';
import { environment } from 'src/environments/environment';
import { PaginationComponent } from '../pagination/pagination.component';
import { CategoryFilterComponent } from '../categoryFilter/category-filter.component';
import { TemplateRenderer } from '../cellRenderers/template.renderer';

@Component({
	selector: 'add-remove-by-concept-modal',
	templateUrl: './add-remove-by-concept-modal.component.html',
	styleUrls: ['add-remove-by-concept-modal.component.scss'],
})
export class AddRemoveByConceptModalComponent implements OnInit {
	searchInput: string;
	displayedColumns: string[] = ['memberOfRefset', 'name', 'description'];
	data: any;
	conceptIdArray = [];
	color: ThemePalette = 'primary';
	checked = false;
	showActiveConceptsOnly = true;
	selectedRowIndex = -1;
	selectedTaxonomyLanguage: string = Constants.DEFAULT_ACCEPT_LANGUAGE + ':' + Constants.DEFAULT_LANGUAGE_TYPE;
	taxonomyOptions: TreeOptions = {
		useFsn: false,
		language: Constants.DEFAULT_ACCEPT_LANGUAGE,
	};
	conceptDescriptions: any;
	editMode = true;
	conceptSelected: boolean;
	showLoadingSpinner = false;
	isConceptDetailsLoading = false;
	conceptDetail: any;
	conceptDetailParents: any;
	selectedConcept: any;
	numOfChildren = undefined;
	isConceptBeingAdded: boolean;
	addRemoveDefinitionExceptionType: string;
	conceptForAddRemove: any;
	refsetInternalId: string;
	openedModel: NgbModalRef;
	isLocked = false;
	showNoResultsLabel = false;
	eclString: any;
	gridApi: any;
	gridColumnDefs = [];
	gridOptions: any;
	gridPaging = { pageSize: 10, pageSizeOptions: [10, 25, 50, 100], totalKnown: false, totalRows: null, manualStateRefresh: new Boolean(true) };
	originalGridParams: any;
	showTable = false;
	resultsDisplay = 'none';

	@Input() refset: any;
	@Input() processChangedMemberFunction: Function;
	@Output() loadingSpinner = new EventEmitter<boolean>(true);
	@Output() changeLockedStatus = new EventEmitter<boolean>(true);
	@Output() reloadData = new EventEmitter<boolean>(true);

	@ViewChild('conceptSearchPaging') paginationComponent: PaginationComponent;
	@ViewChild('conceptAddRemoveSection') conceptAddRemoveSection: TemplateRef<any>;
	@ViewChild('conceptCodeSection') conceptCodeSection: TemplateRef<any>;
	@ViewChild('conceptFsnSection') conceptFsnSection: TemplateRef<any>;

	constructor(private readonly modalService: NgbModal, private refsetService: RefsetService, private notificationService: NotificationService, private router: Router) {}

	ngOnInit(): void {}

	ngOnChanges(changes: SimpleChanges) {
		for (const propertyName in changes) {
			if (propertyName === 'refset' && CodeUtility.hasValue(this.refset)) {
				this.refsetInternalId = this.refset.id;
			}
		}
	}

	toggleDisplayActiveConcepts($event: any): void {
		this.showActiveConceptsOnly = $event.checked;
		this.filterActiveConcepts();
	}

	filterActiveConcepts(): void {
		const filters = this.gridApi.getFilterModel();

		if (this.showActiveConceptsOnly) {
			filters.active = { filterType: 'text', type: 'equals', filter: true };
		} else {
			delete filters.active;
		}

		this.gridApi.setFilterModel(filters);
	}

	addRemoveConcept(params: any): void {
		//this.showLoadingSpinner = true;
		this.isConceptBeingAdded = Boolean(params.addConcept);

		// if this is coming from the parents section than the concept has children
		if (params.isParentConcept) {
			params.concept.hasChildren = true;
		}

		this.conceptForAddRemove = params.concept;
		this.addRemoveDefinitionExceptionType = params.definitionExceptionType;
	}

	public processChangedMemberEffects = (conceptStatusArray) => {
		this.showLoadingSpinner = false;
		this.sendChangeLockedStatus(false);

		// if this modal is closed and the same refset is still open then refsesh the page
		if (!this.modalService.hasOpenModals() && this.router.url.includes('/' + this.refset.refsetId)) {
			this.processChangedMemberFunction(conceptStatusArray);
		}

		// reload the search results if the window is still open
		if (this.modalService.hasOpenModals()) {
			this.onTableSearchChange();
		}
	};

	sendChangeLockedStatus = (value: boolean) => {
		this.isLocked = value;
		UiUtility.toggleLockedSections(value);
		this.changeLockedStatus.emit(value);
	};

	openAddRemoveModal(addRemoveConceptHierarchyModal: NgbModal) {
		this.showTable = false;
		this.data = undefined;

		this.openedModel = this.modalService.open(addRemoveConceptHierarchyModal, {
			windowClass: 'add-remove-concept-hierarchy-modal-size',
			animation: true,
			beforeDismiss: () => {
				if (!this.isLocked) {
					this.processChangedMemberFunction();
				}

				this.resetModal();
				return true;
			},
			backdrop: 'static',
			keyboard: false,
		});

		this.gridOptions = {
			context: { componentParent: this },
			pagination: true,
			suppressColumnVirtualisation: false, // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
			suppressPaginationPanel: true,
			paginationPageSize: this.gridPaging.pageSize,
			rowSelection: 'single',
			enableCellTextSelection: true,
			onCellClicked: this.onGridCellClick,
			onGridReady: this.onGridReady,
			frameworkComponents: {
				templateRenderer: TemplateRenderer,
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

		this.gridColumnDefs = [
			{
				field: 'active',
				colId: 'active',
				flex: 1,
				headerName: '',
				maxWidth: 40,
				cellClass: 'rt2-details-column-remove-icon',
				resizable: true,
				cellRenderer: 'templateRenderer',
				cellRendererParams: { template: this.conceptAddRemoveSection },
				sort: false,
				filter: false,
			},
			{
				field: 'code',
				colId: 'code',
				flex: 1,
				headerName: 'Concept ID',
				minWidth: 65,
				maxWidth: 200,
				cellClass: 'rt2-details-column-concept-id',
				tooltipField: 'code',
				resizable: true,
				cellRenderer: 'templateRenderer',
				cellRendererParams: { template: this.conceptCodeSection },
				unSortIcon: true,
			},
			{
				field: 'fsn',
				colId: 'fsn',
				flex: 1,
				headerName: 'Concept Name',
				minWidth: 65,
				cellClass: 'rt2-details-column-description',
				tooltipField: 'fsn',
				resizable: true,
				cellRenderer: 'templateRenderer',
				cellRendererParams: { template: this.conceptFsnSection },
				unSortIcon: true,
			},
		];

		this.showTable = true;
	}

	onGridReady = (gridReadyParams) => {
		this.originalGridParams = gridReadyParams;
		this.gridApi = gridReadyParams.api;

		// Bail if there is no search text
		if (!this.searchInput) {
			this.data = { items: [] };
			return;
		}

		// Enable spinner (turn of when search errors or completes)
		this.loadingSpinner.emit(true);

		this.refsetService.getConceptSearch(this.refsetInternalId, `limit=200&editing=true&offset=0&query=${encodeURI(this.searchInput)}`).subscribe({
			next: (results) => {
				this.data = results;
				const pageNumber = 1;

				if (results.items.length == 0) {
					this.gridApi.showNoRowsOverlay();
					this.gridApi.setRowData([]);

					if (pageNumber > 1) {
						this.gridPaging.totalRows = this.gridApi.paginationGetPageSize() * (pageNumber - 1);
						this.gridPaging.totalKnown = true;
						this.paginationComponent.goToPage(pageNumber - 1);
					}

					return;
				}

				UiUtility.applyServerPagedGridResults(results, this.gridApi, this.gridPaging, pageNumber, null, false);
				UiUtility.applyGridPlaceholders('.ag-floating-filter-input .ag-input-field-input');

				if (results.items.length) {
					this.changeModalSize();
				}

				this.filterActiveConcepts();

				this.loadingSpinner.emit(false);
			},
			error: (error) => {
				this.loadingSpinner.emit(false);
			},
		});
	};

	onGridCellClick = (event) => {
		this.conceptSelected = true;
		const selectedRows = this.gridApi.getSelectedRows();
		let selectedId: string;

		selectedRows.forEach(function (selectedRow, index) {
			selectedId = selectedRow.code;
		});

		const selectedConcept = this.getGridRow(selectedId);
		this.loadConceptDetail(selectedConcept);
	};

	getGridRow(conceptId: string) {
		let concept;

		for (let i = 0; i < this.data.items.length; i++) {
			if (this.data.items[i].code == conceptId) {
				concept = this.data.items[i];
				break;
			}
		}

		return concept;
	}

	getGridPageSize() {
		let size = this.gridPaging.pageSize;

		if (this.gridApi) {
			size = this.gridApi.paginationGetPageSize();
		}

		return size;
	}

	closeModal() {
		this.openedModel.dismiss();
	}

	loadConceptDetail(concept) {
		this.conceptDetail = null;
		this.isConceptDetailsLoading = true;
		this.showLoadingSpinner = true;
		this.loadConceptDetailParents(concept);

		this.refsetService
			.getMembersDetails(concept.code, {
				refsetInternalId: this.refsetInternalId,
			})
			.subscribe((results) => {
				this.isConceptDetailsLoading = false;
				this.showLoadingSpinner = false;
				this.conceptDetail = results;
				this.conceptDescriptions = this.conceptDetail.descriptions.filter(function (description) {
					return description != null;
				});

				RefsetUtility.sortDescriptions(this.conceptDescriptions, this.refset.edition.fullyQualifiedLanguageRefsets);
			});
	}

	loadConceptDetailParents(concept) {
		this.conceptDetailParents = [];

		if (!concept?.active) {
			return;
		}

		const restParams = {
			displayType: 'taxonomy',
			returnChildren: false,
			language: this.getTaxonomyLanguageWithoutType(),
			depth: 1,
			startingConceptId: concept.code,
			offset: 0,
			limit: 1000,
		};

		// load the parents
		this.refsetService.getConceptList(this.refsetInternalId, restParams).subscribe((results) => {
			this.conceptDetailParents = results.items;
		});
	}

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

	resetModal(): void {
		this.clearSearch();
		this.isLocked = false;
		this.conceptSelected = false;
		this.conceptDetail = null;
		this.showTable = false;
		this.data = undefined;
		this.resultsDisplay = 'none';
	}

	clearSearch(): void {
		this.searchInput = '';
	}

	highlight(row) {
		this.selectedRowIndex = row.id;
	}

	getTaxonomyLanguageWithoutType() {
		return this.selectedTaxonomyLanguage.replace(/:.*$/, '');
	}

	openEclBuilder(fieldId) {
		UiUtility.openEclBuilder(fieldId, RefsetUtility.getBranchPath(this.refset));
	}

	addRemoveAllMembers(type) {
		this.sendChangeLockedStatus(true);
		this.showLoadingSpinner = true;

		for (let i = 0; i < this.data.items.length; i++) {
			if (this.showActiveConceptsOnly) {
				if (this.data.items[i].active) {
					this.conceptIdArray.push(this.data.items[i].code);
				}
			} else {
				this.conceptIdArray.push(this.data.items[i].code);
			}
		}

		RefsetUtility.addRemoveMembersByList(
			this.refset.id,
			this.refset.refsetId,
			this.conceptIdArray.join(),
			type,
			this.processChangedMemberEffects,
			this.notificationService,
			this.refsetService,
			this.router
		);
		//this.closeModal();
	}

	closeConceptDetails() {
		this.conceptDetail = null;
		this.selectedConcept = null;
	}

	@Debounce()
	onTableSearchChange() {
		if (CodeUtility.hasValue(this.searchInput) && this.searchInput.length > 2) {
			this.resultsDisplay = 'block';
			this.onGridReady(this.originalGridParams);
		}
	}

	openInNewWindow(conceptId: string): void {
		const snomedBrowserUrl = environment['snomedBrowserUrl'] + '&conceptId1=' + conceptId + '&edition=' + this.refset.edition?.branch;
		window.open(snomedBrowserUrl);
	}
}
