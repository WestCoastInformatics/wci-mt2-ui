import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DialogService } from 'src/app/dialog/services/dialog.service';
import { DialogFactoryService } from 'src/app/dialog/services/dialog-factory.service';
import { TemplateRendererComponent } from 'src/app/components/cellRenderers/template.renderer';
import { CategoryFilterComponent } from 'src/app/components/categoryFilter/category-filter.component';
import { DateTextFilterComponent } from 'src/app/components/dateTextFilter/date-text-filter.component';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { Title } from '@angular/platform-browser';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { RefsetUtility } from 'src/app/utilities/refset.utility';
import { Constants } from 'src/app/utilities/constants.utility';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { PaginationComponent } from 'src/app/components/pagination/pagination.component';
import { Debounce } from 'src/app/decorators/debounce.decorator';
import { User } from 'src/app/models/user';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { formatDate } from '@angular/common';

@Component({
	selector: 'app-mapset-records',
	templateUrl: './mapset-records.component.html',
	styleUrls: ['./mapset-records.component.scss'],
})
export class MapsetRecordsComponent implements OnInit {
	user: User;
	searchInput = '';
	viewOptions = [
		{ value: 'all', display: 'All' },
		{ value: 'public', display: 'Public' },
		{ value: 'private', display: 'Private' },
	];
	selectedVersion: any;
	refsetGridApi: any;
	refsetGridColumnApi: any;
	columnDefs = [];
	refsetGridColumns = [
		{ name: 'information', show: true },
		{ name: 'refsetId', show: true },
	];
	rowSelection = 'multiple';
	refsetGridOptions: any;
	refsetGridPaging = {
		pageSize: 10,
		pageSizeOptions: [10, 25, 50, 100],
		totalKnown: false,
		totalRows: null,
		manualStateRefresh: Boolean(true),
	};
	refsetGridLastFilter = '';
	refsetGridLastSort = '';
	showTable = false;
	mapsetData: any;
	dialog: DialogService;
	versionStatuses = [];
	versions: any;
	organizations: any;
	initialGridWidth: number;
	showFullNarrativeText = false;
	showFullNotesText = false;
	showLoadingSpinner = false;
	toggleDropdown = false;
	numOfResults = 0;
	directUrl: string;
	numOfMembers: any;
	disableChannel = new BroadcastChannel('disable-button-channel');
	originalGridParams: any;
	uiUtility = UiUtility;
	showLoadingSearch = true;
	toBeDevelopedModalRef: NgbModalRef;
	downloadModalRef: NgbModalRef;
	isModalOpen = false;
	mapsetName = 'Mapset Name';
	mapsetCode: string;
	routeParamsSubscription$: Subscription;
	gridSelectAll = false;
	advicePopoverLocation = '45px';
	showMapTable = 'table';

	selectedAction = '';
	showMappingsSection = true;
	showMetadataSection = false;
	showHistorySection = false;
	selectedFormat = {};
	formats = [];
	loaded = false;

	rowColors = [{ 'background': 'white' }, { 'background': '#f2f2f2' }];
	currentRowColor = 0;

	@Output() loadingSpinner = new EventEmitter<boolean>(true);

