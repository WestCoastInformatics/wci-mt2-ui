import { AfterViewInit, ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Debounce } from 'src/app/decorators/debounce.decorator';
import { RefsetDetails } from 'src/app/pages/refset-details';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { AddRemoveConceptsComponent } from '../add-remove-concepts/add-remove-concepts.component';
import { TemplateRenderer } from '../cellRenderers/template.renderer';
import { PaginationComponent } from '../pagination/pagination.component';
import { UpgradeModalComponent } from '../upgrade-modal/upgrade-modal.component';
import { RefsetUtility } from "src/app/utilities/refset.utility";
import { DialogService } from 'src/app/dialog/services/dialog.service';
import { DialogFactoryService } from 'src/app/dialog/services/dialog-factory.service';
import { CodeUtility } from 'src/app/utilities/code.utility';

@Component({
	selector: 'adjudicate-upgrade-modal',
	templateUrl: './adjudicate-upgrade-modal.component.html'
})
export class AdjudicateUpgradeModalComponent {

	@Input()
	refsetData: any;
	@Input()
	membersOfRefset: any;
	@Input()
	inactiveConcepts: any;
	@Input()
	membersInCommon: any;
	numOfResults: any;
	numOfMembers: any;
	selectedLanguage = '';
	languageOptions = [];
	hideReplacements = false;
	refsetGridLastFilter: string = '';
	refsetGridLastSort: string = '';
	selectedTaxonomyLanguage: string = RefsetUtility.DEFAULT_ACCEPT_LANGUAGE + ":" + RefsetUtility.DEFAULT_LANGUAGE_TYPE;
	@ViewChild('adjudicatePaging') paginationComponent: PaginationComponent;
	@ViewChild('inactiveConceptCodeSection') inactiveCodeSection: TemplateRef<any>;
	@ViewChild('adjudicateInactiveId') inactiveIdSection: TemplateRef<any>;
	@ViewChild('adjudicateInactiveEnPtSection') inactiveEnPtSection: TemplateRef<any>;
	@ViewChild('adjudicateInactiveEnFsnSection') inactiveEnFsnSection: TemplateRef<any>;
	@ViewChild('adjudicateInactiveFrPtSection') inactiveFrPtSection: TemplateRef<any>;
	@ViewChild('adjudicateInactiveNlPtSection') inactiveNlPtSection: TemplateRef<any>;
	@ViewChild('adjudicateInactivationReason') inactivationReason: TemplateRef<any>;
	@ViewChild('replacementConceptCodeSection') replacementCodeSection: TemplateRef<any>;
	@ViewChild('adjudicateReplacementId') replacementIdSection: TemplateRef<any>;
	@ViewChild('adjudicateReplacementEnPtSection') replacementEnPtSection: TemplateRef<any>;
	@ViewChild('adjudicateReplacementEnFsnSection') replacementEnFsnSection: TemplateRef<any>;
	@ViewChild('adjudicateReplacementFrPtSection') replacementFrPtSection: TemplateRef<any>;
	@ViewChild('adjudicateReplacementNlPtSection') replacementNlPtSection: TemplateRef<any>;
	@ViewChild('adjudicateReason') reasonSection: TemplateRef<any>;
	@ViewChild('actionSection') actionSection: TemplateRef<any>;
	@ViewChild("pauseUpdateDialog") pauseUpdateDialog: TemplateRef<any>;
	@ViewChild("cancelUpgradeDialog") cancelUpgradeDialog: TemplateRef<any>;

	gridOptions: any;
	columnDefs: any;
	refsetGridOptions: any;
	refsetGridPaging = {
		pageSize: 100,
		pageSizeOptions: [5, 10, 25, 50],
		totalKnown: false,
		totalRows: null,
	};
	originalGridParams: any;
	refsetGridApi: any;
	refsetGridColumnApi: any;
	isConceptBeingAdded: Boolean;
	conceptForAddRemove: any;
	addRemoveDefinitionExceptionType: any;
	isLocked = false;
	isInactive: boolean;
	isReplacement: boolean;
	resetRefsetTotal = false;
	changeMethod = '';
	selectedRow: any;
	selectedConcepts: any;
	isConceptDetailsLoading = false;
	conceptDetail: any;
	conceptDetailParents: any;
	conceptDescriptions: any;
	conceptSelected: boolean;
	refsetInternalId: string;
	selectedConcept: any;
	numOfChildren = undefined;
	chosenConceptCode: any;
	replacementCode: string;
	concept: any;
	disableAddRemove = false;
	membersInCommonForChangeReport = { items: [] };
	manualReplacementOptionsLoading = false;
	addReplacementFlag = false;
	dialog: DialogService;
	replacementColumnSortFilter = false;
	showGrid = false;

