import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output, ElementRef, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PaginationChangedEvent } from 'ag-grid-community';
import { MatSelect } from '@angular/material/select';
import { DialogService } from 'src/app/dialog/services/dialog.service';
import { DialogFactoryService } from 'src/app/dialog/services/dialog-factory.service';
import { TemplateRendererComponent } from 'src/app/components/cellRenderers/template.renderer';
import { CategoryFilterComponent } from 'src/app/components/categoryFilter/category-filter.component';
import { DateTextFilterComponent } from 'src/app/components/dateTextFilter/date-text-filter.component';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { MT2Service } from 'src/app/services/mt2.service';
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
import { PaginationService } from 'src/app/services/pagination.service';

@Component({
	standalone: false,
	selector: 'app-mapset-inactives',
	templateUrl: './mapset-inactives.component.html',
	styleUrls: ['./mapset-inactives.component.css'],
})
export class MapsetInactivesComponent implements OnInit {
	user: User;
	searchInput = '';
	viewOptions = [
		{ value: 'all', display: 'All' },
		{ value: 'public', display: 'Public' },
		{ value: 'private', display: 'Private' },
	];
	selectedVersion: any;
	refsetGridApi: any;
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
	paginationPages: any = {};
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
	toBeDevelopedModalRef: NgbModalRef;
	downloadModalRef: NgbModalRef;
	notesModalRef: NgbModalRef;
	feedbackModalRef: NgbModalRef;
	isModalOpen = false;
	mapsetName = 'Mapset Name';
	mapsetCode: string;
	mapsetInfo: any = {};
	routeParamsSubscription$: Subscription;
	gridSelectAll = false;
	advicePopoverLocation = '45px';
	showMapTable = 'table';
	checkedNum = 0;
	useDialog = false;
	showMappingsSection = true;
	showBrowserSection = false;
	selectedFormat = {};
	formats = [];
	selectedType = {};
	types = [];
	downloadTitle = '';
	downloadError = '';
	notesEditor = '';
	notesError = '';
	notesTitle = '';
	feedbackSubject = '';
	feedbackEditor = '';
	selectFeedbackPrivate = false;
	feedbackError = '';
	loaded = false;
	showPaging = false;
	datasource: any;
	recordRows = [];
	mapSetSubscription: Subscription;
	isNewPageSize = false;
	internationalId = '449080006';
	moduleMetadata: any;
	rowColors = [{ background: 'white' }, { background: '#f2f2f2' }];
	currentRowColor = 0;
	stepperInfo: any = {};
	stepperStartInfo = {
		READY_FOR_EDIT_COLOR: 'details-page-stepper-unstarted-step',
		READY_FOR_EDIT_STARTED: false,
		READY_FOR_REVIEW_COLOR: 'details-page-stepper-unstarted-step',
		READY_FOR_REVIEW_STARTED: false,
		REVIEW_COMPLETED_COLOR: 'details-page-stepper-unstarted-step',
		REVIEW_COMPLETED_STARTED: false,
		READY_FOR_PUBLICATION_COLOR: 'details-page-stepper-unstarted-step',
		READY_FOR_PUBLICATION_STARTED: false,
		PUBLISHED_COLOR: 'details-page-stepper-unstarted-step',
		PUBLISHED_STARTED: false,
		IN_EDIT_COLOR: 'details-page-stepper-unstarted-step',
		IN_EDIT_STARTED: false,
		IN_REVIEW_COLOR: 'details-page-stepper-unstarted-step',
		IN_REVIEW_STARTED: false,
		IN_PUBLICATION_COLOR: 'details-page-stepper-unstarted-step',
		IN_PUBLICATION_STARTED: false,
		IN_UPGRADE_COLOR: 'details-page-stepper-unstarted-step',
		IN_UPGRADE_STARTED: false,
	};

	@Output() loadingSpinner = new EventEmitter<boolean>(true);

