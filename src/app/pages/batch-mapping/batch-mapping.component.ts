import { FormControl } from '@angular/forms';
import {
	ChangeDetectorRef,
	Component,
	EventEmitter,
	OnInit,
	Output,
	ElementRef,
	TemplateRef,
	ViewChild,
	HostListener,
	Renderer2,
} from '@angular/core';
import { formatDate } from '@angular/common';
import { PaginationChangedEvent } from 'ag-grid-community';
import { Subscription, Observable, OperatorFunction, of, map } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { MatSelect } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { MatMenuTrigger } from '@angular/material/menu';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { DialogService } from 'src/app/dialog/services/dialog.service';
import { NotificationService } from 'src/app/services/notification.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { MT2Service } from 'src/app/services/mt2.service';
import { Title } from '@angular/platform-browser';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { environment } from '../../../environments/environment';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { CategoryFilterComponent } from 'src/app/components/categoryFilter/category-filter.component';
import { DateTextFilterComponent } from 'src/app/components/dateTextFilter/date-text-filter.component';
import { PaginationComponent } from 'src/app/components/pagination/pagination.component';
import { TemplateRendererComponent } from 'src/app/components/cellRenderers/template.renderer';
import { Debounce } from 'src/app/decorators/debounce.decorator';
import { User } from 'src/app/models/user';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { PaginationService } from 'src/app/services/pagination.service';

@Component({
	standalone: false,
	selector: 'app-batch-mapping',
	templateUrl: './batch-mapping.component.html',
	styleUrls: ['./batch-mapping.component.css'],
})
export class BatchMappingComponent implements OnInit {
	user: User;
	searchInput = '';
	searchBrowserInput = '';
	targetCodeInput = '';
	targetNameInput = '';
	ruleBased = false;
	ruleOptions = [];
	rulesTrue = ['TRUE'];
	rulesFalse = ['TRUE', 'Gender - Female', 'Gender - Male'];
	targetTerminology = '';
	targetTerminologyVersion = '';
	mapRelations = [];
	targetRelations = [];
	noTargetRelations = [];
	projectRelations = [];
	mapAdvices = [];
	updateAdviceList = [];
	viewOptions = [
		{ value: 'all', display: 'All' },
		{ value: 'public', display: 'Public' },
		{ value: 'private', display: 'Private' },
	];
	selectedView = 'all';
	rowSelection = 'multiple';
	refsetGridLastFilter = '';
	refsetGridLastSort = '';
	showTable = false;
	mapsetResponse = [];
	mapsetData = [];
	dialog: DialogService;
	versionStatuses: any;
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
	searchCallArray = [];
	showLoadingSearch = true;
	toBeDevelopedModalRef: NgbModalRef;
	confirmModalRef: NgbModalRef;
	headerGroupModal: NgbModalRef;
	isModalOpen = false;
	mapsetName = 'Mapset Name';
	selectedMapset: any;
	showConfigSection = true;
	showBrowserSection = false;
	mapsetCode: string;
	mapsetInfo: any = {};
	selectedVersion: any;
	conceptCodes: [];
	mapping: string;
	routeParamsSubscription$: Subscription;
	browserSubscription: Subscription;
	gridSelectAll = false;
	popoverLocationY = 0;
	popoverLocationX = 0;
	popover_uuid = '';
	popover_adviceToAdd = '';
	popover_updateAdviceList = [];
	popover_addAdviceList = [];
	loaded = false;
	loadError = false;
	showPaging = false;
	browserLoaded = false;
	saving = false;
	selectedFormat = {};
	formats = [];
	numOfGroups = 1;
	foundConceptCode = false;
	selectedTarget = '';
	selectedBrowser = '';
	userChanged = false;
	showAdvicePopover = false;
	showGroupPopover = false;
	showTargetPopover = false;
	tempModuleIdChangeBeforeRelease = '449080006';
	mapsetBatchColumnStorage = 'mapsetBatchColumnStorage';
	batchSearchInput = 'batchSearchInput';
	targetFC = new FormControl('a');
	public query: any;
	//formatter = (result: any) => result || this.query;
	formatter = (x: { name: string; code: string }) => x.code;
	searchByKeyboard = false;
	searchByTypeahead = false;
	groupFC = new FormControl('');
	headerGroupFC = new FormControl('');
	priorityFC = new FormControl('');
	codeList: Observable<any[]>;
	targetToName = '';
	rowColors = [{ background: 'white' }, { background: '#f2f2f2' }];
	currentRowColor = 0;
	refsetData: any;
	gridOptions: any;
	gridPaging = { pageSize: 10, pageSizeOptions: [10, 25, 50, 100], totalKnown: false, totalRows: null, manualStateRefresh: true };
	gridParams: any;
	gridApi: any;
	gridColumnDefs = [];
	useDialog = false;
	moduleMetadata: any;
	internationalId = '449080006';
	checkedNum = 0;
	loadedBrowser = false;
	isNewPageSize = false;
	paginationPages: any = {};
	browserData = [];
	browserOptions: any;
	browserPaging = { pageSize: 10, pageSizeOptions: [10, 25, 50, 100], totalKnown: false, totalRows: null, manualStateRefresh: true };
	browserParams: any;
	browserApi: any;
	browserColumnDefs = [];
	conceptDetail = false;
	currentConcept: any;

	@Output() loadingSpinner = new EventEmitter<boolean>(true);