	constructor(private readonly modalService: NgbModal,
		private readonly refsetService: RefsetService,
		readonly refsetDetails: RefsetDetails,
		private readonly changeDetection: ChangeDetectorRef,
		readonly upgradeModalComponent: UpgradeModalComponent,
		private dialogFactoryService: DialogFactoryService,
		private readonly addRemoveConceptsComponent: AddRemoveConceptsComponent) { }

	openAdjudicateUpgradeModal(adjudicateUpgradeDialog: NgbModal) {

		this.modalService.dismissAll();
		this.modalService.open(adjudicateUpgradeDialog, {
			backdrop: 'static',
			keyboard: false,
			windowClass: 'adjudicate-upgrade-modal',
			centered: true
		});

		this.initializeModal();
	}

	initializeModal() {

		this.showGrid = false;
		this.columnDefs = [];
		this.refsetGridOptions = null;
		this.refsetGridApi = null;
		this.refsetGridColumnApi = null;

		this.languageOptions = this.refsetData?.edition?.fullyQualifiedLanguageRefsets.map((x) => {
			return x.qualifiedLanguageCode;
		});
		this.selectedLanguage = this.languageOptions[0];

		this.setupColumns();
	}

	setupColumns() {

		this.columnDefs = [

			{
				field: 'inactivationReason', tooltipField: 'inactivationReason', headerName: 'Inactivation Reason',
				flex: 1, minWidth: 170, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.inactivationReason }, unSortIcon: true
			},
			{
				field: 'inactiveCode', sortable: true, tooltipField: 'inactiveCode', headerName: '', headerComponentParams: {
					template:
						''
						+ ' <a class="remove-all mr-auto ml-auto">'
						+ '   <img src="assets/subtract-symbol-icon.svg" width="18px" height="18px" title="Remove All" class="subtract-symbol-icon" />'
						+ ' </a>'
						+ ''
				}, cellRenderer: 'templateRenderer', floatingFilter: false, cellRendererParams: { template: this.inactiveCodeSection }, flex: 1, minWidth: 60, maxWidth: 60
			},
			{
				field: 'code', tooltipValueGetter: (params) => {
					return params?.value;
				}, filter: 'agTextColumnFilter', headerName: 'Inactive ID', cellRenderer: 'templateRenderer',
				cellRendererParams: { template: this.inactiveIdSection }, flex: 1, minWidth: 150, maxWidth: 190, unSortIcon: true
			},
			{
				field: 'inactiveEnPtSection', tooltipValueGetter: (params) => {
					if (params.data.descriptions) {
						return this.transformDescriptions(params?.data?.descriptions)?.length ?
							this.transformDescriptions(params?.data?.descriptions)[0].term : '';
					}

					return '';
				}, sort: 'asc', valueGetter: (params) => {
					if (params.data.descriptions) {
						return this.transformDescriptions(params?.data?.descriptions)?.length ?
							this.transformDescriptions(params?.data?.descriptions)[0].term : '';
					}

					return '';
				}, headerName: 'Inactive ' + this.selectedLanguage, flex: 2, minWidth: 150, width: 330, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.inactiveEnPtSection }, unSortIcon: true
			},
			{
				field: 'reason', valueGetter: (params) => {
					return this.formatReason(params?.data?.replacementConcepts[0]?.reason);
				}, tooltipValueGetter: (params) => {
					return this.formatReason(params?.data?.replacementConcepts[0]?.reason);
				}, headerName: 'Association', flex: 1, minWidth: 120, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.reasonSection }, colSpan: params => params.data.isSearch === true ? 4 : 1, unSortIcon: true
			},
			{
				field: 'replacementCode', tooltipField: 'replacementCode', headerName: '', headerComponentParams: {
					template: ' <a class="add-all mr-auto ml-auto">'
						+ '   <img src="assets/add-symbol-icon.svg" width="18px" height="18px" title="Add All" class="add-symbol-icon" />'
						+ ' </a>'
				}, flex: 1, minWidth: 60, width: 60, maxWidth: 70, cellRenderer: 'templateRenderer', floatingFilter: false, cellRendererParams: { template: this.replacementCodeSection }
			},
			{
				field: 'replacementId', tooltipValueGetter: (params) => {
					return params?.data?.replacementConcepts[0]?.code;
				}, headerName: 'Replacement ID', valueGetter: (params) => {
					return params?.data?.replacementConcepts[0]?.code;
				}, flex: 1, minWidth: 150, maxWidth: 190, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.replacementIdSection }, unSortIcon: true
			},
			{
				field: 'created', colId: 'replacementEnPtSection', tooltipValueGetter: (params) => {

					let description = '';

					if (this.transformManualReplacementDescriptions(params?.data?.replacementConcepts[0]?.descriptions)?.length > 0) {
						description = this.transformManualReplacementDescriptions(params?.data?.replacementConcepts[0]?.descriptions)[0].term;
					}

					return description;

				}, headerName: 'Replacement ' + this.selectedLanguage, flex: 2, minWidth: 150, width: 330, cellRenderer: 'templateRenderer', valueGetter: (params) => {

					let description = '';

					if (this.transformManualReplacementDescriptions(params?.data?.replacementConcepts[0]?.descriptions)?.length > 0) {
						description = this.transformManualReplacementDescriptions(params?.data?.replacementConcepts[0]?.descriptions)[0].term;
					}

					return description;

				}, cellRendererParams: { template: this.replacementEnPtSection }, unSortIcon: true,
			},
			{ field: 'actionSection', tooltipField: 'actionSection', headerName: '', flex: 1, minWidth: 60, width: 60, maxWidth: 60, cellRenderer: 'templateRenderer', floatingFilter: false, cellRendererParams: { template: this.actionSection } },
		];

		this.refsetGridOptions = {
			context: { componentParent: this },
			pagination: true,
			suppressColumnVirtualisation: false, // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
			suppressPaginationPanel: true,
			paginationPageSize: this.refsetGridPaging.pageSize,
			enableCellTextSelection: true,
			rowSelection: 'single',
			onGridReady: this.onGridReady,
			onCellClicked: this.onGridCellClick,
			onFilterChanged: this.checkSortFilter,
			onSortChanged: this.checkSortFilter,
			postSort: this.replacementSort,
			frameworkComponents: {
				'templateRenderer': TemplateRenderer,
			},
			suppressScrollOnNewData: true,
			defaultColDef: {
				sortable: true,
				sortingOrder: ['asc', 'desc'],
				filter: true,
				floatingFilter: true,
				floatingFilterComponentParams: { placeholder: '', suppressFilterButton: true },
				suppressMenu: true,
				menuTabs: ['columnsMenuTab'],
				resizable: true,
			},
			rowClassRules: {
				'alternate-row-color-odd': (params) => {

					if (this.replacementColumnSortFilter) {
						return false;
					} else {
						return !this.isRowClassEven(params);
					}
				},
				'alternate-row-color-even': (params) => {

					if (this.replacementColumnSortFilter) {
						return false;
					} else {
						return this.isRowClassEven(params);
					}
				}
			},
		};

		this.showGrid = true;
	}

	onCellMouseOver(params) {
		this.selectedRow = params;
	}

	onGridCellClick = (event) => {
		this.selectConcept(event.data);
	}

	checkSortFilter = (event) => {

		let replacementColumns = ['reason', 'replacementCode', 'replacementId', 'replacementEnPtSection'];
		let replacementSort = false;
		let replacementFilter = false;
		let sorts = this.refsetGridApi.getSortModel();
		let filters = this.refsetGridApi.getFilterModel();

		for (let sort of sorts) {

			if (replacementColumns.includes(sort.colId)) {

				this.replacementColumnSortFilter = true;
				replacementSort = true;

				break;
			}
		}

		for (let filterName in filters) {

			if (replacementColumns.includes(filterName)) {

				this.replacementColumnSortFilter = true;
				replacementFilter = true;
				break;
			}
		}

		if (!replacementFilter && !replacementSort) {
			this.replacementColumnSortFilter = false;
		}

		this.refsetGridApi.redrawRows();
	}

	replacementSort = (params) => {

		if (!this.refsetGridApi) {
			return;
		}

		let replacementColumns = ['reason', 'replacementCode', 'replacementId', 'replacementEnPtSection'];
		let sorts = this.refsetGridApi.getSortModel();
		let rowNodes = params;

		for (let sort of sorts) {

			if (replacementColumns.includes(sort.colId)) {

				rowNodes.sort((a, b) => {

					let sortA = a.data.replacementConcepts[0][sort.colId] + a.data.code;
					let sortB = b.data.replacementConcepts[0][sort.colId] + b.data.code;

					if (sort.sort == 'asc') {

						if (sortA > sortB) {
							return 1;
						}

						if (sortA < sortB) {
							return -1;
						}
					} else {

						if (sortA > sortB) {
							return -1;
						}

						if (sortA < sortB) {
							return 1;
						}
					}

					return 0;
				});

				break;
			}
		}
	}

	isRowClassEven = (params) => {

		if (!params.data) {
			return true;
		}

		let evenRow = true;

		if (params.node.rowIndex != 0) {

			let previousInactiveCode = params.node.gridApi.rowModel.rowsToDisplay[params.node.rowIndex - 1].data.code;
			let previousRowEven = params.node.gridApi.rowModel.rowsToDisplay[params.node.rowIndex - 1].data.rowEvenColorFlag;

			if (params.data.code == previousInactiveCode) {
				evenRow = previousRowEven;
			} else {
				evenRow = !previousRowEven;
			}

			evenRow;
		}

		params.data.rowEvenColorFlag = evenRow;
		return evenRow;
	};

	getSelectedRowData(option: string) {

		const newItem = { ...this.selectedRow.data, isHidden: true, isSearch: true };
		newItem.inactivationReason = 'MANUAL REPLACEMENT';
		newItem.replacementConcepts = this.selectedRow.data.replacementConcepts;

		if (option.includes('add')) {

			this.chosenConceptCode = this.selectedRow['data'].code;
			this.refsetGridApi.applyTransaction({ add: [newItem], addIndex: this.selectedRow.rowIndex + 1 });

		} else if (option.includes('remove')) {
			this.refsetGridApi.applyTransaction({ remove: [this.selectedRow.data] });
		}

		this.selectedConcepts = undefined;
	}

	addRemoveConcept(params: any, changeMethod: string): void {
		if (!this.disableAddRemove) {
			this.changeLockedStatus(true);
			this.addRemoveConceptsComponent.changeMethod = changeMethod;
			this.addRemoveConceptsComponent.refset = this.refsetData;
			this.addRemoveConceptsComponent.processChangedMemberFunction = this.processChangedMemberEffects;
			this.addRemoveConceptsComponent.refsetInternalId = this.refsetData.id;
			this.addRemoveConceptsComponent.addRemoveConceptsForAdjudication(params, params.replacementConcepts[0]);
			if (changeMethod == 'INACTIVE_ADDED') {
				this.inactiveConcepts++;
			} else if (changeMethod == 'INACTIVE_REMOVED') {
				this.inactiveConcepts--;
			}
		}
	}

	async onSearchChange(value): Promise<void> {
		await this.search(value);
	}

	handleInput(event: KeyboardEvent): void {
		event.stopPropagation();
	}

	@Debounce()
	search(value: string): void {

		this.manualReplacementOptionsLoading = true;
		this.selectedConcepts = undefined;

		const results = this.refsetService.getReplacementConcepts(this.refsetData.id, value).subscribe((results) => {

			this.selectedConcepts = results.items.filter((x) => {
				return x.active === true;
			});

			this.manualReplacementOptionsLoading = false;
		});
	}

	selectedConceptChanged(event: any): void {
		this.concept = event['value'];
	}

	removeManualReplacement(changeMethod: string): void {
		this.refsetDetails.toggleLoadingSpinner(true);
		this.refsetService.modifyMembersForUpgrade(this.refsetData.id, this.chosenConceptCode ? this.chosenConceptCode : this.selectedRow['data'].code, changeMethod, this.concept ? this.concept.code : this.selectedRow['data'].replacementConcepts[0].code).subscribe((x) => {
			this.onGridReady(this.originalGridParams);
			this.refsetDetails.toggleLoadingSpinner(false);
		});
		this.selectedConcepts = undefined;
		this.concept = '';
	}

	addManualReplacement(changeMethod: string): void {
		if (this.concept) {
			this.changeLockedStatus(true);
			// Not necessary
			//this.refsetDetails.toggleLoadingSpinner(true);
			const body = { ...this.concept };
			this.refsetService.modifyMembersForUpgrade(this.refsetData.id, this.chosenConceptCode, changeMethod, this.concept.code, JSON.stringify(body)).subscribe((x) => {
				// force auto-add of the replacement concept to the refset
				this.addReplacementFlag = true;
				this.onGridReady(this.originalGridParams);
				this.refsetDetails.toggleLoadingSpinner(false);
			});
		}
		this.selectedConcepts = undefined;
	}

	changeLockedStatus(lock: boolean) {

		this.isLocked = lock;
		this.refsetDetails.toggleLoadingSpinner(false);
		UiUtility.toggleLockedSections(lock);
	}

	processChangedMemberEffects = (conceptStatusArray) => {

		this.refsetDetails.showLoadingSpinner = true;

		this.onGridReady(this.originalGridParams);
		this.refsetDetails.showLoadingSpinner = false;
		this.disableAddRemove = false;
	}

	hideIncludedReplacements(toggle: any): void {
		this.hideReplacements = toggle.checked;
		this.onGridReady(this.originalGridParams);
	}

	formatReason(reason: string): string {
		return reason?.split('_').join(' ');
	}

	transformDescriptions(descriptions: any, isOption = false) {
		if (descriptions) {

			const getStringifiedJSON = descriptions.substring(1, descriptions.length - 1);
			if (getStringifiedJSON) {
				const formattedObjectArray = getStringifiedJSON.slice(1).split('{"descriptionId"').map((x) => {
					if (x[x.length - 1] === ',') {
						const modifiedString = x.slice(0, -1);
						x = modifiedString;
					}
					if (!x.includes('"descriptionId"')) {
						x = '{"descriptionId"' + x;
					} else if (!x.includes('{"descriptionId"') && x.includes('"descriptionId"')) {
						x = '{' + x;
					}
					if (x.includes(',null')) {
						x = x.replaceAll(',null', '');
					}
					if (x[x.length - 1] !== '}' && x[x.length - 2] !== '"') {
						x = x + '"}';
					}
					if (!x.includes(':')) {
						return '';
					}

					return JSON.parse(x);
				});
				return formattedObjectArray.filter((x) => {
					if (isOption) {
						return x.language === this.getLanguageAndType(isOption)[0] && x.type === this.getLanguageAndType(isOption)[1];
					} else {
						return x.languageName === this.selectedLanguage;
					}
				});
			}
		}
	}


	transformManualReplacementDescriptions(descriptions: any) {
		if (descriptions) {
			return JSON.parse(descriptions).filter((x) => {
				if (x?.language === this.getLanguageAndType()[0] && (x.type === this.getLanguageAndType()[1] || x.type === this.getLanguageAndType()[2])) {
					return x?.language === this.getLanguageAndType()[0] && (x.type === this.getLanguageAndType()[1] || x.type === this.getLanguageAndType()[2]);
				}

				return x?.language === this.getLanguageAndType(true)[0] && (x.type === this.getLanguageAndType(true)[1] || x.type === this.getLanguageAndType(true)[2]);
			});
		}
	}

	getLanguageAndType(isOption = false): string[] {
		let language = '';
		let type = '';
		if (isOption) {
			language = 'en';
			type = 'FSN';
		} else {
			language = this.selectedLanguage.split(' ')[0].toLowerCase();
			type = this.selectedLanguage.split(' ')[1].split('(')[1].split(')')[0];
		}
		let type2 = '';
		if (type === 'PT') {
			type2 = 'SYNONYM';
		}

		return [language, type, type2];
	}

	changeLanguage($event: any) {
		this.onGridReady(this.originalGridParams);
	}

	onGridReady = (gridReadyParams) => {

		this.originalGridParams = gridReadyParams;
		this.refsetGridApi = gridReadyParams.api;
		this.refsetGridColumnApi = gridReadyParams.columnApi;

		this.refsetDetails.showLoadingSpinner = true;

		let pageNumber = this.refsetGridApi.paginationGetPageSize();
		let filter = UiUtility.formatFilterData(gridReadyParams.filterModel);
		let newFilterString = filter;
		this.refsetGridLastFilter = newFilterString;


		let restParams: any = {
			displayType: "list",
			limit: this.refsetGridApi.paginationGetPageSize(),
			offset: pageNumber - 1
		};

		this.refsetService.getUpgradeData(this.refsetData?.id, restParams).subscribe(results => {
			results.items = results.items.filter((x) => {

				if (this.hideReplacements) {
					return !x.replaced && x.replacementConcepts.filter(r => r.existingMember).length == 0;
				}

				return x.active === false;
			});

			// pre sort items by 
			results.items.sort((a, b) => {

				let nameA = this.getConceptName(a.descriptions) + a.replacementConcepts[0].reason.toUpperCase();
				let nameB = this.getConceptName(b.descriptions) + b.replacementConcepts[0].reason.toUpperCase();
				if (nameA > nameB) {
					return -1;
				}
				if (nameA < nameB) {
					return 1;
				}

				return 0;
			});

			let finalResults = [];
			let changeReportResults = [];
			this.inactiveConcepts = 0;

			for (let i = 0; i < results.items.length; i++) {

				let inactiveConcept = results.items[i];

				if (inactiveConcept.stillMember) {
					this.inactiveConcepts++;
				}

				for (let j = 0; j < inactiveConcept.replacementConcepts.length; j++) {

					changeReportResults.push(inactiveConcept);

					if (j === 0) {
						finalResults.push(inactiveConcept);
					} else {

						const newItem = { ...inactiveConcept, isHidden: true };

						newItem.replacementConcepts = [inactiveConcept.replacementConcepts[j]];

						// if auto adding manual replacement to the refset, do it here, when the item's replacements are fully populated
						if (this.addReplacementFlag && (inactiveConcept.replacementConcepts[j].code == this.concept.code)) {

							this.addRemoveConceptsComponent.changeMethod = "REPLACEMENT_ADDED";
							this.addRemoveConceptsComponent.refset = this.refsetData;
							this.addRemoveConceptsComponent.processChangedMemberFunction = this.processChangedMemberEffects;
							this.addRemoveConceptsComponent.refsetInternalId = this.refsetData.id;
							this.addRemoveConceptsComponent.addRemoveConceptsForAdjudication(newItem, newItem.replacementConcepts[0]);
							this.addReplacementFlag = false;
						}

						finalResults.push(newItem);
					}
				}
			}

			this.numOfResults = results.items.length;
			this.membersInCommonForChangeReport.items = changeReportResults;

			results.items = finalResults;
			this.membersInCommon = results;
			let addRemoveAllBtns = document.querySelectorAll('.add-all, .remove-all');

			if (results.items.length == 0) {

				addRemoveAllBtns.forEach((element: HTMLElement) => {
					element.classList.add("disabled");
				});

				this.refsetGridApi.showNoRowsOverlay();
				this.refsetGridApi.setRowData([]);

				if (pageNumber > 1) {

					this.refsetGridPaging.totalRows = this.refsetGridApi.paginationGetPageSize() * (pageNumber - 1);
					this.refsetGridPaging.totalKnown = true;
					this.paginationComponent?.goToPage(pageNumber - 1);
				}

				this.refsetDetails.showLoadingSpinner = false;

				return;

			} else {

				addRemoveAllBtns.forEach((element: HTMLElement) => {
					element.classList.remove("disabled");
				});
			}

			UiUtility.applyServerPagedGridResults(results, this.refsetGridApi, this.refsetGridPaging, pageNumber, null, false);
			this.refsetDetails.showLoadingSpinner = false;
			// finally, set locked back off
			this.changeLockedStatus(false);

		},
			error => {

				this.refsetGridApi.showNoRowsOverlay();
				this.refsetGridApi.setRowData([]);
				this.refsetDetails.toggleLoadingSpinner(false);
				this.changeLockedStatus(false);
			});


		// set placeholders on the grid floating filter fields
		document.querySelectorAll('.ag-floating-filter-full-body .ag-input-field-input').forEach((obj: any) => {

			let label = obj.getAttribute('aria-label');
			let value = label.substring(0, label.indexOf('Filter Input')) + '...';
			obj.setAttribute('placeholder', value);
		});

		let self = this;
		document.querySelectorAll('.add-all, .remove-all').forEach((obj: HTMLElement) => {
			obj.addEventListener('click', function (e) {
				if (!obj.classList.contains('disabled')) {
					const memberItems = self.membersInCommon.items;
					const isAdd = obj.classList.contains('add-all');
					const inactiveConcepts = memberItems.filter((items: any) => {
						return items?.active == false && (!isAdd || !items.replacementConcepts[0]?.existingMember);
					});
					if (inactiveConcepts.length > 0) {
						self.changeLockedStatus(true);
						self.refsetDetails.showLoadingSpinner = true;
						self.refsetService.addRemoveAllInactiveRefsetMembers(self.refsetData.id, isAdd).subscribe(() => {
							self.processChangedMemberEffects(null);
						});
					}
				}
			});
		});
		this.changeDetection.detectChanges();
	}

	getConceptName(descriptionsString) {

		let conceptName: any = '';

		let descriptions = JSON.parse(descriptionsString);

		if (CodeUtility.hasValue(descriptions) && CodeUtility.hasValue(descriptions[0]?.term)) {
			conceptName = descriptions[0].term;
		} else {

			for (let i = 1; i < descriptions.length; i++) {

				if (descriptions[i].language == 'en' && descriptions[i].type == 'PT') {

					conceptName = descriptions[i].term;
					break;
				}
			}
		}

		conceptName = conceptName.replaceAll(',', '/');

		return conceptName;
	}

	getReplacementConceptName(inactiveConcept) {

		let replacementName: any = '';

		if (inactiveConcept.replacementConcepts) {
			replacementName = this.transformDescriptions(inactiveConcept.replacementConcepts[0].descriptions)[0].term;
		}

		return replacementName;
	}

	getInactiveChangeReport(): void {

		const memberItems = this.membersInCommon.items;
		const inactiveConcepts = memberItems.filter((items: any) => {
			return items?.active == false;
		});

		let data = [];

		for (let i = 0; i < inactiveConcepts.length; i++) {

			data.push({
				'Inactivation Reason': inactiveConcepts[i].inactivationReason ? inactiveConcepts[i].inactivationReason : '',
				'Inactive ID': inactiveConcepts[i].inactivationReason ? inactiveConcepts[i].code : '',
				'Inactive Concept': this.transformDescriptions(inactiveConcepts[i].descriptions)[0].term,
				'Suggested Replacement Association': inactiveConcepts[i].replacementConcepts ? inactiveConcepts[i].replacementConcepts[0].reason : '',
				'Suggested Replacement ID': inactiveConcepts[i].replacementConcepts ? inactiveConcepts[i].replacementConcepts[0].code : '',
				'Suggested Replacement Concept': this.getReplacementConceptName(inactiveConcepts[i])
			});
		}

		UiUtility.createInactiveChangeReport(this.refsetData.refsetId, data);

	}

	getFinishedChangeReport(): void {

		// Get old members from inactive concepts
		let memberItems = this.membersInCommonForChangeReport?.items;
		let inactiveConcepts = [];
		memberItems.forEach((items: any) => {
			if (items.replacementConcepts) {
				for (let item of items.replacementConcepts) {
					if (item.added === true) {
						inactiveConcepts.push(item);
					}
				}
			}
		});

		let newMembers = [];
		for (let concept of inactiveConcepts) {
			if (!Boolean(newMembers.some((x) => {
				return x['New Member ID'] === concept.code;
			}))) {
				newMembers.push({
					'id': concept.memberId,
					'effectiveTime': concept.memberEffectiveTime ? new Date(concept.memberEffectiveTime).toISOString().split('T')[0].replace(/[-]/g, '') : '',
					'active': concept.active ? '1' : '0',
					'moduleId': this.refsetData?.moduleId,
					'refsetId': this.refsetData?.refsetId,
					'referencedComponentId': concept.code
				});
			}
		}


		// Get new members from inactive concepts
		inactiveConcepts = [];
		memberItems.forEach((item: any) => {
			if (item.replaced === true || item.stillMember === false) {
				inactiveConcepts.push(item);
			}
		});
		let oldMembers = [];
		for (let concept of inactiveConcepts) {
			if (!Boolean(oldMembers.some((x) => {
				return x['Old Member ID'] === concept.code;
			}))) {
				oldMembers.push({
					'id': concept.memberId,
					'effectiveTime': concept.memberEffectiveTime ? new Date(concept.memberEffectiveTime).toISOString().split('T')[0].replace(/[-]/g, '') : '',
					'active': concept.active ? '1' : '0',
					'moduleId': this.refsetData?.moduleId,
					'refsetId': this.refsetData?.refsetId,
					'referencedComponentId': concept.code
				});
			}
		}

		// Get all inactive concepts
		const items = this.membersInCommon.items;
		inactiveConcepts = items.filter((items: any) => {
			return items?.active == false;
		});

		let totalInactiveConcepts = [];


		for (let i = 0; i < inactiveConcepts.length; i++) {
			totalInactiveConcepts.push({
				'Inactive Concept ID': inactiveConcepts[i].code,
				'Inactive Concept Name': this.transformDescriptions(inactiveConcepts[i].descriptions)[0].term,
				'Reason': this.formatReason(inactiveConcepts[i].inactivationReason),
				'Suggested Replacement Association': inactiveConcepts[i].replacementConcepts ? inactiveConcepts[i].replacementConcepts[0].reason : '',
				'Suggested Replacement ConceptID(s)': inactiveConcepts[i].replacementConcepts ? inactiveConcepts[i].replacementConcepts[0].code : '',
				'Suggested Replacement Name': this.transformManualReplacementDescriptions(inactiveConcepts[i].descriptions)[0].term
			});
		}

		// Get members in common
		const membersInCommonItems = this.membersOfRefset;
		const commonConcepts = membersInCommonItems?.filter((x) => {
			return !memberItems?.includes(x.id);
		});

		console.log(commonConcepts)
		let membersInCommon = [];
		for (let i = 0; i < commonConcepts?.length; i++) {
			membersInCommon.push({
				'id': commonConcepts[i].memberId,
				'effectiveTime': commonConcepts[i].memberEffectiveTime ? new Date(commonConcepts[i].memberEffectiveTime).toISOString().split('T')[0].replace(/[-]/g, '') : '',
				'active': commonConcepts[i].active ? '1' : '0',
				'moduleId': this.refsetData?.moduleId,
				'refsetId': this.refsetData?.refsetId,
				'referencedComponentId': commonConcepts[i].code
			});
		}

		const changeReportObject = {
			'newMember': newMembers,
			'oldMember': oldMembers,
			'totalInactiveConcepts': totalInactiveConcepts,
			'membersInCommon': membersInCommon
		};
		UiUtility.createFinishedChangeReport(this.refsetData?.refsetId, changeReportObject);
	}
	selectConcept(concept: any): void {

		this.conceptSelected = true;
		this.selectedConcept = concept;
		this.loadConceptDetail(concept);
	}
	getTaxonomyLanguageWithoutType() {
		return this.selectedTaxonomyLanguage.replace(/:.*$/, "");
	}

	loadConceptDetail(concept) {

		this.conceptDetail = null;
		this.isConceptDetailsLoading = true;
		this.loadConceptDetailParents(concept);

	}

	loadConceptDetailParents(concept) {

		this.conceptDetailParents = [];
	}

	openCancelUpgrade(dialog: NgbModal) {
		this.modalService.open(dialog, {
			modalDialogClass: 'alert-modal',
			centered: true
		});

	}
	openPauseUpdate() {
		const dialogId = "pauseUpdateDialog";

		const dialogData = {
			headerText: `Pause Upgrade`,
			template: this.pauseUpdateDialog,
			data: this.refsetData,
			showCloseIcon: false
		};

		const dialogOptions = {
			id: dialogId,
		};

		this.dialog = this.dialogFactoryService.open(dialogData);

		this.dialog.confirmed().subscribe((data) => {
			// if 'ok', close pause modal and update modal
			if (data) {

				this.refsetDetails?.processChangedMemberEffects(null);
				this.modalService.dismissAll();
			}
			// else close only pause modal
		});
	}

}