	@ViewChild('directoryInfoDialog') infoDialog: TemplateRef<any>;
	@ViewChild('directoryFeedbackDialog') feedbackDialog: TemplateRef<any>;
	@ViewChild('toBeDevelopedModal') tbdModal: TemplateRef<any>;
	@ViewChild('directoryCheckSection') checkSection: TemplateRef<any>;
	@ViewChild('directoryPlusMinusSection') plusMinusSection: TemplateRef<any>;
	@ViewChild('directoryInfoSection') infoSection: TemplateRef<any>;
	@ViewChild('directoryCodeSection') codeSection: TemplateRef<any>;
	@ViewChild('directorySourceCodeSection') sourceCodeSection: TemplateRef<any>;
	@ViewChild('directoryNameSection') nameSection: TemplateRef<any>;
	@ViewChild('directoryToNameSection') toNameSection: TemplateRef<any>;
	@ViewChild('directoryAdviceSection') adviceSection: TemplateRef<any>;
	@ViewChild('directoryEditionSection') editionSection: TemplateRef<any>;
	@ViewChild('directoryActionSection') actionSection: TemplateRef<any>;
	@ViewChild('directoryPaging') paginationComponent: PaginationComponent;
	@ViewChild('directoryCategoryFilter') categoryFilter: TemplateRef<any>;
	@ViewChild('directoryWorkflowStatusSection') versionStatus: TemplateRef<any>;
	@ViewChild('downloadModal') downloadModal: TemplateRef<any>;
	@ViewChild('notesModal') notesModal: TemplateRef<any>;
	@ViewChild('feedbackModal') feedbackModal: TemplateRef<any>;
	@ViewChild('actions') private actions: MatSelect;
	@ViewChild('directorySearchInput') private directorySearchInput: ElementRef;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private titleService: Title,
		private dialogFactoryService: DialogFactoryService,
		private refsetService: RefsetService,
		private mt2Service: MT2Service,
		private changeDetectorRef: ChangeDetectorRef,
		private breadcrumbService: BreadcrumbService,
		private authenticationService: AuthenticationService,
		private modalService: NgbModal,
		private pagerService: PaginationService,
	) {
		document.body.scrollTop = 0;
	}

	//***** Framework Functions *****/
	ngOnInit() {
		this.user = this.authenticationService.getUser();
		this.titleService.setTitle('Mapping Tool - Manage Inactives');
		this.routeParamsSubscription$ = this.route.params.subscribe((routeParams) => {
			this.mapsetCode = routeParams.code;
			this.getMapsetInfo();
			this.getModuleMetadata();
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
		this.refsetService.getMapsetByCode(this.mapsetCode).subscribe((results) => {
			this.mapsetInfo = results;
			this.mapsetName = this.mapsetInfo.refSetName;
			this.breadcrumbService.setBreadcrumbs([{ path: '/library', label: 'Library' }, { label: this.mapsetName }]);
			this.versionStatuses.push(formatDate(this.mapsetInfo.modified, 'MM-dd-yyyy', 'en-US') + ' (' + this.mapsetInfo.versionStatus + ') ');
			if (this.versionStatuses.length == 1) {
				this.selectedVersion = this.versionStatuses;
			}

			const stepperClass = 'details-page-stepper-started-step';
			this.stepperInfo = CodeUtility.clone(this.stepperStartInfo);
			switch (this.mapsetInfo.workflowStatus) {
				case 'READY_FOR_EDIT':
					this.stepperInfo['READY_FOR_EDIT_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_EDIT_STARTED'] = true;
					break;
				case 'IN_EDIT':
					this.stepperInfo['IN_EDIT_COLOR'] = stepperClass;
					this.stepperInfo['IN_EDIT_STARTED'] = true;
					break;
				case 'IN_UPGRADE':
					this.stepperInfo['IN_UPGRADE_COLOR'] = stepperClass;
					this.stepperInfo['IN_UPGRADE_STARTED'] = true;
					break;
				case 'READY_FOR_REVIEW':
					this.stepperInfo['READY_FOR_EDIT_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_EDIT_STARTED'] = true;
					this.stepperInfo['READY_FOR_REVIEW_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_REVIEW_STARTED'] = true;
					break;
				case 'IN_REVIEW':
					this.stepperInfo['IN_REVIEW_COLOR'] = stepperClass;
					this.stepperInfo['IN_REVIEW_STARTED'] = true;
					break;
				case 'REVIEW_COMPLETED':
					this.stepperInfo['READY_FOR_EDIT_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_EDIT_STARTED'] = true;
					this.stepperInfo['READY_FOR_REVIEW_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_REVIEW_STARTED'] = true;
					this.stepperInfo['REVIEW_COMPLETED_COLOR'] = stepperClass;
					this.stepperInfo['REVIEW_COMPLETED_STARTED'] = true;
					break;
				case 'READY_FOR_PUBLICATION':
					this.stepperInfo['READY_FOR_EDIT_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_EDIT_STARTED'] = true;
					this.stepperInfo['READY_FOR_REVIEW_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_REVIEW_STARTED'] = true;
					this.stepperInfo['REVIEW_COMPLETED_COLOR'] = stepperClass;
					this.stepperInfo['REVIEW_COMPLETED_STARTED'] = true;
					this.stepperInfo['READY_FOR_PUBLICATION_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_PUBLICATION_STARTED'] = true;
					break;
				case 'IN_PUBLICATION':
					this.stepperInfo['IN_PUBLICATION_COLOR'] = stepperClass;
					this.stepperInfo['IN_PUBLICATION_STARTED'] = true;
					break;
				case 'PUBLISHED':
					this.stepperInfo['READY_FOR_EDIT_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_EDIT_STARTED'] = true;
					this.stepperInfo['READY_FOR_REVIEW_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_REVIEW_STARTED'] = true;
					this.stepperInfo['REVIEW_COMPLETED_COLOR'] = stepperClass;
					this.stepperInfo['REVIEW_COMPLETED_STARTED'] = true;
					this.stepperInfo['READY_FOR_PUBLICATION_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_PUBLICATION_STARTED'] = true;
					this.stepperInfo['PUBLISHED_COLOR'] = stepperClass;
					this.stepperInfo['PUBLISHED_STARTED'] = true;
					break;
				default: //null
					this.stepperInfo['READY_FOR_EDIT_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_EDIT_STARTED'] = true;
					break;
			}

			this.columnDefs = [
				{
					field: 'index',
					tooltipField: '',
					colId: 'checkbox',
					headerName: '',
					headerTooltip: 'Check/Uncheck All',
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
							'    <label class="checkbox-override checkbox-header"><input type="checkbox" onclick="checkboxHandleClick()" id="checkbox-table-all" >' +
							'    <span class="checkbox-container"></span></label>' +
							'    <span ref="eFilter" class="ag-header-icon ag-filter-icon"></span>' +
							'  </div>' +
							'</div>',
					},
					unSortIcon: false,
					filter: false,
					resizable: false,
					sortable: false,
					suppressSorting: true,
					getQuickFilterText: (params) => {
						return '';
					},
				},
				{
					field: 'active',
					tooltipField: '',
					colId: 'active',
					headerName: '',
					minWidth: 55,
					width: 55,
					cellRenderer: TemplateRendererComponent,
					cellRendererParams: { template: this.plusMinusSection },
					headerComponentParams: {
						template: '<div class="ag-cell-label-container" role="presentation">' + '</div>',
					},
					unSortIcon: false,
					filter: false,
					resizable: false,
					sortable: false,
					suppressSorting: true,
					getQuickFilterText: (params) => {
						return '';
					},
				},
				{
					field: 'code',
					tooltipField: 'code',
					headerName: 'Source',
					headerTooltip: 'Source',
					flex: 1,
					minWidth: 125,
					cellRenderer: TemplateRendererComponent,
					cellRendererParams: {
						template: this.sourceCodeSection,
					},
					resizable: true,
					unSortIcon: false,
					sortable: false,
					suppressSorting: true,
				},
				{
					field: 'name',
					tooltipField: 'name',
					headerName: 'Source PT',
					headerTooltip: 'Source PT',
					flex: 2,
					resizable: true,
					minWidth: 165,
					cellRenderer: TemplateRendererComponent,
					cellRendererParams: { template: this.nameSection },
					sortable: false,
					unSortIcon: false,
					suppressSorting: true,
				},
				{
					field: 'toCode',
					headerName: 'Target',
					headerTooltip: 'Target',
					flex: 1,
					minWidth: 135,
					cellRenderer: TemplateRendererComponent,
					cellRendererParams: {
						template: this.codeSection,
					},
					resizable: true,
					unSortIcon: false,
					sortable: false,
					suppressSorting: true,
				},
				{
					field: 'toName',
					tooltipField: 'toName',
					headerName: 'Target PT',
					headerTooltip: 'Target PT',
					resizable: true,
					unSortIcon: true,
					sortable: false,
					suppressSorting: true,
					cellRenderer: TemplateRendererComponent,
					cellRendererParams: { template: this.toNameSection },
				},

				{
					field: 'relation',
					tooltipField: 'relation',
					headerName: 'Relationship',
					headerTooltip: 'Relationship',
					cellClass: 'rt2-directory-column-id',
					resizable: true,
					unSortIcon: true,
					sortable: false,
					suppressSorting: true,
					flex: 1,
					minWidth: 100,
				},
				{
					field: 'rule',
					tooltipField: 'rule',
					headerName: 'Rule',
					headerTooltip: 'Rule',
					cellClass: 'rt2-directory-column-id',
					flex: 1,
					minWidth: 85,
					resizable: true,
					unSortIcon: true,
					sortable: false,
					suppressSorting: true,
				},
				{
					field: 'advices',
					headerName: 'Advices',
					headerTooltip: 'Advices',
					cellClass: 'rt2-directory-column-version-date',
					minWidth: 65,
					width: 95,
					resizable: true,
					cellRenderer: TemplateRendererComponent,
					cellRendererParams: { template: this.adviceSection },
					unSortIcon: true,
					sortable: false,
					suppressSorting: true,
				},
				{
					field: 'rule',
					tooltipField: 'rule',
					headerName: 'Inactivation Reason',
					headerTooltip: 'Inactivation Reason',
					cellClass: 'rt2-directory-column-id',
					flex: 1,
					minWidth: 105,
					resizable: true,
					unSortIcon: true,
					sortable: false,
					suppressSorting: true,
				},
				{
					field: 'rule',
					tooltipField: 'rule',
					headerName: 'Association',
					headerTooltip: 'Association',
					cellClass: 'rt2-directory-column-id',
					flex: 1,
					minWidth: 105,
					resizable: true,
					unSortIcon: true,
					sortable: false,
					suppressSorting: true,
				},
				{
					field: 'modified',
					tooltipValueGetter: UiUtility.gridDateValueGetter,
					headerName: 'Last Modified',
					headerTooltip: 'Last Modified',
					cellClass: 'rt2-directory-column-modified-date',
					minWidth: 65,
					width: 125,
					resizable: true,
					valueGetter: UiUtility.gridDateValueGetter,
					floatingFilterComponent: DateTextFilterComponent,
					floatingFilterComponentParams: { suppressFilterButton: true },
					unSortIcon: true,
					sortable: false,
					suppressSorting: true,
				},
				{
					field: 'downloadable',
					colId: 'action-btns',
					headerName: '',
					width: 90,
					cellClass: 'rt2-directory-column-actions',
					cellRenderer: TemplateRendererComponent,
					cellRendererParams: { template: this.actionSection },
					sortable: false,
					filter: false,
					resizable: false,
					suppressSorting: true,
					getQuickFilterText: (params) => {
						return '';
					},
				},
			];

			this.refsetGridOptions = {
				pagination: true,
				rowModelType: 'infinite',
				suppressScrollOnNewData: true,
				suppressColumnMoveAnimation: true,
				suppressDragLeaveHidesColumns: true,
				debounceVerticalScrollbar: true,
				animateRows: false,
				cacheBlockSize: this.refsetGridPaging.pageSize,
				debug: false,
				cacheOverflowSize: 2,
				maxBlocksInCache: 2,
				maxConcurrentDatasourceRequests: 2,
				paginationPageSize: this.refsetGridPaging.pageSize,
				serverSideEnableClientSideSort: true,
				paginationPageSizeSelector: this.refsetGridPaging.pageSizeOptions,
				datasource: this.createDataSource(),
				onPaginationChanged: (event: any) => this.onPaginationChanged(event),
				context: { componentParent: this },
				angularCompileHeaders: true,
				suppressColumnVirtualisation: true,
				suppressPaginationPanel: true,
				enableCellTextSelection: true,
				domLayout: 'autoHeight',
				onCellDoubleClicked: this.onGridCellClick,
				onGridReady: this.onGridReady,
				frameworkComponents: {
					templateRenderer: TemplateRendererComponent,
					categoryFilterComponent: CategoryFilterComponent,
					dateTextFilterComponent: DateTextFilterComponent,
				},
				defaultColDef: {
					sortable: false,
					filter: false,
					sortingOrder: ['asc', 'desc'],
					floatingFilter: false,
					suppressMenu: true,
					resizable: true,
					suppressSorting: true,
					suppressMovable: true,
				},
				enableBrowserTooltips: true,
				rowClassRules: {
					refset_tool_grid_inactive_row: function (params) {
						let inactivatedRow = false;
						if (params.data) {
							inactivatedRow = params.data.active === false;
						}
						return inactivatedRow;
					},
					refset_tool_grid_processed_row: function (params) {
						let processedRow = false;
						if (params.data) {
							processedRow = params.data.processed === true;
						}
						return processedRow;
					},
					refset_tool_grid_processed_inactive_row: function (params) {
						let processedInactiveRow = false;
						if (params.data) {
							processedInactiveRow = params.data.processed === true && params.data.active === false;
						}
						return processedInactiveRow;
					},
				},
			};
			this.showTable = true;
		});
	}

	getModuleMetadata() {
		if (this.mt2Service.moduleMetadata.value?.length === 0) {
			this.refsetService.getMetadata().subscribe({
				next: (results) => {
					this.mt2Service.setModuleMetadata(results);
					this.moduleMetadata = results;
				},
			});
		} else {
			this.moduleMetadata = this.mt2Service.moduleMetadata.value;
		}
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

	menuOpened() {
		this.directorySearchInput.nativeElement.focus();
	}

	changeMappingsView(value: string): void {
		this.openToBeDevelopedModal(this.tbdModal);
		//filter by unprocessed or show all
	}

	checkboxAllClick() {
		this.gridSelectAll == undefined || this.gridSelectAll ? (this.gridSelectAll = false) : (this.gridSelectAll = true);
		this.mapsetData = this.mapsetData.map((set) => {
			set.checked = this.gridSelectAll;
			return set;
		});
		this.refsetGridApi.redrawRows();
		this.checkedNum = this.gridSelectAll ? this.mapsetData.length : 0;
	}

	onGridReady = (gridReadyParams) => {
		this.refsetGridApi = gridReadyParams.api;
		// this.refsetGridApi.setColumnDefs(this.columnDefs);

		const _window = window;
		_window['checkboxHandleClick'] = () => {
			this.checkboxAllClick();
		};

		if (this.mapSetSubscription) {
			this.mapSetSubscription.unsubscribe();
		}
	};

	createDataSource() {
		return {
			rowCount: null,
			getRows: (rowParams) => {
				const startRow = rowParams.startRow;
				const endRow = rowParams.endRow;
				const sortModel = rowParams.sortModel;
				this.refsetGridApi.showLoadingOverlay();

				let query = '';

				if (CodeUtility.hasValue(this.searchInput) && this.searchInput.length > 2) {
					query = CodeUtility.addIfNotEmpty(query, ' AND ') + this.searchInput;
				}

				if (this.isNewPageSize) {
					rowParams.failCallback();
				} else {
					this.loaded = false;
					let limit = endRow - startRow;

					if (this.numOfMembers > 0) {
						if (startRow + limit > this.numOfMembers) {
							limit = this.numOfMembers - startRow;
						}
					}
					if (this.refsetGridPaging.pageSize === undefined) {
						this.refsetGridPaging.pageSize = 10;
					}
					const restParams: any = {
						offset: startRow,
						limit: this.refsetGridPaging.pageSize,
					};

					if (CodeUtility.hasValue(query)) {
						query = query.replace(/\//g, '%2F').replace(/%/g, '%25');
						restParams.filter = query;
					} else {
						restParams.filter = '';
					}
					this.mapSetSubscription = this.refsetService.getMappingsByMapset(this.mapsetCode, restParams).subscribe({
						next: (results) => {
							this.changeDetectorRef.detectChanges();
							this.loaded = false;
							const mapsetResults = results;
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
										//results[a].mapEntries[b].group = '';
									}
									const adviceArray = [];
									for (let i = 0; i < results[a].mapEntries[b].advices.length; i++) {
										adviceArray.push(results[a].mapEntries[b].advices[i]);
									}
									data.push({
										index: results[a].code !== '' ? a + results[a].code + count : false,
										spanned: spanned,
										downloadable: results[a].code !== '' ? true : false,
										mapEntries: results[a].mapEntries,
										descriptions: results[a].descriptions,
										entries: results[a].mapEntries.length,
										code: results[a].code,
										name: results[a].name,
										active: results[a].active,
										toName:
											results[a].mapEntries[b].toName.length > 0 && results[a].mapEntries[b].toName !== ' DOES NOT EXIST'
												? results[a].mapEntries[b].toName
												: '---',
										toCode:
											results[a].mapEntries.length > 0
												? results[a].mapEntries[b].group +
													'/' +
													results[a].mapEntries[b].priority +
													'&' +
													results[a].mapEntries.length +
													'#' +
													results[a].mapEntries[b].toCode
												: 'No map entries available.',
										rule: results[a].mapEntries[b].rule.length > 0 ? results[a].mapEntries[b].rule : '---',
										relation: results[a].mapEntries[b].relation.length > 0 ? results[a].mapEntries[b].relation : '---',
										modified: results[a].mapEntries[b].modified,
										advices:
											results[a].code !== '' ? { number: adviceArray.length, list: adviceArray } : { number: -1, list: [] },
										group: results[a].mapEntries[b].group,
										priority: results[a].mapEntries[b].priority,
										moduleId: results[a].mapEntries[b].moduleId,
										modFlag: this.getModuleLanguageIcon(results[a].mapEntries[b].moduleId),
										modLang: this.getModuleLanguageName(results[a].mapEntries[b].moduleId),
									});
									count++;
								}
							}

							this.mapsetData = data;
							mapsetResults.items = this.mapsetData;
							this.numOfMembers = mapsetResults.total;
							this.numOfResults = mapsetResults.total;

							const lastIndexH = document.getElementsByClassName('ag-header').length - 1;
							const childH = document.getElementsByClassName('ag-header')[lastIndexH];
							document.getElementById('directoryHeader').appendChild(childH);
							const lastIndexP = document.getElementsByClassName('ag-paging-panel').length - 1;
							const childP = document.getElementsByClassName('ag-paging-panel')[lastIndexP];
							document.getElementById('directoryPaging').appendChild(childP);

							this.showPaging = true;

							if (data?.length > 0) {
								this.showPaging = true;
								this.refsetGridApi.hideOverlay();
								this.paginationPages = Math.ceil(this.numOfMembers / this.refsetGridPaging.pageSize)
									? this.pagerService.getPager(
											Math.ceil(this.numOfMembers / this.refsetGridPaging.pageSize),
											this.refsetGridApi.paginationGetCurrentPage(),
											true,
										)
									: {};

								this.paginationPages.currentPage = this.getCurrentPage();

								this.loaded = true;
								const lastRow = this.numOfMembers;
								rowParams.successCallback(data, lastRow);
							} else {
								this.showPaging = false;
								this.refsetGridApi.showNoRowsOverlay();
								rowParams.successCallback([], 0);
							}

							this.refsetGridPaging.manualStateRefresh = Boolean(true);
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
							this.mapSetSubscription.unsubscribe();
						},
						error: (error) => {
							this.refsetGridApi.showNoRowsOverlay();
							rowParams.successCallback([], 0);
						},
					});
				}
			},
		};
	}

	checkboxRowSelect(event, index) {
		for (let d = 0; d < this.mapsetData.length; d++) {
			if (this.mapsetData[d].index === index) {
				if (this.mapsetData[d].checked === undefined) {
					this.mapsetData[d].checked = true;
				} else {
					if (!this.mapsetData[d].checked) {
						this.mapsetData[d].checked = true;
					} else {
						this.mapsetData[d].checked = false;
					}
				}
			}
		}
		this.checkedNum = 0;
		for (let c = 0; c < this.mapsetData.length; c++) {
			if (this.mapsetData[c].checked === true) {
				this.checkedNum++;
			}
		}
	}

	onStatusChange(status, index) {
		for (let d = 0; d < this.mapsetData.length; d++) {
			if (this.mapsetData[d].index === index) {
				this.mapsetData[d].active = status;
				this.refsetGridApi.setGridOption('rowData', this.mapsetData);
				this.refsetGridApi.redrawRows();
			}
		}
	}

	getModuleLanguageIcon(moduleId: string) {
		let flag = '';
		this.moduleMetadata.module.forEach((data) => {
			if (data.id === moduleId) {
				flag = data.countryCode;
			}
		});
		return flag;
	}

	getModuleLanguageName(moduleId: string) {
		let lang = '';
		this.moduleMetadata.module.forEach((data) => {
			if (data.id === moduleId) {
				lang = data.name;
			}
		});
		return lang;
	}

	getValueLength(params): number {
		let number = 0;
		const value = params.getValue();
		if (value !== undefined) {
			number = value.number;
		}
		//remove 1 for 'ALWAYS'
		number--;
		return number;
	}

	getValueList(params): Array<any> {
		let list = [];
		const value = params.getValue();
		if (value !== undefined) {
			list = value.list;
		}
		return list;
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
			const currentPageIndex =
				this.paginationComponent.getCurrentPage() * this.refsetGridApi.paginationGetPageSize() - this.refsetGridApi.paginationGetPageSize();
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
		if (event.column.colId !== 'checkbox' && event.column.colId !== 'action-btns') {
			this.goToMappingPage(event.data.code);
		}
		/*
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
		}*/
	};

	gridEvent(action): void {
		const selectedRows = this.refsetGridApi.getSelectedRows();
		this.openToBeDevelopedModal(this.tbdModal);
	}

	@Debounce()
	changedVersionStatus() {
		//this.loaded = false;
		//this.onGridReady(this.originalGridParams);
		this.openToBeDevelopedModal(this.tbdModal);
	}

	selectAction(selectedAction: string) {
		switch (selectedAction) {
			case 'processed':
				if (this.checkedNum > 0) {
					const codes = [];
					for (let c = 0; c < this.mapsetData.length; c++) {
						if (this.mapsetData[c].checked === true) {
							this.mapsetData[c].processed = true;
							this.refsetGridApi.setGridOption('rowData', this.mapsetData);
							this.refsetGridApi.redrawRows();
						}
					}
				}
				break;
			case 'include':
				if (this.checkedNum > 0) {
					for (let c = 0; c < this.mapsetData.length; c++) {
						if (this.mapsetData[c].checked === true) {
							this.onStatusChange(true, this.mapsetData[c].index);
						}
					}
				}
				break;
			case 'exclude':
				if (this.checkedNum > 0) {
					for (let c = 0; c < this.mapsetData.length; c++) {
						if (this.mapsetData[c].checked === true) {
							this.onStatusChange(false, this.mapsetData[c].index);
						}
					}
				}
				break;
			case 'download':
				this.downloadReports();
				break;
			case 'note':
				this.openNotes();
				break;
			case 'feedback':
				this.openFeedback();
				break;
			default:
				this.openToBeDevelopedModal(this.tbdModal);
		}
		this.unCheckAll();
	}

	unCheckAll() {
		this.mapsetData.forEach((map) => {
			if (map.checked) {
				map.checked = false;
			}
		});
		this.checkedNum = 0;
		this.refsetGridApi.redrawRows();
	}

	downloadReports() {
		this.selectedFormat = {};
		this.selectedType = {};
		this.downloadError = '';
		this.downloadTitle = 'Download report for ' + this.mapsetName;
		this.formats = [{ value: 'tab', display: 'Tab-Delimited Text File' }];
		this.types = [
			{ value: 'change', display: 'Change Report' },
			{ value: 'inactive', display: 'Inactives Report' },
		];
		this.openDownloadModal(this.downloadModal);
	}

	startDownload() {
		this.downloadError = '';
		if (this.selectedFormat['value'] !== undefined && this.selectedType['value'] !== undefined) {
			//console.log('selected download type', this.selectedType['value']);

			this.closeDownloadModal();
			this.openToBeDevelopedModal(this.tbdModal);
			const params = {
				fileExportType: this.selectedFormat['value'],
			};
			//console.log(' exp para ', params);
			/*
			this.refsetService.exportMapset(params).subscribe(
				(data) => {
					//console.log(' data ', data);
					this.closeDownloadModal();
				},
				(err) => {
					console.error(err);
				}
			);*/
		} else {
			this.downloadError = 'Please select a download type and format.';
		}
	}

	openNotes() {
		this.notesEditor = '';
		this.notesError = '';
		this.notesTitle = 'Create Note';
		this.openNotesModal(this.notesModal);
	}

	saveNotes() {
		this.notesError = '';
		if (this.notesEditor !== '' && this.notesEditor !== null) {
			console.log('notes entry ', this.notesEditor);

			this.closeNotesModal();
			this.openToBeDevelopedModal(this.tbdModal);
		} else {
			this.notesError = 'Please enter your notes.';
		}
	}

	openFeedback() {
		this.feedbackSubject = '';
		this.selectFeedbackPrivate = false;
		this.feedbackEditor = '';
		this.feedbackError = '';
		this.openFeedbackModal(this.feedbackModal);
	}

	saveFeedback() {
		this.feedbackError = '';
		if (this.feedbackEditor !== '' && this.feedbackEditor !== null && this.feedbackSubject !== '' && this.feedbackSubject !== null) {
			console.log('feedback entry ', this.feedbackEditor);
			console.log('feedback subject ', this.feedbackSubject);
			console.log('feedback selectFeedbackPrivate ', this.selectFeedbackPrivate);
			this.closeFeedbackModal();
			this.openToBeDevelopedModal(this.tbdModal);
		} else {
			this.feedbackError = 'Please enter your feedback topic and message.';
		}
	}

	clearSearch() {
		this.loaded = false;
		if (this.searchInput) {
			this.searchInput = '';
			this.onSearchChange();
		}
	}

	/*	@Debounce()
	changedViewFilter() {
		this.loaded = false;
		this.onGridReady(this.originalGridParams);
	}*/
	@Debounce()
	changedViewFilter() {
		//this.loaded = false;
		//this.refsetGridApi.purgeInfiniteCache();
	}

	@Debounce(600)
	onSearchChange() {
		this.searchInput = this.searchInput.trim();
		if (!CodeUtility.hasValue(this.searchInput) || (CodeUtility.hasValue(this.searchInput) && this.searchInput.length > 2)) {
			this.setPageSize(10);
			this.goToPage(0);
			this.loaded = false;
			this.refsetGridApi.purgeInfiniteCache();
		}
	}

	/*Pagination functions */
	onPaginationChanged(event: PaginationChangedEvent) {
		if (this.refsetGridApi) {
			this.isNewPageSize = event.newPageSize ?? false;
			if (this.isNewPageSize) {
				this.loaded = false;
			}
			this.checkedNum = 0;
			if (this.gridSelectAll) {
				window['checkbox-table-all'].click();
			}
			this.refsetGridPaging.pageSize = this.refsetGridApi.paginationGetPageSize();
			this.refsetGridApi.updateGridOptions({
				paginationPageSize: this.refsetGridPaging.pageSize,
				cacheBlockSize: this.refsetGridPaging.pageSize,
			});
		}
	}

	setPageSize(size: number) {
		this.refsetGridApi.paginationGoToFirstPage();
		this.refsetGridApi.setGridOption('paginationPageSize', size);
	}

	goToPage(number: number) {
		this.refsetGridApi.paginationGoToPage(number);
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

	openNotesModal(content) {
		this.notesModalRef = this.modalService.open(content, { centered: true });
		this.isModalOpen = true;
	}

	closeNotesModal() {
		this.notesModalRef.close();
		this.isModalOpen = false;
	}

	openFeedbackModal(content) {
		this.feedbackModalRef = this.modalService.open(content, { centered: true });
		this.isModalOpen = true;
	}

	closeFeedbackModal() {
		this.feedbackModalRef.close();
		this.isModalOpen = false;
	}

	goToMappingsPage(code) {
		this.router.navigate(['/mapset/' + code + '/mappings'], { replaceUrl: false, skipLocationChange: false });
	}

	goToDetailsPage(refsetId, versionDate) {
		this.router.navigate(['/details', refsetId, versionDate]);
	}

	goToMappingPage(code) {
		this.router.navigate(['/mapset/' + this.mapsetCode + '/mapping/' + code], { replaceUrl: false, skipLocationChange: false });
	}

	goToEditMappingPage(code) {
		this.router.navigate(['/mapset/' + this.mapsetCode + '/mapping/' + code + '/edit'], { replaceUrl: false, skipLocationChange: false });
	}

	goToBatchMappingsPage(codes) {
		this.router.navigate(['/mapset/' + this.mapsetCode + '/mappings/' + codes.join('_') + '/batch'], {
			replaceUrl: false,
			skipLocationChange: false,
		});
	}

	getCurrentPage() {
		let current = 1;
		if (this.refsetGridApi) {
			current = this.refsetGridApi.paginationGetCurrentPage();
		}
		return current;
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

		this.refsetService
			.getRefset(refsetDirectoryData.refsetId, RefsetUtility.getVersionDateForRefsetApiCall(refsetDirectoryData))
			.subscribe((results) => {
				const refset = results;
				const dialogId = 'directoryInfoDialog';
				this.directUrl = (window.location.protocol + '//' + window.location.host + this.router.url).replace(
					'library',
					'details/' + refset.refsetId + '/' + RefsetUtility.getVersionDateForRefsetApiCall(refset),
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

		if (this.showBrowserSection) {
			sectionsMaxHeight = sectionHeight - sectionsSectionHeight - sectionsMinHeight;
		}

		if (this.showMappingsSection) {
			document.getElementsByClassName('mappings-section')[0]?.setAttribute('style', `max-height: ${sectionsMaxHeight}px;`);

			document.getElementsByClassName('grid-wrapper')[0]?.setAttribute('style', `max-height: ${sectionsMaxHeight}px;`);
		}
		if (this.showBrowserSection) {
			document.getElementsByClassName('metadata-section')[0]?.setAttribute('style', `max-height: ${sectionsMinHeight}px;`);
		}
	}
}