	@ViewChild('directoryInfoDialog') infoDialog: TemplateRef<any>;
	@ViewChild('directoryFeedbackDialog') feedbackDialog: TemplateRef<any>;
	@ViewChild('toBeDevelopedModal') tbdModal: TemplateRef<any>;
	@ViewChild('directoryCheckSection') checkSection: TemplateRef<any>;
	@ViewChild('directoryInfoSection') infoSection: TemplateRef<any>;
	@ViewChild('directoryCodeSection') codeSection: TemplateRef<any>;
	@ViewChild('directoryNameSection') nameSection: TemplateRef<any>;
	@ViewChild('directoryToNameSection') toNameSection: TemplateRef<any>;
	@ViewChild('directoryAdviceSection') adviceSection: TemplateRef<any>;
	@ViewChild('directoryEditionSection') editionSection: TemplateRef<any>;
	@ViewChild('directoryActionSection') actionSection: TemplateRef<any>;
	@ViewChild('directoryPaging') paginationComponent: PaginationComponent;
	@ViewChild('directoryCategoryFilter') categoryFilter: TemplateRef<any>;
	@ViewChild('directoryWorkflowStatusSection') versionStatus: TemplateRef<any>;
	@ViewChild('downloadModal') downloadModal: TemplateRef<any>;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private titleService: Title,
		private dialogFactoryService: DialogFactoryService,
		private refsetService: RefsetService,
		private changeDetectorRef: ChangeDetectorRef,
		private breadcrumbService: BreadcrumbService,
		private authenticationService: AuthenticationService,
		private modalService: NgbModal
	) {
		document.body.scrollTop = 0;
		//refsetService.getTaxonomyRoot();
	}

	//***** Framework Functions *****/
	ngOnInit() {
		this.user = this.authenticationService.getUser();
		this.titleService.setTitle('Mapping Tool - Mappings');
		this.breadcrumbService.setBreadcrumbs([{ label: 'Mappings' }]);

		this.routeParamsSubscription$ = this.route.params.subscribe((routeParams) => {
			this.mapsetCode = routeParams.code;
			this.getMapsetInfo();
		});

		this.formats = [
			{ value: 'rf2', display: 'RF2' },
			{ value: 'sctids', display: 'List Of SCTIDs' },
		];

		if (this.authenticationService.getUser().userName != this.authenticationService.GUEST_USER) {
			this.formats.splice(1, 0, { value: 'rf2_with_names', display: 'RF2 With Names' });
		}

		if (this.authenticationService.getUser().userName != this.authenticationService.GUEST_USER) {
			this.formats.splice(-1, 0, { value: 'freeset', display: 'Free Set' });
		}

		this.disableChannel.postMessage(false);
	}

	getMapsetInfo() {
		this.refsetService.getMapsets().subscribe((results) => {
			const thisResult = results.filter((res) => {
				return res.refSetCode === this.mapsetCode;
			});
			this.mapsetName = thisResult[0]?.refSetName;

			this.versionStatuses.push(formatDate(thisResult[0]?.modified, 'MM-dd-yyyy', 'en-US') + ' (' + thisResult[0]?.versionStatus + ') ');
			if (this.versionStatuses.length == 1) {
				this.selectedVersion = this.versionStatuses[0];
			}

			this.columnDefs = [
				{
					field: 'spanned',
					tooltipField: '',
					headerName: 'Check/Uncheck All',
					minWidth: 55,
					width: 55,
					cellRenderer: TemplateRendererComponent,
					cellRendererParams: { template: this.checkSection },
					headerComponentParams: {
						template:
							'<div class="ag-cell-label-container" role="presentation">' +
							'  <span ref="eMenu" class="ag-header-icon ag-header-cell-menu-button"></span>' +
							'  <div ref="eLabel" class="ag-header-cell-label" role="presentation">' +
							'    <span ref="eSortOrder" class="ag-header-icon ag-sort-order"></span>' +
							'    <span ref="eSortAsc" class="ag-header-icon ag-sort-ascending-icon"></span>' +
							'    <span ref="eSortDesc" class="ag-header-icon ag-sort-descending-icon"></span>' +
							'    <span ref="eSortNone" class="ag-header-icon ag-sort-none-icon"></span>' +
							'    <label class="checkbox-override"><input type="checkbox" onclick="checkboxHandleClick(event)" title="Check/Uncheck All" >' +
							'    <span class="checkbox-container"></span></label>' +
							'    <span ref="eFilter" class="ag-header-icon ag-filter-icon"></span>' +
							'  </div>' +
							'</div>',
					},
					unSortIcon: false,
					filter: false,
					resizable: false,
					sortable: false,
					getQuickFilterText: (params) => {
						return '';
					},
				},

				{
					field: 'code',
					tooltipField: 'code',
					headerName: 'Source',
					flex: 1,
					minWidth: 125,
					cellClass: 'blue-link',
					filter: 'agTextColumnFilter',
				},
				{
					field: 'name',
					tooltipField: 'name',
					headerName: 'Source PT',
					flex: 2,
					resizable: true,
					minWidth: 165,
					cellRenderer: TemplateRendererComponent,
					cellRendererParams: { template: this.nameSection },
					sortable: true,
					unSortIcon: true,
					filter: 'agTextColumnFilter',
				},
				{
					field: 'toCode',
					tooltipField: 'toCode',
					headerName: 'Target',
					flex: 1,
					minWidth: 135,
					cellRenderer: TemplateRendererComponent,
					cellRendererParams: {
						template: this.codeSection,
					},
					resizable: true,
					unSortIcon: true,
					sortable: true,
					filter: 'agTextColumnFilter',
				},
				{
					field: 'toName',
					tooltipField: 'toName',
					headerName: 'Target PT',
					resizable: true,
					unSortIcon: true,
					sortable: true,
					cellRenderer: TemplateRendererComponent,
					cellRendererParams: { template: this.toNameSection },
					filter: 'agTextColumnFilter',
				},

				{
					field: 'relation',
					tooltipField: 'relation',
					headerName: 'Relationship',
					cellClass: 'rt2-directory-column-id',
					resizable: true,
					unSortIcon: true,
					flex: 1,
					minWidth: 100,
					filter: 'agTextColumnFilter',
				},
				{
					field: 'rule',
					tooltipField: 'rule',
					headerName: 'Rule',
					cellClass: 'rt2-directory-column-id',
					flex: 1,
					minWidth: 85,
					resizable: true,
					unSortIcon: true,
					filter: 'agTextColumnFilter',
				},

				{
					field: 'advices',
					tooltipValueGetter: '',
					headerName: 'Advices',
					cellClass: 'rt2-directory-column-version-date',
					minWidth: 65,
					width: 125,
					resizable: true,
					cellRenderer: TemplateRendererComponent,
					cellRendererParams: { template: this.adviceSection },
					unSortIcon: true,
					filter: 'agTextColumnFilter',
					getQuickFilterText: (params) => {
						return '';
					},
				},
				{
					field: 'modified',
					tooltipValueGetter: UiUtility.gridDateValueGetter,
					headerName: 'Last Modified',
					cellClass: 'rt2-directory-column-modified-date',
					minWidth: 65,
					width: 165,
					resizable: true,
					valueGetter: UiUtility.gridDateValueGetter,
					floatingFilterComponent: DateTextFilterComponent,
					floatingFilterComponentParams: { suppressFilterButton: true },
					unSortIcon: true,
					filter: 'agTextColumnFilter',
				},
				{
					field: 'downloadable',
					colId: 'actions',
					headerName: '',
					width: 90,
					cellClass: 'rt2-directory-column-actions',
					cellRenderer: TemplateRendererComponent,
					cellRendererParams: { template: this.actionSection },
					sortable: false,
					filter: false,
					resizable: false,
					getQuickFilterText: (params) => {
						return '';
					},
				},
			];
			this.refsetGridOptions = {
				context: { componentParent: this },
				pagination: true,
				angularCompileHeaders: true,
				suppressColumnVirtualisation: true,
				suppressPaginationPanel: true,
				suppressRowClickSelection: true,
				paginationPageSize: this.refsetGridPaging.pageSize,
				rowSelection: 'single',
				enableCellTextSelection: true,
				onCellClicked: this.onGridCellClick,
				onGridReady: this.onGridReady,
				frameworkComponents: {
					'templateRenderer': TemplateRendererComponent,
					'categoryFilterComponent': CategoryFilterComponent,
					'dateTextFilterComponent': DateTextFilterComponent,
				},
				defaultColDef: {
					sortable: true,
					filter: true,
					sortingOrder: ['asc', 'desc'],
					floatingFilter: true,
					floatingFilterComponentParams: { placeholder: '', suppressFilterButton: false },
					suppressMenu: true,
					resizable: true,
				},
				enableBrowserTooltips: true,
				rowClassRules: {
					'refset_tool_grid_inactive_row': function (params) {
						let inactivatedRow = false;

						if (params.data) {
							inactivatedRow = params.data.active == false;
						}

						return inactivatedRow;
					},
				},
			};
			this.showTable = true;
			this.changeDetectorRef.detectChanges();
		});
	}

	dateFormatter(val): any {
		return UiUtility.dateFormatter(val);
	}

	getSameRowStyle(): object {
		const rowStyle = this.rowColors[this.currentRowColor];
		return rowStyle;
	}

	getNextRowStyle(): object {
		this.currentRowColor++;
		if (this.currentRowColor > 1) {
			this.currentRowColor = 0;
		}
		const rowStyle = this.rowColors[this.currentRowColor];

		return rowStyle;
	}

	showDropdown(): void {
		this.toggleDropdown = !this.toggleDropdown;
	}

	changeMappingsView(value: string): void {
		this.showMapTable = value;
	}

	//***** AG Grid Functions *****/
	onGridReady = (gridReadyParams) => {
		this.originalGridParams = gridReadyParams;
		this.refsetGridApi = gridReadyParams.api;
		this.refsetGridApi.setFilterModel(null);
		this.refsetGridColumnApi = gridReadyParams.columnApi;
		this.onResize(undefined);

		const _window = window;
		_window['checkboxHandleClick'] = (event) => {
			this.gridSelectAll == undefined || this.gridSelectAll ? (this.gridSelectAll = false) : (this.gridSelectAll = true);
			this.mapsetData = this.mapsetData.map((set) => {
				set.checked = this.gridSelectAll;
				return set;
			});
			this.refsetGridApi.setRowData(this.mapsetData);
			this.refsetGridApi.forEachNode((node) => node.setSelected(this.gridSelectAll));
		};

		this.refsetGridApi.showLoadingOverlay();
		let query = '';

		if (CodeUtility.hasValue(this.searchInput) && this.searchInput.length > 2) {
			query = CodeUtility.addIfNotEmpty(query, ' AND ') + this.searchInput;
		}

		const pageNumber = 1;
		this.refsetGridPaging.totalRows = null;
		this.refsetGridPaging.totalKnown = false;
		this.refsetGridApi?.api?.paginationGoToPage(0);

		const restParams: any = {
			displayType: 'list',
			offset: pageNumber - 1,
			searchConcepts: true,
			showInDevelopment: true,
			countComments: true,
		};

		if (CodeUtility.hasValue(query)) {
			query = query.replace(/\//g, '%2F').replace(/%/g, '%25');
			restParams.query = query;
		}

		this.refsetService.getMappingsByMapset(this.mapsetCode).subscribe({
			next: (results) => {
				this.showLoadingSearch = false;
				results = results.items;
				const data = [];
				let count = 0;
				for (let a = 0; a < results.length; a++) {
					for (let b = 0; b < results[a].mapEntries.length; b++) {
						let spanned = false;
						if (results[a].mapEntries.length > 1) {
							if (b >= 1) {
								spanned = true;
							}
						} else {
							results[a].mapEntries[b].group = '';
						}
						data.push({
							'index': count,
							'spanned': spanned,
							'downloadable': true,
							'mapEntries': results[a].mapEntries,
							'entries': results[a].mapEntries.length,
							'code': results[a].code,
							'name': results[a].name,
							'toName': results[a].mapEntries[b].toName.length > 0 && results[a].mapEntries[b].toName !== ' DOES NOT EXIST' ? results[a].mapEntries[b].toName : '---',
							'toCode':
								results[a].mapEntries[b].toCode.length > 0
									? results[a].mapEntries[b].group + '/' + results[a].mapEntries.length + '#' + results[a].mapEntries[b].toCode
									: 'No map entries available.',
							'rule': results[a].mapEntries[b].rule.length > 0 ? results[a].mapEntries[b].rule : '---',
							'relation': results[a].mapEntries[b].relation.length > 0 ? results[a].mapEntries[b].relation : '---',
							'modified': results[a].mapEntries[b].modified,
							'advices': results[a].mapEntries[b].advices,
							'group': results[a].mapEntries[b].group,
							'priority': results[a].mapEntries[b].priority,
						});
						count++;
					}
				}
				results = data;
				this.mapsetData = data;
				this.loaded = true;
				this.numOfMembers = this.numOfMembers ? this.numOfMembers : results.length; //total;
				this.numOfResults = results.length; //total;

				if (results.length == 0) {
					this.refsetGridPaging.totalKnown = true;
					this.refsetGridApi.showNoRowsOverlay();
					this.refsetGridApi.setRowData([]);

					if (pageNumber > 1) {
						this.refsetGridPaging.totalRows = this.refsetGridApi.paginationGetPageSize() * (pageNumber - 1);
						this.refsetGridPaging.totalKnown = true;
						this.paginationComponent.goToPage(pageNumber - 1);
					}

					return;
				}

				UiUtility.applyServerPagedGridResults(results, this.refsetGridApi, this.refsetGridPaging, pageNumber, null, false);
			},
			error: (error) => {
				this.refsetGridApi.showNoRowsOverlay();
				this.refsetGridApi.setRowData([]);
			},
		});

		// set placeholders on the grid floating filter fields
		Array.from(document.querySelectorAll('.ag-floating-filter-body .ag-input-field-input')).forEach((obj: any) => {
			if (obj.attributes['disabled']) {
				// skip columns with disabled filter
				return;
			}

			const label = obj.getAttribute('aria-label');
			const value = label.substring(0, label.indexOf('Filter Input')) + '...';
			obj.setAttribute('placeholder', value);
		});
	};

	getRowData() {
		const rows = [];
		this.refsetGridApi.getModel().rowsToDisplay.map((node) => {
			rows.push(node.data);
		});
		return rows;
	}

	checkboxRowSelect(event, index) {
		if (index) {
			this.mapsetData[index].checked == undefined || !this.mapsetData[index].checked ? (this.mapsetData[index].checked = true) : (this.mapsetData[index].checked = false);
			const selectedIndexes = [index];
			if (this.mapsetData[index].entries > 1) {
				for (let d = 1; d < this.mapsetData[index].entries; d++) {
					selectedIndexes.push(index + d);
					this.mapsetData[index + d].checked = this.mapsetData[index].checked;
				}
			}
			for (let c = 0; c < selectedIndexes.length; c++) {
				this.refsetGridApi.forEachNode((node) => {
					if (node.rowIndex == selectedIndexes[c]) {
						node.setSelected(this.mapsetData[selectedIndexes[c]].checked);
					}
				});
			}
		}
	}

	openPopover(params: any) {
		this.refsetGridApi.forEachNode((node) => {
			if (node.data.advices_open) {
				node.data.advices_open = false;
			}
		});
		params.data.advices_open = true;
		let popHeight = 0;
		const showInterval = setInterval(() => {
			params.data.advice_top = true;
			params.data.advice_bottom = false;
			popHeight = document.getElementById('popover_' + params.data.code).offsetHeight;
			this.advicePopoverLocation = '45px';
			let offsetRows = 2;
			if (popHeight > 100) {
				offsetRows = 3;
			}
			const currentPageIndex = this.paginationComponent.getCurrentPage() * this.refsetGridApi.paginationGetPageSize() - this.refsetGridApi.paginationGetPageSize();
			if (params.node.rowIndex > 0 && params.node.rowIndex - currentPageIndex + offsetRows >= this.refsetGridApi.paginationGetPageSize()) {
				params.data.advice_bottom = true;
				params.data.advice_top = false;
				this.advicePopoverLocation = Number(-popHeight + 5) + 'px';
			}
			if (params.node.rowIndex + offsetRows >= this.mapsetData.length) {
				params.data.advice_bottom = true;
				params.data.advice_top = false;
				this.advicePopoverLocation = Number(-popHeight + 5) + 'px';
			}
			clearInterval(showInterval);
		}, 5);
	}

	closePopover(params: any) {
		params.data.advices_open = false;
	}

	onGridCellClick = (event) => {
		if (event.column.colId === 'code') {
			this.goToMappingPage(event.data.code);
			return;
		}
		if (event.column.colId !== 'advices') {
			this.refsetGridApi.forEachNode((node) => {
				if (node.data.advices_open) {
					node.data.advices_open = false;
				}
			});
		}
	};

	gridEvent(action): void {
		//console.log(action);
		const selectedRows = this.refsetGridApi.getSelectedRows();
		//console.log(selectedRows);
		this.openToBeDevelopedModal(this.tbdModal);
	}

	@Debounce()
	changedVersionStatus() {
		this.showLoadingSearch = true;
		//this.onGridReady(this.originalGridParams);
		this.openToBeDevelopedModal(this.tbdModal);
	}

	downloadMapsets() {
		this.openDownloadModal(this.downloadModal);
	}

	startDownload() {
		this.closeDownloadModal();
		console.log('selected download format', this.selectedFormat['value']);
		this.openToBeDevelopedModal(this.tbdModal);
	}

	clearSearch() {
		this.showLoadingSearch = false;
		if (this.searchInput) {
			this.searchInput = '';
			this.onSearchChange();
		}
	}

	@Debounce()
	onSearchChange() {
		this.searchInput = this.searchInput.trim();
		if (!CodeUtility.hasValue(this.searchInput) || (CodeUtility.hasValue(this.searchInput) && this.searchInput.length > 2)) {
			this.refsetGridApi.setQuickFilter(this.searchInput);
		}
	}

	//***** General Functions *****/

	openEclBuilder(fieldId) {
		UiUtility.openEclBuilder(fieldId, 'MAIN');
	}

	openToBeDevelopedModal(content) {
		this.toBeDevelopedModalRef = this.modalService.open(content, { centered: true });
		this.isModalOpen = true;
	}

	closeToBeDevelopedModal() {
		this.toBeDevelopedModalRef.close();
		this.isModalOpen = false;
	}

	openDownloadModal(content) {
		this.downloadModalRef = this.modalService.open(content, { centered: true });
		this.isModalOpen = true;
	}

	closeDownloadModal() {
		this.downloadModalRef.close();
		this.isModalOpen = false;
	}

	goToDetailsPage(refsetId, versionDate) {
		const url = new URL(window.location.href);
		url.searchParams.set('reload', 'true');
		window.history.pushState({}, '', url.href);
		this.router.navigate(['/details', refsetId, versionDate], { replaceUrl: false, skipLocationChange: false });
	}

	goToMappingPage(code) {
		const url = new URL(window.location.href);
		window.history.pushState({}, '', url.href);
		this.router.navigate(['/mapset/' + this.mapsetCode + '/mapping/' + code], { replaceUrl: false, skipLocationChange: false });
	}

	getRefsetRow(refsetId: string) {
		let refset;

		for (let i = 0; i < this.mapsetData.length; i++) {
			if (this.mapsetData[i].refsetId == refsetId) {
				refset = this.mapsetData[i];
				break;
			}
		}

		return refset;
	}

	getInfoIcon(type: string): string {
		let icon = '';
		switch (type) {
			case 'relation':
				icon = '';
				break;
			case 'advice':
				icon = 'star-of-life';
				break;
			case 'other':
				icon = 'flag';
				break;
		}
		return icon;
	}

	openInformation(refsetId: string) {
		const refsetDirectoryData = this.getRefsetRow(refsetId);

		this.refsetService.getRefset(refsetDirectoryData.refsetId, RefsetUtility.getVersionDateForRefsetApiCall(refsetDirectoryData)).subscribe((results) => {
			const refset = results;
			const dialogId = 'directoryInfoDialog';
			this.directUrl = (window.location.protocol + '//' + window.location.host + this.router.url).replace(
				'library',
				'details/' + refset.refsetId + '/' + RefsetUtility.getVersionDateForRefsetApiCall(refset)
			);

			if (CodeUtility.hasValue(refset)) {
				refset.status = RefsetUtility.getStatus(refset.active);
				if (CodeUtility.hasValue(refset.narrative)) {
					refset.narrativeShortText = refset.narrative;
				}

				if (CodeUtility.hasValue(refset.versionNotes)) {
					refset.versionNotesShortText = refset.versionNotes;
				}

				refset.versionDate = CodeUtility.formatJsonDate(refset.versionDate);
				refset.flagIcon = RefsetUtility.getEditionFlagIcon(refset.edition.branch);

				//change to use: = refset.edition.LibrarySortField;
				refset.librarySortField = refset.edition.branch;
			}

			refset.versionList = results.versionList;

			const dialogData = {
				dialogId: dialogId,
				showCancel: false,
				cancelText: 'Close',
				actionText: 'View Complete Reference Set',
				showConfirm: false,
				template: this.infoDialog,
				headerText: 'Reference Set Metadata',
				data: refset,
				showAction: true,
				showCloseIcon: true,
			};

			const dialogOptions = {
				id: dialogId,
				width: '1000px',
				disableClose: false,
			};

			this.dialog = this.dialogFactoryService.open(dialogData, dialogOptions);

			this.dialog.confirmed().subscribe((data) => {
				if (data) {
					this.goToDetailsPage(refset.refsetId, RefsetUtility.getVersionDateForRefsetApiCall(refset));
				}
			});
		});
	}

	openFeedback(refsetId: string) {
		const refset = this.getRefsetRow(refsetId);
		const dialogId = 'directoryFeedbackDialog';

		const dialogData = {
			headerText: `Reference Set Feedback for ${refset.name} (${refset.refsetId})`,
			template: this.feedbackDialog,
			data: refset,
		};

		const dialogOptions = {
			id: dialogId,
			disableClose: false,
		};

		this.dialog = this.dialogFactoryService.open(dialogData, dialogOptions);

		this.dialog.confirmed().subscribe((data) => {
			if (data) {
				refset.feedback = data.feedback;
			}
		});
	}

	setFullNarrativeText(show: boolean): void {
		this.showFullNarrativeText = show;
	}

	setFullNotesText(show: boolean): void {
		this.showFullNotesText = show;
	}

	capitalizeFirstLetterOfString(stringValue: string): string {
		if (stringValue) {
			return stringValue.toLowerCase().replace(/(?:^|\s|[-"'([{])+\S/g, (c) => c.toUpperCase());
		}

		return stringValue;
	}

	onResize(event) {
		const sectionWidth = $('.section-background').parent().width();
		document.getElementsByClassName('ag-header')[0]?.setAttribute('style', `width: ${sectionWidth}px;`);
		this.resizeSectionView();
	}

	setDescriptions(mapsetData: any): Array<string> {
		return mapsetData?.descriptions;
	}

	showFlagIcon(event, show) {
		if (show) {
			event.target.style.display = 'inline';
		} else {
			event.target.style.display = 'none';
		}
	}

	latestDate(refset, versionList: any[]): string {
		if (refset.versionStatus === Constants.IN_DEVELOPMENT) {
			return 'Latest';
		}
		return versionList && versionList[0] ? `${versionList[0].date}` : '';
	}

	toggleSectionView(section: string) {
		if (this[section]) {
			this[section] = false;
		} else {
			this[section] = true;
			this.onResize(undefined);
		}

		this.resizeSectionView();
	}

	resizeSectionView() {
		const sectionHeight = $('.section-background').parent().parent().height();
		let sectionsMinHeight = 0;
		let sectionsMaxHeight = 0;

		sectionsMinHeight = 85;
		const sectionsSectionHeight = 140; //242;
		if (this.showMappingsSection) {
			sectionsMaxHeight = sectionHeight - sectionsSectionHeight;
		}
		if (this.showMetadataSection && this.showHistorySection) {
			sectionsMaxHeight = sectionHeight - sectionsSectionHeight - sectionsMinHeight * 2;
		} else {
			if (this.showMetadataSection || this.showHistorySection) {
				sectionsMaxHeight = sectionHeight - sectionsSectionHeight - sectionsMinHeight;
			}
		}

		if (this.showMappingsSection) {
			document.getElementsByClassName('mappings-section')[0]?.setAttribute('style', `max-height: ${sectionsMaxHeight}px;`);
		}
		if (this.showMetadataSection) {
			document.getElementsByClassName('metadata-section')[0]?.setAttribute('style', `max-height: ${sectionsMinHeight}px;`);
		}
		if (this.showHistorySection) {
			document.getElementsByClassName('history-section')[0]?.setAttribute('style', `max-height: ${sectionsMinHeight}px;`);
		}
	}
}