	@ViewChild('selectRelationship') private selectRelationship: MatSelect;
	@ViewChild('selectRule') private selectRule: MatSelect;
	@ViewChild('selectAdvice') private selectAdvice: MatSelect;
	@ViewChild('directoryInfoDialog') infoDialog: TemplateRef<any>;
	@ViewChild('directoryFeedbackDialog') feedbackDialog: TemplateRef<any>;
	@ViewChild('toBeDevelopedModal') tbdModal: TemplateRef<any>;
	@ViewChild('headerGroupModal') headerGroup: TemplateRef<any>;
	@ViewChild('directoryCheckSection') checkSection: TemplateRef<any>;
	@ViewChild('browserCheckSection') checkBrowserSection: TemplateRef<any>;
	@ViewChild('directoryCodeSection') codeSection: TemplateRef<any>;
	@ViewChild('directoryNameSection') nameSection: TemplateRef<any>;
	@ViewChild('directoryToNameSection') toNameSection: TemplateRef<any>;
	@ViewChild('targetAdviceSection') adviceSection: TemplateRef<any>;
	@ViewChild('targetRuleSection') ruleSection: TemplateRef<any>;
	@ViewChild('directoryActionSection') actionSection: TemplateRef<any>;
	@ViewChild('directoryPaging') paginationComponent: PaginationComponent;
	@ViewChild('directoryCategoryFilter') categoryFilter: TemplateRef<any>;
	@ViewChild('directoryWorkflowStatusSection') versionStatus: TemplateRef<any>;
	@ViewChild('confirmationModal') confirmationModal: TemplateRef<any>;
	@ViewChild('actions') private actions: MatSelect;
	@ViewChild('groupInput') private groupInput: ElementRef;
	@ViewChild('targetInput') private targetInput: ElementRef;
	@ViewChild('directorySearchInput') private directorySearchInput: ElementRef;
	@ViewChild('browserSearchInput') private browserSearchInput: ElementRef;
	@ViewChild('searchMenuTrigger') searchMenuTrigger: MatMenuTrigger;
	@ViewChild('secondWindow') secondWindow: ElementRef;
	@ViewChild('browserWrapper') browserWrapper: ElementRef;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private titleService: Title,
		private renderer: Renderer2,
		private elementRef: ElementRef,
		private refsetService: RefsetService,
		private changeDetectorRef: ChangeDetectorRef,
		private breadcrumbService: BreadcrumbService,
		private authenticationService: AuthenticationService,
		private notificationService: NotificationService,
		private mt2Service: MT2Service,
		private modalService: NgbModal,
		private pagerService: PaginationService,
	) {
		document.body.scrollTop = 0;
		this.targetFC.valueChanges.pipe(debounceTime(600), distinctUntilChanged()).subscribe((res) => {
			if (this.targetFC.dirty && !this.searchByTypeahead) {
				this.foundConceptCode = false;
				this.targetNameInput = '';
				this.targetToName = '';
				if (this.targetFC.value.length >= 2) {
					this.onInputTargetChange();
				}
			} else {
				this.searchByTypeahead = false;
			}
		});
	}

	//***** Framework Functions *****/
	ngOnInit() {
		this.user = this.authenticationService.getUser();
		this.titleService.setTitle('Mapping Tool - Batch Edit Mappings');

		this.routeParamsSubscription$ = this.route.params.subscribe((routeParams) => {
			this.mapsetCode = routeParams.code;
			this.conceptCodes = routeParams.concepts.split('_');
			this.mapsetBatchColumnStorage += routeParams.concepts;
			this.batchSearchInput += routeParams.concepts;

			this.getMapsetInfo();
			this.getModuleMetadata();
			this.getMapProject();
			this.firstLoadBrowser();
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

		this.gridOptions = {
			context: { componentParent: this },
			pagination: false,
			angularCompileHeaders: true,
			suppressColumnVirtualisation: true,
			suppressPaginationPanel: true,
			paginationPageSize: this.gridPaging.pageSize,
			rowSelection: 'single',
			animateRows: false,
			enableCellTextSelection: true,
			onGridReady: this.onGridReady,
			onCellDoubleClicked: this.onGridCellClick,
			onCellValueChanged: this.onCellValueChanged,
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
						inactivatedRow = params.data.active == false;
					}

					return inactivatedRow;
				},
			},
		};

		this.changeDetectorRef.detectChanges();
	}

	firstLoadBrowser() {
		this.browserColumnDefs = [
			{
				field: 'code',
				tooltipField: 'code',
				headerName: 'Code',
				headerTooltip: 'Code',
				flex: 1,
				width: 125,
				cellClass: 'blue-link',
				resizable: false,
				sortable: false,
				suppressSorting: true,
			},
			{
				field: 'name',
				tooltipField: 'name',
				headerName: 'Name',
				headerTooltip: 'Name',
				flex: 2,
				minWidth: 165,
				resizable: false,
				sortable: false,
				suppressSorting: true,
			},
		];
		this.browserOptions = {
			context: { componentParent: this },
			pagination: true,
			angularCompileHeaders: true,
			suppressColumnVirtualisation: true,
			suppressPaginationPanel: true,
			rowModelType: 'infinite',
			suppressScrollOnNewData: true,
			suppressColumnMoveAnimation: true,
			suppressDragLeaveHidesColumns: true,
			debounceVerticalScrollbar: true,
			animateRows: false,
			debug: false,
			cacheOverflowSize: 2,
			maxBlocksInCache: 2,
			maxConcurrentDatasourceRequests: 2,
			serverSideEnableClientSideSort: true,
			cacheBlockSize: this.browserPaging.pageSize,
			paginationPageSize: this.browserPaging.pageSize,
			paginationPageSizeSelector: this.browserPaging.pageSizeOptions,
			rowSelection: 'single',
			datasource: this.createDataSource(),
			enableCellTextSelection: true,
			onGridReady: this.onBrowserReady,
			onCellClicked: this.onBrowserCellClick,
			onPaginationChanged: (event: any) => this.onPaginationChanged(event),
			domLayout: 'autoHeight',
			frameworkComponents: {
				templateRenderer: TemplateRendererComponent,
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
						inactivatedRow = params.data.active == false;
					}

					return inactivatedRow;
				},
			},
		};
		this.showTable = true;
	}

	loadGridColumns(): void {
		this.gridColumnDefs = [
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
				field: 'code',
				tooltipField: 'code',
				headerName: 'Source',
				headerTooltip: 'Source',
				flex: 1,
				minWidth: 125,
				cellClass: 'blue-link',
				resizable: true,
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
				colId: 'relation-select',
				cellClass: 'editCell',
				tooltipField: 'relation',
				headerName: 'Relationship',
				headerTooltip: 'Relationship',
				resizable: true,
				cellEditor: 'agSelectCellEditor',
				cellEditorParams: (params) =>
					params.data.mapEntries.toCode === '[Empty Target]'
						? { values: this.noTargetRelations, valueListGap: 1 }
						: { values: this.targetRelations, valueListGap: 1 },
				unSortIcon: true,
				sortable: false,
				suppressSorting: true,
				minWidth: 165,
				editable: this.mapsetInfo.workflowStatus === 'IN_EDIT',
				width: 165,
			},
			{
				field: 'rule',
				colId: 'rule-select',
				cellClass: 'editCell',
				tooltipField: 'rule',
				headerName: 'Rule',
				headerTooltip: 'Rule',
				minWidth: 100,
				width: 100,
				resizable: true,
				//cellRenderer: TemplateRendererComponent,
				//cellRendererParams: { template: this.ruleSection },
				cellEditor: 'agSelectCellEditor',
				cellEditorParams: {
					values: this.ruleOptions,
				},
				editable: this.mapsetInfo.workflowStatus === 'IN_EDIT',
				unSortIcon: true,
				sortable: false,
				suppressSorting: true,
			},
			{
				field: 'mapEntries',
				headerName: 'Advices',
				headerTooltip: 'Advices',
				cellClass: 'rt2-directory-column-advices',
				minWidth: 85,
				width: 135,
				resizable: true,
				cellRenderer: TemplateRendererComponent,
				cellRendererParams: { template: this.adviceSection },
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
				width: 135,
				resizable: true,
				valueGetter: UiUtility.gridDateValueGetter,
				floatingFilterComponent: DateTextFilterComponent,
				floatingFilterComponentParams: { suppressFilterButton: true },
				unSortIcon: true,
				sortable: false,
				suppressSorting: true,
			},
			{
				field: 'feedback',
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
	}

	onGridReady = (params) => {
		this.gridParams = params;
		this.gridApi = params.api;

		const _window = window;
		_window['checkboxHandleClick'] = () => {
			this.checkboxAllClick();
		};
	};

	onCellValueChanged = (event) => {
		this.userChanged = true;
	};

	onGridCellClick = (event) => {
		if (
			event.column.colId !== 'checkbox' &&
			event.column.colId !== 'action-btns' &&
			event.column.colId !== 'relation-select' &&
			event.column.colId !== 'rule-select'
		) {
			this.goToMappingPage(event.data.code);
		}
	};

	onBrowserReady = (params) => {
		this.browserParams = params;
		this.browserApi = params.api;
	};

	onBrowserCellClick = (event) => {
		if (
			event.column.colId !== 'checkbox' &&
			event.column.colId !== 'action-btns' &&
			event.column.colId !== 'relation-select' &&
			event.column.colId !== 'rule-select'
		) {
			this.loadConceptDetail(event.data.code);
		}
	};

	loadConceptDetail(code: string) {
		this.refsetService.getConceptByCode(this.targetTerminology, this.targetTerminologyVersion, code).subscribe({
			next: (results) => {
				this.currentConcept = results;
				this.conceptDetail = true;
			},
			error: (error) => {
				//
			},
		});
	}

	closeConceptDetails() {
		this.conceptDetail = false;
	}

	getMapsetInfo() {
		this.refsetService.getMapsetByCode(this.mapsetCode).subscribe((results) => {
			const mapsetVersions = Array.isArray(results) ? results : [results];

			const getIsInDevelopment = (status: string): boolean => {
				return status === 'IN_DEVELOPMENT' || status === 'IN DEVELOPMENT';
			};

			mapsetVersions.sort((a, b) => {
				const aInDev = getIsInDevelopment(a.versionStatus);
				const bInDev = getIsInDevelopment(b.versionStatus);

				if (aInDev && !bInDev) {
					return -1;
				}
				if (bInDev && !aInDev) {
					return 1;
				}

				const ad = a.versionDate || 0;
				const bd = b.versionDate || 0;
				return bd - ad;
			});

			this.mapsetInfo = mapsetVersions[0];
			if (localStorage.getItem('mapsetVersion')) {
				this.selectedVersion = JSON.parse(localStorage.getItem('mapsetVersion'));
				this.mapsetInfo = mapsetVersions.filter((v) => {
					const versionDate = v.versionDate || new Date();
					const mapsetVersionStatus = formatDate(versionDate, 'MM-dd-yyyy', 'en-US', 'UTC') + ' (' + v.versionStatus + ') ';
					return mapsetVersionStatus === this.selectedVersion;
				});
				this.mapsetInfo = this.mapsetInfo[0];
			}
			this.getMapsetData();
		});
		this.refsetService.getMapsets().subscribe({
			next: (results) => {
				const thisResult = results.filter((res) => {
					return res.refSetCode === this.mapsetCode;
				});
				this.mapsetName = thisResult[0]?.refSetName;
				this.selectedMapset = thisResult[0];
			},
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

	getMapProject() {
		const params: any = {
			includeMembers: false,
		};
		const projectId = environment.defaultProjectId; //TEST ONLY
		this.refsetService.getMapProjectById(projectId, params).subscribe({
			next: (results) => {
				this.targetTerminology = results.destinationTerminology;
				this.targetTerminologyVersion = results.destinationTerminologyVersion;
				this.ruleBased = results.ruleBased;
				this.ruleOptions = this.ruleBased ? this.rulesFalse : this.rulesTrue;
				this.projectRelations = results.mapRelations || [];
				const that = this;
				if (this.projectRelations.length > 0) {
					this.targetRelations = this.projectRelations
						.filter(function (res) {
							return res.allowableForNullTarget === false;
						})
						.map(function (res) {
							return that.titleCaseWord(res.name);
						});
					this.noTargetRelations = this.projectRelations
						.filter(function (res) {
							return res.allowableForNullTarget === true;
						})
						.map(function (res) {
							return that.titleCaseWord(res.name);
						});

					this.mapRelations = this.projectRelations.map((res) => {
						return this.titleCaseWord(res.name);
					});
				}
				this.mapAdvices = results.mapAdvices || [];
				if (this.mapAdvices.length > 0) {
					this.mapAdvices = results.mapAdvices.map((res) => {
						return res.name;
					});
				}
				//this.getBrowserData();
				this.loadGridColumns();
			},
			error: (err: any) => {
				this.loadError = true;
				console.log(' project loading error', err);
			},
		});
	}

	titleCaseWord(word: string) {
		if (!word) return word;
		return word[0].toUpperCase() + word.substr(1).toLowerCase();
	}

	clearTargetInput() {
		this.foundConceptCode = false;
		this.targetCodeInput = '';
		this.targetFC.reset();
		this.targetFC.setValue(this.targetCodeInput);
		this.targetToName = '';
		this.targetNameInput = '';
	}

	@Debounce()
	onInputTargetChange() {
		this.targetCodeInput = this.targetFC.value;
		this.targetCodeInput = this.targetCodeInput.trim();
		if (this.targetCodeInput.length > 2) {
			this.targetToName = 'Searching...';
			this.getConceptByCode();
		}
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
			this.gridApi.setGridOption('quickFilterText', this.searchInput);
			localStorage.setItem(this.batchSearchInput, JSON.stringify(this.searchInput));
			this.checkedNum = 0;
			if (this.gridSelectAll) {
				window['checkbox-table-all'].click();
			} else {
				this.unCheckAll();
			}
		}
	}

	clearBrowserSearch() {
		this.showLoadingSearch = false;
		if (this.searchBrowserInput) {
			this.searchBrowserInput = '';
			this.onBrowserSearchChange();
		}
	}

	@Debounce()
	onBrowserSearchChange() {
		this.searchBrowserInput = this.searchBrowserInput.trim();

		if (!CodeUtility.hasValue(this.searchBrowserInput) || (CodeUtility.hasValue(this.searchBrowserInput) && this.searchBrowserInput.length > 2)) {
			this.setPageSize(10);
			this.goToPage(0);
			this.browserLoaded = false;
			this.browserApi.purgeInfiniteCache();
		}
	}

	/*Pagination functions */
	onPaginationChanged(event: PaginationChangedEvent) {
		if (this.browserApi) {
			this.isNewPageSize = this.browserPaging.pageSize !== this.browserApi.paginationGetPageSize();
			this.browserPaging.pageSize = this.browserApi.paginationGetPageSize();
			this.browserApi.updateGridOptions({
				paginationPageSize: this.browserPaging.pageSize,
				cacheBlockSize: this.browserPaging.pageSize,
			});
			// this.getBrowserData();
		}
	}

	setPageSize(size: number) {
		// this.browserApi.paginationGoToFirstPage();
		this.goToPage(0);
		this.browserApi.setGridOption('paginationPageSize', size);
	}

	goToPage(number: number) {
		this.browserApi.paginationGoToPage(number);
		//this.getBrowserData();
	}

	reloadMapping() {
		this.loaded = false;
		this.userChanged = false;
		this.selectedTarget = '';
		this.clearTargetInput();
		this.getMapsetInfo();
		const refreshInterval = setInterval(() => {
			this.notificationService.show('The changes have been removed.', null, 'success', { timeOut: 4500, extendedTimeOut: 0 });
			clearInterval(refreshInterval);
		}, 250);
	}

	searchAutoComplete: OperatorFunction<string, readonly { name; code }[]> = (text$: Observable<string>) =>
		text$.pipe(
			debounceTime(600),
			distinctUntilChanged(),
			switchMap((term) => this.fetchData(term)),
		);
	fetchData(term: string): Observable<any> {
		if (term.length >= 2 && !this.searchByKeyboard) {
			return this.refsetService
				.searchConceptByQuery(this.targetTerminology, this.targetTerminologyVersion, term, '10')
				.pipe(map((data) => data.items));
		} else {
			return of([]); // return an empty array if the term length is less than 3
		}
	}

	//for selecting item from suggestions
	selectItemFromMenu(menu: any) {
		this.searchByTypeahead = true;
		this.targetCodeInput = menu.item.code;
		this.targetToName = menu.item.name;
		this.foundConceptCode = true;
	}

	//form submmision without selecting from dropdown
	onKeyPress(e) {
		this.searchByKeyboard = true;
		this.targetToName = '';
		this.targetCodeInput = this.targetFC.value;
		this.getConceptByCode();
		this.handleCloseDropDown();
	}

	handleCloseDropDown() {
		//Quick search
		setTimeout(() => {
			const typeaheadElement = this.elementRef.nativeElement.querySelector('#ngb-typeahead-0');
			if (typeaheadElement) {
				this.renderer.removeClass(typeaheadElement, 'show');
			}
		}, 1400);
	}

	getConceptByCode() {
		this.refsetService.getConceptByCode(this.targetTerminology, this.targetTerminologyVersion, this.targetCodeInput).subscribe({
			next: (results) => {
				this.searchByKeyboard = false;
				this.foundConceptCode = false;
				if (results === null) {
					this.targetToName = 'CONCEPT NOT FOUND';
				} else {
					if (results.name.indexOf('CONCEPT NOT FOUND') === -1) {
						this.foundConceptCode = true;
					}
					this.targetToName = results.name;
				}
			},
			error: (error) => {
				//
			},
		});
	}

	createDataSource() {
		return {
			rowCount: null,
			getRows: (rowParams) => {
				const startRow = rowParams.startRow;
				const endRow = rowParams.endRow;
				const sortModel = rowParams.sortModel;
				this.browserApi.showLoadingOverlay();

				let query = this.searchBrowserInput;
				if (this.searchBrowserInput === '') {
					query = '';
				}

				if (this.isNewPageSize) {
					rowParams.failCallback();
				} else {
					this.browserLoaded = false;
					let limit = endRow - startRow;

					if (this.numOfMembers > 0) {
						if (startRow + limit > this.numOfMembers) {
							limit = this.numOfMembers - startRow;
						}
					}

					const restParams: any = {
						offset: startRow,
						limit: this.browserPaging.pageSize,
					};

					if (CodeUtility.hasValue(query)) {
						query = query.replace(/\//g, '%2F').replace(/%/g, '%25');
						restParams.filter = query;
					} else {
						restParams.filter = '';
					}

					this.browserSubscription = this.refsetService
						.searchBrowserByQuery(this.targetTerminology, this.targetTerminologyVersion, query, restParams.offset, restParams.limit)
						.subscribe({
							next: (response) => {
								this.numOfMembers = response.total;
								this.browserData = response.items;
								this.browserLoaded = true;

								this.changeDetectorRef.detectChanges();

								const lastIndex = document.getElementsByClassName('ag-header').length - 1;
								const child = document.getElementsByClassName('ag-header')[lastIndex];
								document.getElementById('browserHeader').appendChild(child);
								const lastIndexP = document.getElementsByClassName('ag-paging-panel').length - 1;
								const childP = document.getElementsByClassName('ag-paging-panel')[lastIndexP];
								document.getElementById('directoryPaging').appendChild(childP);

								this.showPaging = true;

								if (this.browserData?.length > 0) {
									this.showPaging = true;
									this.browserApi.hideOverlay();
									this.paginationPages = Math.ceil(this.numOfMembers / this.browserPaging.pageSize)
										? this.pagerService.getPager(
												Math.ceil(this.numOfMembers / this.browserPaging.pageSize),
												this.browserApi.paginationGetCurrentPage(),
												true,
											)
										: {};

									this.paginationPages.currentPage = this.getCurrentPage();

									const lastRow = this.numOfMembers;
									rowParams.successCallback(this.browserData, lastRow);
								}
								if (this.numOfMembers === 0) {
									this.showPaging = false;
									this.browserApi.showNoRowsOverlay();
									rowParams.successCallback([], 0);
								}

								this.browserPaging.manualStateRefresh = Boolean(true);
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
								this.browserSubscription.unsubscribe();
							},
							error: (error) => {
								this.showPaging = false;
								this.browserApi.showNoRowsOverlay();
								rowParams.successCallback([], 0);
							},
						});
				}
			},
		};
	}

	getCurrentPage() {
		let current = 1;
		if (this.browserApi) {
			current = this.browserApi.paginationGetCurrentPage();
		}
		return current;
	}

	getMapsetData() {
		this.refsetService.getMappingByMapsetConceptList(this.mapsetInfo.id, this.conceptCodes.join(',')).subscribe({
			next: (response) => {
				this.loaded = true;
				const batch = [];
				const list = response.items;
				this.mapsetResponse = list;

				for (let i = 0; i < list.length; i++) {
					const results = list[i];
					let data = {};
					let count = 0;
					for (let b = 0; b < results.mapEntries.length; b++) {
						if (this.numOfGroups < results.mapEntries[b].group) {
							this.numOfGroups = results.mapEntries[b].group;
						}
						results.mapEntries[b].advices = results.mapEntries[b].advices.filter(function (res) {
							return res !== '';
						});
						let adviceAlways = [];
						adviceAlways = results.mapEntries[b].advices.filter(function (res) {
							return res.indexOf('ALWAYS') > -1;
						});
						let mapAdvices = [];
						mapAdvices = results.mapEntries[b].advices.filter(function (res) {
							return res.indexOf('ALWAYS') === -1;
						});
						results.mapEntries[b].mapAdvices = mapAdvices;
						results.mapEntries[b].adviceAlways = adviceAlways;
						data = {
							uuid: results.code + results.mapEntries[b].modified + b,
							index: results.code + count,
							active: results.active,
							feedback: true,
							mapEntries: results.mapEntries[b],
							descriptions: results.descriptions[b],
							entries: results.mapEntries.length,
							code: results.code,
							name: results.name,
							toName:
								results.mapEntries[b].toName.length > 0 && results.mapEntries[b].toName !== ' DOES NOT EXIST'
									? results.mapEntries[b].toName
									: '---',
							toCode:
								results.mapEntries[b].toCode.length > 0
									? results.mapEntries[b].group + '/' + results.mapEntries[b].priority + '#' + results.mapEntries[b].toCode
									: results.mapEntries[b].group + '/' + results.mapEntries[b].priority + '#[Empty Target]',
							rule: results.mapEntries[b].rule.length > 0 ? results.mapEntries[b].rule : '---',
							relation: results.mapEntries[b].relation.length > 0 ? this.titleCaseWord(results.mapEntries[b].relation) : '---',
							modified: results.mapEntries[b].modified,
							advices: results.mapEntries[b].advices,
							advices_open: false,
							group: results.mapEntries[b].group,
							priority: results.mapEntries[b].priority,
							moduleId: results.mapEntries[b].moduleId,
							modFlag: this.getModuleLanguageIcon(results.mapEntries[b].moduleId),
							modLang: this.getModuleLanguageName(results.mapEntries[b].moduleId),
						};
						count++;
						batch.push(data);
					}
				}
				this.mapsetData = batch;
				setTimeout(() => {
					const lastIndex = document.getElementsByClassName('ag-header').length - 1;
					const child = document.getElementsByClassName('ag-header')[0]; //lastIndex];
					document.getElementById('directoryHeader').appendChild(child);
				}, 400);

				this.breadcrumbService.setBreadcrumbs([
					{ path: '/library', label: 'Library' },
					{ path: '/mapset/' + this.mapsetCode + '/mappings', label: this.mapsetName },
					{ label: 'Batch Edit Mappings' },
				]);
				if (localStorage.getItem(this.batchSearchInput)) {
					this.searchInput = JSON.parse(localStorage.getItem(this.batchSearchInput));
					this.gridApi.setGridOption('quickFilterText', this.searchInput);
				}
			},
			error: (error) => {
				//
				this.notificationService.show('Error loading map sets by id, please try again.');
				setTimeout(() => {
					this.goToMappingsPage();
				}, 1500);
				console.log(' error', error);
			},
		});
	}

	addMapGroup() {
		this.numOfGroups++;
	}

	removeMapGroup(groupNum: number) {
		this.mapsetData[0].mapEntries.forEach((entry, index) => {
			if (entry.group === groupNum) {
				this.mapsetData[0].mapEntries.splice(index, 1);
			}
		});
		this.numOfGroups--;
		this.userChanged = true;
	}

	addEmptyTargetToGroup(id: string, groupNum: number) {
		let nextPriorityNum = 1;
		let selectEntryIndex = 0;
		let orginalFrom = { code: '', name: '' };
		for (let p = 0; p < this.mapsetData.length; p++) {
			if (this.mapsetData[p].uuid == id) {
				orginalFrom = { code: this.mapsetData[p].code, name: this.mapsetData[p].name };
				if (this.mapsetData[p].group === groupNum) {
					if (this.mapsetData[p].priority >= nextPriorityNum) {
						selectEntryIndex = p;
						nextPriorityNum = this.mapsetData[p].priority + 1;
					}
					break;
				}
			}
		}
		let maxPriorityNum = 1;
		let maxIndex = 1;
		for (let p = 0; p < this.mapsetData.length; p++) {
			if (this.mapsetData[p].group === groupNum) {
				if (this.mapsetData[p].priority >= maxPriorityNum) {
					maxPriorityNum = this.mapsetData[p].priority + 1;
					maxIndex = p;
				}
			}
		}
		if (maxPriorityNum > nextPriorityNum) {
			nextPriorityNum = maxPriorityNum;
			selectEntryIndex = maxIndex;
		}
		let defaultRule = '';
		if (!this.ruleBased) {
			defaultRule = 'TRUE';
		}
		let defaultRelationship = '';
		for (let r = 0; r < this.projectRelations.length; r++) {
			if (this.projectRelations[r].allowableForNullTarget === true) {
				defaultRelationship = this.titleCaseWord(this.projectRelations[r].name);
				break;
			}
		}

		const newMapEntry = {
			feedback: true,
			index: orginalFrom.code + this.mapsetData.length,
			name: orginalFrom.name,
			code: orginalFrom.code,
			group: groupNum,
			priority: nextPriorityNum,
			relation: defaultRelationship,
			rule: defaultRule,
			toCode: groupNum + '/' + nextPriorityNum + '#' + '[Empty Target]',
			toName: '---',
			uuid: groupNum + nextPriorityNum + Date.now(),
			mapEntries: {
				id: null,
				modified: null,
				modifiedBy: null,
				moduleId: this.tempModuleIdChangeBeforeRelease,
				modFlag: '',
				modLang: '',
				active: true,
				descriptions: [],
				additionalMapEntryInfos: [],
				block: 0,
				created: null,
				toCode: '[Empty Target]',
				toName: '---',
				advices: [],
				mapAdvices: [],
				adviceAlways: [],
				group: groupNum,
				priority: nextPriorityNum,
				uuid: groupNum + nextPriorityNum + Date.now(),
			},
		};

		this.mapsetData.splice(selectEntryIndex + 1, 0, newMapEntry);
		this.gridApi.setGridOption('rowData', this.mapsetData);
		this.userChanged = true;
	}

	removeTarget(uuid: string) {
		let changedPriority = 0;
		let groupNum = 0;
		for (let p = 0; p < this.mapsetData[0].mapEntries.length; p++) {
			if (this.mapsetData[0].mapEntries[p].uuid === uuid) {
				groupNum = this.mapsetData[0].mapEntries[p].group;
				changedPriority = this.mapsetData[0].mapEntries[p].priority;
				this.mapsetData[0].mapEntries.splice(p, 1);
			}
		}
		for (let c = 0; c < this.mapsetData[0].mapEntries.length; c++) {
			if (this.mapsetData[0].mapEntries[c].group === groupNum) {
				if (this.mapsetData[0].mapEntries[c].priority > changedPriority) {
					this.mapsetData[0].mapEntries[c].priority--;
				}
			}
		}
		this.userChanged = true;
	}

	setSelectedTarget(uuid: string, code: string, name: string) {
		this.selectedTarget = uuid;
		this.targetCodeInput = code;
		this.targetNameInput = name;
		this.targetFC.reset();
		this.targetFC.setValue(this.targetCodeInput);
	}

	setTargetCode() {
		if (this.selectedTarget === '') {
			let nextPriorityNum = 1;
			for (let p = 0; p < this.mapsetData[0].mapEntries.length; p++) {
				if (this.mapsetData[0].mapEntries[p].group === this.numOfGroups) {
					if (this.mapsetData[0].mapEntries[p].priority >= nextPriorityNum) {
						nextPriorityNum++;
					}
				}
			}
			let defaultRule = '';
			if (!this.ruleBased) {
				defaultRule = 'TRUE';
			}
			let defaultRelationship = '';
			for (let r = 0; r < this.projectRelations.length; r++) {
				if (this.projectRelations[r].allowableForNullTarget === true) {
					defaultRelationship = this.titleCaseWord(this.projectRelations[r].name);
					break;
				}
			}
			const newMapEntry = {
				active: true,
				additionalMapEntryInfos: [],
				mapAdvices: [],
				adviceAlways: [],
				advices: [],
				descriptions: [],
				block: 0,
				created: null,
				group: this.numOfGroups,
				id: null,
				modified: null,
				modifiedBy: null,
				moduleId: this.tempModuleIdChangeBeforeRelease,
				modFlag: '',
				modLang: '',
				priority: nextPriorityNum,
				relation: defaultRelationship,
				rule: defaultRule,
				toCode: this.targetCodeInput,
				toName: this.targetNameInput,
				uuid: this.numOfGroups + nextPriorityNum + Date.now(),
			};
			this.mapsetData[0].mapEntries.push(newMapEntry);
		} else {
			for (let p = 0; p < this.mapsetData[0].mapEntries.length; p++) {
				if (this.mapsetData[0].mapEntries[p].uuid === this.selectedTarget) {
					this.mapsetData[0].mapEntries[p].toCode = this.targetCodeInput;
					this.mapsetData[0].mapEntries[p].toName = this.targetNameInput;
					this.mapsetData[0].mapEntries[p].moduleId = this.tempModuleIdChangeBeforeRelease;
					this.mapsetData[0].mapEntries[p].modFlag = '';
					this.mapsetData[0].mapEntries[p].modLang = '';
					this.mapsetData[0].mapEntries[p].additionalMapEntryInfos = [];
					this.mapsetData[0].mapEntries[p].mapAdvices = [];
					this.mapsetData[0].mapEntries[p].adviceAlways = [];
					this.mapsetData[0].mapEntries[p].advices = [];
					this.mapsetData[0].mapEntries[p].descriptions = [];
				}
			}
		}
		this.selectedTarget = '';
		this.foundConceptCode = false;
		this.clearTargetInput();
		this.userChanged = true;
	}

	userChangeSelection(selectBox) {
		switch (selectBox) {
			case 'norelation':
				this.selectRelationship.value = '';
				break;
			case 'relation':
				this.selectRelationship.value = '';
				break;
			case 'rule':
				this.selectRule.value = '';
				break;
		}
		this.userChanged = true;
	}

	saveMappings() {
		this.saving = true;
		for (let f = 0; f < this.mapsetResponse.length; f++) {
			this.mapsetResponse[f].mapEntries = [];
			for (let p = 0; p < this.mapsetData.length; p++) {
				if (this.mapsetResponse[f].code === this.mapsetData[p].code) {
					const uiData = this.mapsetData[p];
					const uiEntry = this.mapsetData[p].mapEntries;
					const mapEntry = {
						advices: uiEntry.advices,
						toCode: uiEntry.toCode === '[Empty Target]' ? '' : uiEntry.toCode,
						toName: uiEntry.toName === '---' ? '[NO TARGET]' : uiEntry.toName,
						rule: uiData.rule,
						priority: uiData.priority,
						relation: uiData.relation.toUpperCase(),
						group: uiData.group,
						block: uiEntry.block,
						moduleId: uiEntry.moduleId,
						active: uiEntry.active,
						additionalMapEntryInfos: uiEntry.additionalMapEntryInfos,
						descriptions: uiEntry.descriptions,
						id: uiEntry.id,
						modified: uiEntry.modified,
						created: uiEntry.created,
						modifiedBy: uiEntry.modifiedBy,
					};
					this.mapsetResponse[f].mapEntries.push(mapEntry);
				}
			}
		}

		this.userChanged = false;
		this.refsetService.getMapsetWorkflowStatus(this.mapsetInfo.id).subscribe((status) => {
			if (status.workflowStatus === 'IN_EDIT') {
				this.refsetService.updateMapsetMappingBulk(this.mapsetInfo.id, this.mapsetResponse).subscribe(
					(status) => {
						this.saving = false;
						this.notificationService.show('The mappings have been saved.', null, 'success', { timeOut: 0, extendedTimeOut: 0 });
					},
					(error) => {
						//
					},
				);
			} else {
				this.notificationService.show('Mapset workflow status is not in Edit mode.');
			}
		});
	}

	showDropdown(): void {
		this.toggleDropdown = !this.toggleDropdown;
	}

	menuOpened() {
		this.directorySearchInput.nativeElement.focus();
	}

	menuBrowserOpened() {
		this.browserSearchInput.nativeElement.focus();
	}

	editGroup(event: any, params: any): void {
		if (this.mapsetInfo.workflowStatus === 'IN_EDIT') {
			this.groupFC.reset();
			this.priorityFC.reset();
			this.selectedTarget = params.data.uuid;
			this.groupFC.setValue(params.data.mapEntries.group);
			this.priorityFC.setValue(params.data.mapEntries.priority);
			this.showGroupPopover = true;
			this.showAdvicePopover = false;
			this.showTargetPopover = false;

			const showInterval = setInterval(() => {
				this.popoverLocationY = event.y + 15 - 395 + document.getElementsByClassName('rt2-container')[0].scrollTop;
				this.popoverLocationX = event.x - 190;
				this.groupInput.nativeElement.focus();
				clearInterval(showInterval);
			}, 5);
		}
	}

	clearHeaderGroupInput() {
		this.headerGroupFC.reset();
	}

	clearGroupInput() {
		this.groupFC.reset();
	}

	clearPriorityInput() {
		this.priorityFC.reset();
	}

	closeGroup() {
		this.showGroupPopover = false;
	}

	numberOnly(event): boolean {
		const charCode = event.which ? event.which : event.keyCode;
		if (charCode > 31 && (charCode < 48 || charCode > 57)) {
			event.preventDefault();
			return false;
		}
		if (event.key === '-') {
			event.preventDefault();
			return false;
		}
		return true;
	}

	setGroup() {
		this.userChanged = true;
		this.mapsetData.forEach((data) => {
			if (data.uuid === this.selectedTarget) {
				data.mapEntries.group = this.groupFC.value;
				data.group = this.groupFC.value;
				data.mapEntries.priority = this.priorityFC.value;
				data.priority = this.priorityFC.value;
				data.toCode = this.groupFC.value + '/' + data.mapEntries.priority + '#' + data.mapEntries.toCode;
			}
		});
		this.gridApi.refreshCells(this.gridParams);
		this.gridApi.redrawRows();
		this.closeGroup();
	}

	editTarget(event: any, params: any): void {
		if (this.mapsetInfo.workflowStatus === 'IN_EDIT') {
			this.targetFC.reset();
			this.foundConceptCode = false;
			this.targetToName = '';
			this.selectedTarget = params.data.uuid;
			if (params.data.mapEntries.toCode !== '[Empty Target]') {
				this.targetFC.setValue(params.data.mapEntries.toCode);
				this.query = { code: params.data.mapEntries.toCode };
				this.targetToName = params.data.mapEntries.toName;
			}
			this.showTargetPopover = true;
			this.showAdvicePopover = false;
			this.showGroupPopover = false;
			const showInterval = setInterval(() => {
				this.popoverLocationY = event.y + 15 - 395 + document.getElementsByClassName('rt2-container')[0].scrollTop;
				this.popoverLocationX = event.x - 210;
				this.targetInput.nativeElement.focus();
				clearInterval(showInterval);
			}, 5);
		}
	}

	closeTarget() {
		this.targetFC.reset();
		this.query = '';
		this.selectedTarget = '';
		this.showTargetPopover = false;
	}

	searchBrowser() {
		if (!this.showBrowserSection) {
			this.toggleSectionView('showBrowserSection');
			this.secondWindow.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
		const openInterval = setInterval(() => {
			this.searchBrowserInput = this.targetFC.value['code'];
			this.onBrowserSearchChange();
			clearInterval(openInterval);
		}, 100);
	}

	setEmptyTarget() {
		this.foundConceptCode = false;
		this.userChanged = true;
		let defaultRule = '';
		if (!this.ruleBased) {
			defaultRule = 'TRUE';
		}
		let defaultRelationship = '';
		for (let r = 0; r < this.projectRelations.length; r++) {
			if (this.projectRelations[r].allowableForNullTarget === true) {
				defaultRelationship = this.titleCaseWord(this.projectRelations[r].name);
				break;
			}
		}
		this.mapsetData.forEach((data) => {
			if (data.uuid === this.selectedTarget) {
				data.mapEntries.toCode = '[Empty Target]';
				data.toCode = data.mapEntries.group + '/' + data.mapEntries.priority + '#' + '[Empty Target]';
				data.mapEntries.toName = '---';
				data.toName = '---';
				data.relation = defaultRelationship;
				data.mapEntries.relation = defaultRelationship;
				data.mapEntries.moduleId = this.tempModuleIdChangeBeforeRelease;
				data.mapEntries.modFlag = '';
				data.mapEntries.modLang = '';
				data.mapEntries.rule = defaultRule;
				data.mapEntries.additionalMapEntryInfos = [];
				data.mapEntries.mapAdvices = [];
				data.mapEntries.adviceAlways = [];
				data.mapEntries.advices = [];
				data.mapEntries.descriptions = [];
				data.moduleId = this.tempModuleIdChangeBeforeRelease;
				data.modFlag = '';
				data.modLang = '';
				data.rule = defaultRule;
				data.additionalMapEntryInfos = [];
				data.mapAdvices = [];
				data.adviceAlways = [];
				data.advices = [];
				data.descriptions = [];
			}
		});
		this.gridApi.refreshCells(this.gridParams);
		this.gridApi.redrawRows();
		this.closeTarget();
	}

	setTarget(value: string, name: string) {
		this.targetCodeInput = value;
		this.targetToName = name;
		this.userChanged = true;
		let defaultRule = '';
		if (!this.ruleBased) {
			defaultRule = 'TRUE';
		}
		let defaultRelationship = '';
		for (let r = 0; r < this.projectRelations.length; r++) {
			if (this.projectRelations[r].allowableForNullTarget === false) {
				defaultRelationship = this.titleCaseWord(this.projectRelations[r].name);
				break;
			}
		}
		this.mapsetData.forEach((data) => {
			if (data.uuid === this.selectedTarget) {
				const targetValue = value;
				if (targetValue['code'] === undefined) {
					data.mapEntries.toCode = value;
					data.toCode = data.mapEntries.group + '/' + data.mapEntries.priority + '#' + this.targetFC.value;
				} else {
					data.mapEntries.toCode = targetValue['code'];
					data.toCode = data.mapEntries.group + '/' + data.mapEntries.priority + '#' + targetValue['code'];
				}
				data.mapEntries.toName = this.targetToName;
				data.toName = this.targetToName;
				data.relation = defaultRelationship;
				data.mapEntries.relation = defaultRelationship;
				data.mapEntries.moduleId = this.tempModuleIdChangeBeforeRelease;
				data.mapEntries.modFlag = '';
				data.mapEntries.modLang = '';
				data.mapEntries.rule = defaultRule;
				data.mapEntries.additionalMapEntryInfos = [];
				data.mapEntries.mapAdvices = [];
				data.mapEntries.adviceAlways = [];
				data.mapEntries.advices = [];
				data.mapEntries.descriptions = [];
				data.moduleId = this.tempModuleIdChangeBeforeRelease;
				data.modFlag = '';
				data.modLang = '';
				data.rule = defaultRule;
				data.additionalMapEntryInfos = [];
				data.mapAdvices = [];
				data.adviceAlways = [];
				data.advices = [];
				data.descriptions = [];
			}
		});
		this.gridApi.refreshCells(this.gridParams);
		this.gridApi.redrawRows();
		this.closeTarget();
	}

	openPopover(event: any, params: any): void {
		this.showAdvicePopover = true;
		this.showGroupPopover = false;
		this.showTargetPopover = false;
		this.popoverLocationY = event.y + 15 - 395 + document.getElementsByClassName('rt2-container')[0].scrollTop;
		this.popoverLocationX = event.x - 190;
		this.popover_uuid = params.data.uuid;
		this.popover_adviceToAdd = '';
		this.popover_updateAdviceList = JSON.parse(JSON.stringify(params.data.mapEntries.mapAdvices));
		this.popover_addAdviceList = [];
		this.mapAdvices.forEach((map) => {
			let found = false;
			this.popover_updateAdviceList.forEach((advice) => {
				if (map === advice) {
					found = true;
				}
			});
			if (!found) {
				this.popover_addAdviceList.push(map);
			}
		});
		this.popover_addAdviceList.sort((a, b) => (a > b ? 1 : -1));
		this.popover_updateAdviceList.sort((a, b) => (a > b ? 1 : -1));
	}

	closePopover() {
		this.showAdvicePopover = false;
	}

	addAdviceToList(uuid: string) {
		this.userChanged = true;
		if (this.popover_adviceToAdd !== '') {
			this.popover_updateAdviceList.push(this.popover_adviceToAdd);
			this.popover_updateAdviceList.sort((a, b) => (a > b ? 1 : -1));
			this.popover_addAdviceList.splice(this.popover_addAdviceList.indexOf(this.popover_adviceToAdd), 1);
			this.popover_addAdviceList.sort((a, b) => (a > b ? 1 : -1));
			this.popover_adviceToAdd = null;
			this.popover_adviceToAdd = '';
		}
		this.selectAdvice.value = '';
	}

	removeAdviceFromList(advice: string) {
		this.userChanged = true;
		this.popover_adviceToAdd = null;
		this.popover_adviceToAdd = '';
		this.popover_addAdviceList.push(advice);
		this.popover_addAdviceList.sort((a, b) => (a > b ? 1 : -1));
		this.popover_updateAdviceList.splice(this.popover_updateAdviceList.indexOf(advice), 1);
		this.popover_updateAdviceList.sort((a, b) => (a > b ? 1 : -1));
	}

	setAdvice() {
		this.userChanged = true;
		this.mapsetData.forEach((data) => {
			if (data.uuid === this.popover_uuid) {
				data.mapEntries.mapAdvices = JSON.parse(JSON.stringify(this.popover_updateAdviceList));
				data.mapEntries.advices = JSON.parse(JSON.stringify(data.mapEntries.mapAdvices));
				if (data.mapEntries.adviceAlways.length > 0) {
					data.mapEntries.advices.unshift(data.mapEntries.adviceAlways[0]);
				}
			}
		});
		this.closePopover();
	}

	openToBeDevelopedModal(content) {
		this.toBeDevelopedModalRef = this.modalService.open(content, { centered: true });
		this.isModalOpen = true;
	}

	closeToBeDevelopedModal() {
		this.toBeDevelopedModalRef.close();
		this.isModalOpen = false;
	}

	openConfirmationModal() {
		this.confirmModalRef = this.modalService.open(this.confirmationModal, { centered: true });
		this.isModalOpen = true;
	}

	closeConfirmDialog() {
		this.confirmModalRef.close();
		this.isModalOpen = false;
	}

	confirmRemoveItem() {
		this.selectAction('remove');
		this.closeConfirmDialog();
	}

	capitalizeFirstLetterOfString(stringValue: string): string {
		if (stringValue) {
			return stringValue.toLowerCase().replace(/(?:^|\s|[-"'([{])+\S/g, (c) => c.toUpperCase());
		}

		return stringValue;
	}

	dateFormatter(val): any {
		return UiUtility.dateFormatter(val);
	}

	selectAction(action: string) {
		let checkList;
		let modal = false;
		let showInterval;
		let defaultRule = '';
		if (!this.ruleBased) {
			defaultRule = 'TRUE';
		}
		let defaultRelationship = '';
		for (let r = 0; r < this.projectRelations.length; r++) {
			if (this.projectRelations[r].allowableForNullTarget === false) {
				defaultRelationship = this.titleCaseWord(this.projectRelations[r].name);
				break;
			}
		}
		switch (action) {
			case 'add':
				checkList = this.mapsetData.filter((map) => {
					if (map.checked) {
						return map;
					}
				});
				checkList.forEach((check) => {
					this.addEmptyTargetToGroup(check.uuid, check.group);
				});
				break;
			case 'group':
				modal = true;
				this.headerGroupModal = this.modalService.open(this.headerGroup, { centered: true });
				this.isModalOpen = true;
				showInterval = setInterval(() => {
					document.getElementById('headerGroupCodeInput').focus();
					clearInterval(showInterval);
				}, 500);

				break;
			case 'set':
				this.mapsetData.forEach((map) => {
					if (map.checked) {
						map.mapEntries.toCode = '[Empty Target]';
						map.toCode = map.mapEntries.group + '/' + map.mapEntries.priority + '#' + '[Empty Target]';
						map.mapEntries.toName = '---';
						map.toName = '---';
						map.relation = this.noTargetRelations[0];
						map.mapEntries.relation = this.noTargetRelations[0];
						map.mapEntries.moduleId = this.tempModuleIdChangeBeforeRelease;
						map.mapEntries.modFlag = '';
						map.mapEntries.modLang = '';
						map.mapEntries.rule = defaultRule;
						map.mapEntries.additionalMapEntryInfos = [];
						map.mapEntries.mapAdvices = [];
						map.mapEntries.adviceAlways = [];
						map.mapEntries.advices = [];
						map.mapEntries.descriptions = [];
						map.moduleId = this.tempModuleIdChangeBeforeRelease;
						map.modFlag = '';
						map.modLang = '';
						map.rule = defaultRule;
						map.additionalMapEntryInfos = [];
						map.mapAdvices = [];
						map.adviceAlways = [];
						map.advices = [];
						map.descriptions = [];
					}
				});
				this.userChanged = true;
				this.gridApi.refreshCells(this.gridParams);
				break;
			case 'remove':
				this.userChanged = true;
				this.mapsetData = this.mapsetData.filter((map) => {
					return !map.checked;
				});
				this.checkedNum = 0;
				this.gridApi.redrawRows();
				break;
			case 'select':
				//?selectedTarget
				//(click)="setTarget(currentConcept.code)"
				break;
			default:
				this.openToBeDevelopedModal(this.tbdModal);
		}
		if (!modal) {
			if (this.gridSelectAll) {
				window['checkbox-table-all'].click();
			} else {
				this.unCheckAll();
			}
		}
	}

	unCheckAll() {
		this.mapsetData.forEach((map) => {
			if (map.checked) {
				map.checked = false;
			}
		});
		this.checkedNum = 0;
		this.gridApi.redrawRows();
	}

	/* mappings table functions */
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

	checkboxAllClick() {
		this.gridSelectAll == undefined || this.gridSelectAll ? (this.gridSelectAll = false) : (this.gridSelectAll = true);
		this.mapsetData = this.mapsetData.map((set) => {
			set.checked = this.gridSelectAll;
			return set;
		});
		this.gridApi.setGridOption('rowData', this.mapsetData);
		this.checkedNum = this.gridSelectAll ? this.mapsetData.length : 0;
	}

	setHeaderGroup() {
		this.mapsetData.forEach((map) => {
			if (map.checked) {
				map.mapEntries.group = this.headerGroupFC.value;
				map.group = this.headerGroupFC.value;
				map.toCode = this.headerGroupFC.value + '/' + map.mapEntries.priority + '#' + map.mapEntries.toCode;
			}
		});
		this.userChanged = true;
		this.gridApi.refreshCells(this.gridParams);
		this.gridApi.redrawRows();
		this.closeHeaderGroupModal();
	}

	closeHeaderGroupModal() {
		this.headerGroupFC.reset();
		this.headerGroupModal.close();
		this.isModalOpen = false;
		if (this.gridSelectAll) {
			window['checkbox-table-all'].click();
		} else {
			this.unCheckAll();
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

	/*end functions*/

	goToMappingPage(code) {
		this.router.navigate(['/mapset/' + this.mapsetCode + '/mapping/' + code], { replaceUrl: false, skipLocationChange: false });
	}

	goToMappingsPage() {
		this.router.navigate(['/mapset/' + this.mapsetCode + '/mappings'], { replaceUrl: false, skipLocationChange: false });
	}

	toggleSectionView(section: string) {
		if (section === 'showBrowserSection' && !this.loadedBrowser) {
			this.loadedBrowser = true;
		}
		if (this[section]) {
			this[section] = false;
		} else {
			this[section] = true;
			this.onResize(undefined);
		}
	}

	onResize(event) {}

	@HostListener('window:scroll', ['$event'])
	onScroll(event) {
		//this.closePopover();
	}
}
