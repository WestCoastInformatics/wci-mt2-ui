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
	OnDestroy,
} from '@angular/core';
import { formatDate } from '@angular/common';
import { PaginationChangedEvent, RowClassParams, ValueGetterParams } from 'ag-grid-community';
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
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { CategoryFilterComponent } from 'src/app/components/categoryFilter/category-filter.component';
import { DateTextFilterComponent } from 'src/app/components/dateTextFilter/date-text-filter.component';
import { PaginationComponent } from 'src/app/components/pagination/pagination.component';
import { TemplateRendererComponent } from 'src/app/components/cellRenderers/template.renderer';
import { Debounce } from 'src/app/decorators/debounce.decorator';
import { User } from 'src/app/models/user';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { PaginationService } from 'src/app/services/pagination.service';
import { MapWorkflow } from 'src/app/models/map-workflow.model';

@Component({
	standalone: false,
	selector: 'app-list-mapping',
	templateUrl: './list-mapping.component.html',
	styleUrls: ['./list-mapping.component.css'],
})
export class ListMappingComponent implements OnInit, OnDestroy {
	user!: User;
	userRoles: any[] = [];
	libraryOnly: any;
	searchInput = '';
	searchBrowserInput = '';
	targetCodeInput = '';
	targetNameInput = '';
	ruleBased = false;
	ruleOptions: any[] = [];
	rulesTrue = ['TRUE'];
	rulesFalse = ['TRUE', 'Gender - Female', 'Gender - Male'];
	targetTerminology = '';
	targetTerminologyVersion = '';
	mapRelations: any[] = [];
	targetRelations: any[] = [];
	noTargetRelations: any[] = [];
	projectRelations: any[] = [];
	mapAdvices: any[] = [];
	updateAdviceList: any[] = [];
	viewOptions = [
		{ value: 'all', display: 'All' },
		{ value: 'public', display: 'Public' },
		{ value: 'private', display: 'Private' },
	];
	selectedView = 'all';
	rowSelection = 'multiple';
	gridLastFilter = '';
	gridLastSort = '';
	showTable = false;
	mapsetResponse: any[] = [];
	mapsetData: any;
	dialog!: DialogService;
	versionStatuses: any;
	versions: any;
	organizations: any;
	initialGridWidth: number | undefined;
	showFullNarrativeText = false;
	showFullNotesText = false;
	showLoadingSpinner = false;
	toggleDropdown = false;
	numOfResults = 0;
	directUrl = '';
	numOfMembers: any;
	disableChannel = new BroadcastChannel('disable-button-channel');
	originalGridParams: any;
	searchCallArray: any[] = [];
	showLoadingSearch = true;
	toBeDevelopedModalRef!: NgbModalRef;
	confirmModalRef!: NgbModalRef;
	headerGroupModal!: NgbModalRef;
	workFlowModalRef!: NgbModalRef;
	isModalOpen = false;
	isWFMapModalOpen = false;
	conceptCode = '';
	mapsetName = 'Mapset Name';
	selectedMapset: any;
	showConfigSection = true;
	showBrowserSection = false;
	mapsetCode = '';
	mapsetInfo: any = {};
	selectedVersion: any;
	conceptCodes: any[] = [];
	mapping = '';
	routeParamsSubscription$!: Subscription;
	browserSubscription!: Subscription;
	gridSelectAll = false;
	popoverLocationY = 0;
	popoverLocationX = 0;
	popover_uuid = '';
	popover_adviceToAdd = '';
	popover_updateAdviceList: any[] = [];
	popover_addAdviceList: any[] = [];
	loaded = false;
	loadError = false;
	showPaging = false;
	showBrowser = false;
	browserLoaded = false;
	selectedFormat = {};
	formats: any;
	numOfGroups = 1;
	foundConceptCode = false;
	selectedTarget = '';
	selectedBrowser = '';
	userChanged = false;
	showAdvicePopover = false;
	showGroupPopover = false;
	showTargetPopover = false;
	tempModuleIdChangeBeforeRelease = '449080006';
	mapsetVersionStorage = 'mapsetVersion';
	mapsetListColumnStorage = 'listColumnStorage';
	mapsetLanguageStorage = 'mapsetLanguage';
	mapsetToLanguageStorage = 'mapsetToLanguage';
	listSearchInput = 'listSearchInput';
	mapsetListWorkflowFilter = 'listWorkflowFilter';
	mapsetListAssignedFilter = 'listAssignedFilter';
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
	gridColumnDefs: any;
	useDialog = false;
	moduleMetadata: any;
	internationalId = '449080006';
	checkedNum = 0;
	loadedBrowser = false;
	isNewPageSize = false;
	paginationPages: any = {};
	browserData: any[] = [];
	browserOptions: any;
	browserPaging = { pageSize: 10, pageSizeOptions: [10, 25, 50, 100], totalKnown: false, totalRows: null, manualStateRefresh: true };
	browserParams: any;
	browserApi: any;
	browserColumnDefs: any;
	conceptDetail = false;
	currentConcept: any;
	manualStateRefresh = false;
	rowClassRules: any;
	singleEditEnabled = false;
	listEditEnabled = false;
	userList: any;
	selectedUser: any;
	waitingForMapResponse = false;
	workFlowMapStatus = { label: '', value: '', status: '', roles: [''], message: '', notes: '', assign: false, edit: false };
	workFlowMapNotesFC = new FormControl('');
	workFlowMapActions = [];
	reviewMapWF: any;
	listMappingsPage: any;
	isMultiple = false;
	conceptCodeList: any;
	workflowFilter = '';
	assignedFilter = '';
	workflowFilterOptions = [
		{ label: 'Published', value: 'PUBLISHED' },
		{ label: 'New', value: 'NEW' },
		{ label: 'Ready For Publication', value: 'READY_FOR_PUBLICATION' },
		{ label: 'In Edit', value: 'EDITING_IN_PROGRESS' },
		{ label: 'Edit Completed', value: 'EDITING_DONE' },
		{ label: 'Ready For Review', value: 'REVIEW_NEEDED' },
		{ label: 'In Review', value: 'REVIEW_IN_PROGRESS' },
	];
	assignedFilterOptions: any[] = [];
	languageOptions: any[] = [];
	selectedLanguage = 'default';
	selectedToLanguage = 'default';
	headerNameColumnName = '';
	headerNameColumnTooltip = '';
	headerToNameColumnName = '';
	headerToNameColumnTooltip = '';

	@Output() loadingSpinner = new EventEmitter<boolean>(true);
	@ViewChild('workflowStatusSection') workflowStatus!: TemplateRef<any>;
	@ViewChild('selectRelationship') private selectRelationship!: MatSelect;
	@ViewChild('selectRule') private selectRule!: MatSelect;
	@ViewChild('selectAdvice') private selectAdvice!: MatSelect;
	@ViewChild('directoryInfoDialog') infoDialog!: TemplateRef<any>;
	@ViewChild('directoryFeedbackDialog') feedbackDialog!: TemplateRef<any>;
	@ViewChild('toBeDevelopedModal') tbdModal!: TemplateRef<any>;
	@ViewChild('headerGroupModal') headerGroup!: TemplateRef<any>;
	@ViewChild('directoryCheckSection') checkSection!: TemplateRef<any>;
	@ViewChild('browserCheckSection') checkBrowserSection!: TemplateRef<any>;
	@ViewChild('workFlowModalNotes') private workflowModalNotes!: ElementRef;
	@ViewChild('directoryCodeSection') codeSection!: TemplateRef<any>;
	@ViewChild('directoryNameSection') nameSection!: TemplateRef<any>;
	@ViewChild('directoryToNameSection') toNameSection!: TemplateRef<any>;
	@ViewChild('directoryAdviceSection') adviceSection!: TemplateRef<any>;
	@ViewChild('targetRuleSection') ruleSection!: TemplateRef<any>;
	@ViewChild('directoryActionSection') actionSection!: TemplateRef<any>;
	@ViewChild('directoryPaging') paginationComponent!: PaginationComponent;
	@ViewChild('directoryCategoryFilter') categoryFilter!: TemplateRef<any>;
	@ViewChild('directoryWorkflowStatusSection') versionStatus!: TemplateRef<any>;
	@ViewChild('confirmationModal') confirmationModal!: TemplateRef<any>;
	@ViewChild('actions') private actions!: MatSelect;
	@ViewChild('groupInput') private groupInput!: ElementRef;
	@ViewChild('targetInput') private targetInput!: ElementRef;
	@ViewChild('directorySearchInput') private directorySearchInput!: ElementRef;
	@ViewChild('browserSearchInput') private browserSearchInput!: ElementRef;
	@ViewChild('searchMenuTrigger') searchMenuTrigger!: MatMenuTrigger;
	@ViewChild('secondWindow') secondWindow!: ElementRef;
	@ViewChild('browserWrapper') browserWrapper!: ElementRef;

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
		this.reviewMapWF = MapWorkflow.getWorkFlowForMap();
		this.listMappingsPage = this;
	}

	//***** Framework Functions *****/
	ngOnInit() {
		this.user = this.authenticationService.getUser();
		this.userRoles = this.authenticationService.getUserPrimaryRoles();
		this.titleService.setTitle('Mapping Tool - List Edit Mappings');
		localStorage.setItem('unsavedChanges', 'false');
		this.routeParamsSubscription$ = this.route.params.subscribe((routeParams) => {
			this.route.url.forEach((part) => {
				part.forEach((value) => {
					if (value.path === 'library') {
						this.libraryOnly = true;
					}
					if (value.path === 'projects') {
						this.libraryOnly = false;
					}
				});
			});
			const prefix = this.libraryOnly ? 'library_' : 'projects_';
			this.mapsetCode = routeParams.code;
			this.conceptCodes = routeParams.concepts.split('_');
			this.mapsetVersionStorage = prefix + this.mapsetVersionStorage;
			this.mapsetListColumnStorage += routeParams.concepts;
			this.listSearchInput += routeParams.concepts;
			this.mapsetListWorkflowFilter += routeParams.concepts;
			this.mapsetListAssignedFilter += routeParams.concepts;

			if (this.mapsetCode) {
				this.getMapsetInfo();
			}
			this.getModuleMetadata();
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
			},
		];
		this.browserOptions = {
			context: { componentParent: this },
			pagination: true,
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
			components: {
				templateRenderer: TemplateRendererComponent,
			},
			defaultColDef: {
				sortable: false,
				filter: false,
				sortingOrder: ['asc', 'desc'],
				floatingFilter: false,
				suppressHeaderMenuButton: true,
				resizable: true,
				suppressMovable: true,
			},
			enableBrowserTooltips: true,
		};
		this.showBrowser = true;
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
				getQuickFilterText: (params: any) => {
					return '';
				},
			},
			{
				colId: 'code',
				field: 'code',
				tooltipField: 'code',
				headerName: 'Source',
				headerTooltip: 'Source',
				flex: 1,
				minWidth: 125,
				cellClass: 'blue-link',
				resizable: true,
				sortable: false,
			},
			{
				colId: 'name',
				field: 'name',
				headerValueGetter: (params: any) => `${this.headerNameColumnName}`,
				headerTooltipValueGetter: (params: any) => `${this.headerNameColumnTooltip}`,
				flex: 1,
				resizable: true,
				minWidth: 155,
				valueGetter: this.languageNameValueGetter.bind(this),
				tooltipValueGetter: this.languageNameValueGetter.bind(this),
				cellRenderer: TemplateRendererComponent,
				cellRendererParams: { template: this.nameSection },
				sortable: false,
				unSortIcon: false,
			},
			{
				colId: 'toCode',
				field: 'toCode',
				tooltipField: 'toCode',
				headerName: 'Target',
				headerTooltip: 'Target',
				flex: 1,
				minWidth: 145,
				cellRenderer: TemplateRendererComponent,
				cellRendererParams: {
					template: this.codeSection,
				},
				resizable: true,
				unSortIcon: false,
				sortable: false,
			},
			{
				colId: 'toName',
				field: 'toName',
				headerValueGetter: (params: any) => `${this.headerToNameColumnName}`,
				headerTooltipValueGetter: (params: any) => `${this.headerToNameColumnTooltip}`,
				resizable: true,
				unSortIcon: true,
				sortable: false,
				valueGetter: this.languageToNameValueGetter.bind(this),
				tooltipValueGetter: this.languageToNameValueGetter.bind(this),
				cellRenderer: TemplateRendererComponent,
				cellRendererParams: { template: this.toNameSection },
			},
			{
				colId: 'relation',
				field: 'relation',
				tooltipField: 'relation',
				headerName: 'Relationship',
				headerTooltip: 'Relationship',
				cellClass: (params: any) => {
					return 'noneditCell';
				},
				resizable: true,
				cellEditor: 'agSelectCellEditor',
				cellEditorParams: (params: any) => {
					const toCode = params.data?.mapEntries?.toCode;

					return toCode === '[Empty Target]'
						? { values: this.noTargetRelations, valueListGap: 1 }
						: { values: this.targetRelations, valueListGap: 1 };
				},
				unSortIcon: true,
				sortable: false,
				minWidth: 165,
				width: 165,
				editable: (params: any) => {
					return false;
				},
			},
			{
				colId: 'rule',
				field: 'rule',
				tooltipField: 'rule',
				headerName: 'Rule',
				headerTooltip: 'Rule',
				cellClass: (params: any) => {
					return 'noneditCell';
				},
				minWidth: 120,
				width: 120,
				resizable: true,
				cellEditor: 'agSelectCellEditor',
				cellEditorParams: {
					values: this.ruleOptions,
				},
				editable: (params: any) => {
					return false;
				},
				unSortIcon: true,
				sortable: false,
			},
			{
				colId: 'advices',
				field: 'mapEntries',
				headerName: 'Advices',
				headerTooltip: 'advices',
				cellClass: 'mt2-directory-column-advices',
				minWidth: 85,
				width: 135,
				resizable: true,
				cellRenderer: TemplateRendererComponent,
				cellRendererParams: { template: this.adviceSection },
				unSortIcon: true,
				sortable: false,
			},
			{
				colId: 'workFlowStatus',
				field: 'workflowStatus',
				tooltipField: 'workflowStatus',
				headerName: 'Workflow Status',
				cellClass: 'mt2-directory-column-version-status',
				minWidth: 165,
				width: 200,
				resizable: true,
				cellRenderer: TemplateRendererComponent,
				cellRendererParams: { template: this.workflowStatus },
				unSortIcon: true,
				sortable: false,
				hide: true,
			},
			{
				colId: 'assignedUser',
				field: 'assignedUser',
				tooltipField: 'assignedUser',
				headerName: 'Assigned To',
				headerTooltip: 'Assigned To',
				cellClass: 'mt2-directory-column-id',
				width: 145,
				resizable: true,
				unSortIcon: true,
				sortable: false,
			},
			{
				colId: 'modified',
				field: 'modified',
				tooltipValueGetter: UiUtility.gridDateValueGetter,
				headerName: 'Last Modified',
				headerTooltip: 'Last Modified',
				cellClass: 'mt2-directory-column-modified-date',
				minWidth: 65,
				width: 155,
				resizable: true,
				valueGetter: UiUtility.gridDateValueGetter,
				floatingFilterComponent: DateTextFilterComponent,
				floatingFilterComponentParams: { suppressFilterButton: true },
				unSortIcon: true,
				sortable: false,
			},
			{
				field: 'feedback',
				colId: 'action-btns',
				headerName: '',
				width: 125,
				cellClass: 'mt2-directory-column-actions',
				cellRenderer: TemplateRendererComponent,
				cellRendererParams: { template: this.actionSection },
				sortable: false,
				filter: false,
				resizable: false,
				getQuickFilterText: (params: any) => {
					return '';
				},
			},
		];
		const sourceColumns: any[] = [];
		const targetColumns: any[] = [];
		for (const options of this.languageOptions) {
			if (options.value !== 'default') {
				const nameOption = {
					colId: `source_${options.value}`,
					headerName: `Source ${options.display}`,
					headerTooltip: `Source ${options.title}`,
					tooltipValueGetter: (params: ValueGetterParams) => this.languageNameAllValueGetter(params, options.value),
					flex: 2,
					resizable: true,
					minWidth: 165,
					valueGetter: (params: ValueGetterParams) => this.languageNameAllValueGetter(params, options.value),
					sortable: false,
					unSortIcon: false,
				};
				const nameToOption = {
					colId: `target_${options.value}`,
					headerName: `Target ${options.display}`,
					headerTooltip: `Target ${options.title}`,
					tooltipValueGetter: (params: ValueGetterParams) => this.languageToNameAllValueGetter(params, options.value),
					resizable: true,
					unSortIcon: false,
					sortable: false,
					valueGetter: (params: ValueGetterParams) => this.languageToNameAllValueGetter(params, options.value),
				};
				sourceColumns.push(nameOption);
				targetColumns.push(nameToOption);
			}
		}
		this.gridColumnDefs = this.gridColumnDefs.flatMap((col: any) => {
			if (col.colId === 'name') {
				return [col, ...sourceColumns];
			}
			if (col.colId === 'toName') {
				return [col, ...targetColumns];
			}
			return [col];
		});

		this.loadLanguageStorage();

		this.gridOptions = {
			context: { componentParent: this },
			pagination: false,
			suppressColumnVirtualisation: true,
			suppressPaginationPanel: true,
			paginationPageSize: this.gridPaging.pageSize,
			rowSelection: 'single',
			animateRows: false,
			enableCellTextSelection: true,
			singleClickEdit: true,
			onGridReady: this.onGridReady,
			onCellDoubleClicked: this.onGridCellClick,
			onCellValueChanged: this.onCellValueChanged,
			components: {
				templateRenderer: TemplateRendererComponent,
				categoryFilterComponent: CategoryFilterComponent,
				dateTextFilterComponent: DateTextFilterComponent,
			},
			defaultColDef: {
				sortable: false,
				filter: false,
				sortingOrder: ['asc', 'desc'],
				floatingFilter: false,
				suppressHeaderMenuButton: true,
				resizable: true,
			},
			enableBrowserTooltips: true,
			rowClassRules: {
				'updated-row': (params: RowClassParams) => {
					return params.data?.updated === true;
				},
			},
		};
		this.showTable = true;
	}

	onGridReady = (gridReadyParams: any) => {
		if (gridReadyParams?.api && gridReadyParams.type === 'gridReady') {
			this.gridApi = gridReadyParams.api;
			this.gridParams = gridReadyParams;
			setTimeout(() => {
				this.checkSearchFilters();
			}, 500);
		}
		const _window = window;
		_window['checkboxHandleClick'] = () => {
			this.checkboxAllClick();
		};
	};

	checkColumnSettings() {
		if (this.mapsetListColumnStorage) {
			if (!localStorage.getItem(this.mapsetListColumnStorage)) {
				const columns: any = [];
				const columnDefs = this.gridApi.getColumnDefs?.();
				for (const column of columnDefs) {
					const columnData: any = {};

					if (!column.colId) {
						columnData.colId = column.field;
					} else {
						columnData.colId = column.colId;
					}
					columnData.show = true;
					if (columnData.colId !== 'action-btns' && columnData.colId !== 'checkbox') {
						columns.push(columnData);
					}
				}

				const state: any = [];
				for (const column of columns) {
					column.show = true;
					if (column.colId === 'relation' || column.colId === 'rule' || column.colId === 'advices') {
						column.show = false;
					}
					this.manualStateRefresh = true;
					for (const languages of this.languageOptions) {
						const sourceId = `source_${languages.value}`;
						if (column.colId === sourceId || column.colId === `target_${languages.value}`) {
							column.show = false;
							this.manualStateRefresh = true;
						}
					}
					state.push({ colId: column.colId, hide: !column.show });
				}
				this.gridApi.applyColumnState({ state: state });
				localStorage.setItem(this.mapsetListColumnStorage, JSON.stringify(state));
			} else {
				this.gridApi.applyColumnState({ state: JSON.parse(localStorage.getItem(this.mapsetListColumnStorage)) });
				this.manualStateRefresh = true;
			}
		}
	}

	loadLanguageStorage() {
		const languageStorage = localStorage.getItem(this.mapsetLanguageStorage);
		if (languageStorage) {
			this.selectedLanguage = languageStorage;
		}
		const languageToStorage = localStorage.getItem(this.mapsetToLanguageStorage);
		if (languageToStorage) {
			this.selectedToLanguage = languageToStorage;
		}
		this.gridApi?.refreshCells();
	}

	checkSearchFilters() {
		const filters: string[] = [];
		if (localStorage.getItem(this.listSearchInput)) {
			this.searchInput = JSON.parse(localStorage.getItem(this.listSearchInput));
			filters.push(this.searchInput);
		}
		if (localStorage.getItem(this.mapsetListWorkflowFilter)) {
			this.workflowFilter = JSON.parse(localStorage.getItem(this.mapsetListWorkflowFilter));
			filters.push(this.workflowFilter);
		}
		if (localStorage.getItem(this.mapsetListAssignedFilter)) {
			this.assignedFilter = JSON.parse(localStorage.getItem(this.mapsetListAssignedFilter));
			filters.push(this.assignedFilter);
		}
		if (filters.length > 0) {
			this.gridApi.setGridOption('quickFilterText', filters.join(' '));
			if (this.gridApi.getDisplayedRowCount() > 0) {
				this.showPaging = true;
			} else {
				this.showPaging = false;
			}
		}
	}

	onCellValueChanged = (event: any) => {
		for (let c of this.mapsetData) {
			if (c.index === event.data.index) {
				c.updated = true;
				c.showChanged = true;
			} else {
				c.updated = false;
			}
		}
		this.gridApi.redrawRows();
		this.userChanged = true;
		localStorage.setItem('unsavedChanges', 'true');
	};

	onGridCellClick = (event: any) => {
		if (
			event.column.colId !== 'checkbox' &&
			event.column.colId !== 'action-btns' &&
			event.column.colId !== 'relation-select' &&
			event.column.colId !== 'rule-select'
		) {
			this.goToMappingPage(event.data.code);
		}
	};

	onBrowserReady = (params: any) => {
		this.browserParams = params;
		this.browserApi = params.api;
	};

	onBrowserCellClick = (event: any) => {
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
			error: (err: any) => {
				console.error(' Error: ', err);
				this.authenticationService.checkError(err);
			},
		});
	}

	closeConceptDetails() {
		this.conceptDetail = false;
	}

	getMapsetInfo() {
		this.refsetService.getMapsetsByCode(this.mapsetCode).subscribe(
			(results) => {
				let mapsetVersions = Array.isArray(results) ? results : [results];
				if (this.libraryOnly) {
					mapsetVersions = mapsetVersions.filter((mapset) => mapset.versionStatus === 'PUBLISHED');
				} else {
					mapsetVersions = mapsetVersions.filter((mapset) => mapset.versionStatus === 'IN DEVELOPMENT');
				}

				if (!mapsetVersions || mapsetVersions.length === 0) {
					this.mapsetInfo = {};
					this.versionStatuses = [];
					this.selectedVersion = undefined;
					return;
				}
				if (!this.libraryOnly) {
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
				}
				this.mapsetInfo = mapsetVersions[0];
				this.versionStatuses = mapsetVersions.map((v) => {
					const versionDate = v.versionDate || new Date();
					return formatDate(versionDate, 'MM-dd-yyyy', 'en-US', 'UTC') + ' (' + v.versionStatus + ') ';
				});
				const storedMapsetVersion = localStorage.getItem(this.mapsetVersionStorage);
				if (storedMapsetVersion) {
					this.selectedVersion = JSON.parse(storedMapsetVersion);
					const foundVersion = mapsetVersions.filter((v) => {
						const versionDate = v.versionDate || new Date();
						const mapsetVersionStatus = formatDate(versionDate, 'MM-dd-yyyy', 'en-US', 'UTC') + ' (' + v.versionStatus + ') ';
						return mapsetVersionStatus === this.selectedVersion;
					});
					if (foundVersion.length > 0) {
						this.mapsetInfo = foundVersion[0];
					}
				} else {
					if (this.versionStatuses.length > 0) {
						this.selectedVersion = this.versionStatuses[0];
						localStorage.setItem(this.mapsetVersionStorage, JSON.stringify(this.selectedVersion));
					}
				}
				const languages = this.mapsetInfo?.mapProject.edition?.fullyQualifiedLanguageRefsets;
				const languageRefsetOptions = [];
				languageRefsetOptions.push({ value: 'default', display: '(PT)', title: '(PT)' });
				const languageStorage = localStorage.getItem(this.mapsetLanguageStorage);
				const languageToStorage = localStorage.getItem(this.mapsetToLanguageStorage);
				if (languageStorage) {
					this.selectedLanguage = languageStorage;
				}
				if (languageToStorage) {
					this.selectedToLanguage = languageToStorage;
				}
				for (const language of languages) {
					let type = 'PT';
					if (language.qualifiedLanguageCode.indexOf('FSN') >= 0) {
						type = 'FSN';
					}
					const languageValue = language.qualifiedLanguageRefset;
					if (!this.selectedLanguage && !languageStorage) {
						this.selectedLanguage = languageValue;
					}
					if (!this.selectedToLanguage && !languageToStorage) {
						this.selectedToLanguage = languageValue;
					}
					languageRefsetOptions.push({
						value: languageValue,
						display: language.qualifiedLanguageDialectCode + ' (' + type + ')',
						title: language.languageTermDescription,
					});
				}
				if (languageRefsetOptions.length > 0) {
					this.languageOptions = languageRefsetOptions;
				}
				this.getMapsetData();
				this.getMapProject();
			},
			(err) => {
				console.error(' Error: ', err);
				this.authenticationService.checkError(err);
			},
		);
		this.refsetService.getMapsetsByCode(this.mapsetCode).subscribe({
			next: (results) => {
				if (results?.length > 0) {
					this.mapsetName = results[0]?.refSetName;
					this.selectedMapset = results[0];
				} else {
					this.notificationService.show('Error loading, please try again.', 'Error', 'error', { timeOut: 2500, extendedTimeOut: 0 });
				}
			},
			error: (err) => {
				console.error(' Error: ', err);
				this.authenticationService.checkError(err);
			},
		});
	}

	changeLanguage() {
		const languageStorage = localStorage.getItem(this.mapsetLanguageStorage);
		if (this.selectedLanguage !== languageStorage) {
			localStorage.setItem(this.mapsetLanguageStorage, this.selectedLanguage);
		}
		const languageToStorage = localStorage.getItem(this.mapsetToLanguageStorage);
		if (this.selectedToLanguage !== languageToStorage) {
			localStorage.setItem(this.mapsetToLanguageStorage, this.selectedToLanguage);
		}
		this.getMapsetInfo();
		setTimeout(() => {
			this.changeHeaderTitle();
		}, 2500);
	}

	getLanguageNameValue(mapset: any) {
		if (!CodeUtility.hasValue(mapset)) {
			return '';
		}
		let text = '';
		let label = '';
		let title = '';
		const selectedLang = this.selectedLanguage;
		let selectedLanguage = [];
		for (const language of this.languageOptions) {
			if (language.value === this.selectedLanguage) {
				selectedLanguage.push(language);
			}
		}
		if (selectedLanguage.length > 0) {
			label = selectedLanguage[0].display;
			title = selectedLanguage[0].title;
		}
		if (mapset?.descriptions && selectedLanguage[0].value !== 'default') {
			const choosenDescription = mapset.descriptions.filter((description: any) => {
				return description.languageId === selectedLang;
			})[0];
			if (choosenDescription) {
				text = choosenDescription.term;
			}
		} else {
			text = mapset.name;
		}
		this.headerNameColumnName = 'Source ' + label;
		this.headerNameColumnTooltip = title === '' ? 'Source ' + label : 'Source ' + title;
		return text;
	}

	getLanguageToNameValue(mapset: any) {
		if (!CodeUtility.hasValue(mapset)) {
			return '';
		}
		let text = '';
		let label = '';
		let title = '';
		const selectedLang = this.selectedToLanguage;
		let selectedToLanguage = [];
		for (const language of this.languageOptions) {
			if (language.value === this.selectedToLanguage) {
				selectedToLanguage.push(language);
			}
		}
		if (selectedToLanguage.length > 0) {
			label = selectedToLanguage[0].display;
			title = selectedToLanguage[0].title;
		}
		if (mapset?.toDescription && selectedToLanguage[0].value !== 'default') {
			const choosenDescription = mapset.toDescription.filter((description: any) => {
				return description.languageId === selectedLang;
			})[0];
			if (choosenDescription) {
				text = choosenDescription.term;
			}
		} else {
			text = mapset.toName === 'DOES NOT EXIST' || mapset.toName === null ? '---' : mapset.toName;
		}
		this.headerToNameColumnName = 'Target ' + label;
		this.headerToNameColumnTooltip = title === '' ? 'Target ' + label : 'Target ' + title;
		return text;
	}

	languageNameAllValueGetter(params: any, language: string) {
		if (!CodeUtility.hasValue(params.data)) {
			return '';
		}
		const mapset = params.data;
		let text = '';
		let label = '';
		const selectedLang = language;
		let selectedLanguage = [];
		for (const language of this.languageOptions) {
			if (language.value === selectedLang) {
				selectedLanguage.push(language);
			}
		}
		if (selectedLanguage.length > 0) {
			label = selectedLanguage[0].display;
		}
		if (mapset?.descriptions && selectedLanguage[0].value !== 'default') {
			const choosenDescription = mapset.descriptions.filter((description: any) => {
				return description.languageId === selectedLang;
			})[0];
			if (choosenDescription) {
				text = choosenDescription.term;
			}
		} else {
			text = mapset.name;
		}
		return text;
	}

	languageToNameAllValueGetter(params: any, language: string) {
		if (!CodeUtility.hasValue(params.data)) {
			return '';
		}
		const mapset = params.data;
		let text = '';
		let label = '';
		const selectedLang = language;
		let selectedLanguage = [];
		for (const language of this.languageOptions) {
			if (language.value === selectedLang) {
				selectedLanguage.push(language);
			}
		}
		if (selectedLanguage.length > 0) {
			label = selectedLanguage[0].display;
		}
		if (mapset?.toDescription && selectedLanguage[0].value !== 'default') {
			const choosenDescription = mapset.toDescription.filter((description: any) => {
				return description.languageId === selectedLang;
			})[0];
			if (choosenDescription) {
				text = choosenDescription.term;
			}
		} else {
			text = mapset.toName === 'DOES NOT EXIST' || mapset.toName === null ? '---' : mapset.toName;
		}
		return text;
	}

	languageNameValueGetter(params: any) {
		if (!CodeUtility.hasValue(params.data)) {
			return '';
		}
		const mapset = params.data;
		let text = '';
		let label = '';
		let title = '';
		const selectedLang = this.selectedLanguage;
		let selectedLanguage = [];
		for (const language of this.languageOptions) {
			if (language.value === this.selectedLanguage) {
				selectedLanguage.push(language);
			}
		}
		if (selectedLanguage.length > 0) {
			label = selectedLanguage[0].display;
			title = selectedLanguage[0].title;
		}
		if (mapset?.descriptions && selectedLanguage[0].value !== 'default') {
			const choosenDescription = mapset.descriptions.filter((description: any) => {
				return description.languageId === selectedLang;
			})[0];
			if (choosenDescription) {
				text = choosenDescription.term;
			}
		} else {
			text = mapset.name;
		}
		this.headerNameColumnName = 'Source ' + label;
		this.headerNameColumnTooltip = title === '' ? 'Source ' + label : 'Source ' + title;
		return text;
	}

	languageToNameValueGetter(params: any) {
		if (!CodeUtility.hasValue(params.data)) {
			return '';
		}
		const mapset = params.data;
		let text = '';
		let label = '';
		let title = '';
		let selectedToLanguage = [];
		for (const language of this.languageOptions) {
			if (language.value === this.selectedToLanguage) {
				selectedToLanguage.push(language);
			}
		}
		if (selectedToLanguage.length > 0) {
			label = selectedToLanguage[0].display;
			title = selectedToLanguage[0].title;
		}
		const selectedLang = this.selectedToLanguage;
		if (mapset?.toDescription && selectedToLanguage[0].value !== 'default') {
			const choosenDescription = mapset.toDescription.filter((description: any) => {
				return description.languageId === selectedLang;
			})[0];
			if (choosenDescription) {
				text = choosenDescription.term;
			}
		} else {
			text = mapset.toName === 'DOES NOT EXIST' || mapset.toName === null ? '---' : mapset.toName;
		}
		this.headerToNameColumnName = 'Target ' + label;
		this.headerToNameColumnTooltip = title === '' ? 'Target ' + label : 'Target ' + title;
		return text;
	}

	changeHeaderTitle() {
		const columnDefs = this.gridApi.getColumnDefs?.();
		const updatedDefs = columnDefs.flatMap((col: any) => {
			if (col.colId === 'name' && col.headerName !== this.headerNameColumnName) {
				col.headerName = this.headerNameColumnName;
				col.headerTooltip = this.headerNameColumnTooltip;
				return [col];
			}
			if (col.colId === 'toName' && col.headerName !== this.headerToNameColumnName) {
				col.headerName = this.headerToNameColumnName;
				col.headerTooltip = this.headerToNameColumnTooltip;
				return [col];
			}
			return [col];
		});
		this.manualStateRefresh = true;
		this.gridApi.setGridOption('columnDefs', updatedDefs);
		this.checkColumnSettings();
	}

	getModuleMetadata() {
		if (this.mt2Service.moduleMetadata.value?.length === 0) {
			this.refsetService.getMetadata().subscribe({
				next: (results) => {
					this.mt2Service.setModuleMetadata(results);
					this.moduleMetadata = results;
				},
				error: (err) => {
					console.error(' Error: ', err);
					this.authenticationService.checkError(err);
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
		const projectId = this.mapsetInfo.mapProject.id;
		this.refsetService.getMapProjectById(projectId, params).subscribe({
			next: (results) => {
				this.targetTerminology = results.destinationTerminology;
				this.targetTerminologyVersion = results.destinationTerminologyVersion;
				this.ruleBased = results.ruleBased;
				this.ruleOptions = this.ruleBased ? this.rulesFalse : this.rulesTrue;
				this.projectRelations = results.mapRelations || [];
				if (this.projectRelations.length > 0) {
					if (this.projectRelations.length === 1) {
						const relationName = this.titleCaseWord(this.projectRelations[0].name);
						this.targetRelations = [relationName];
						this.noTargetRelations = [relationName];
					} else {
						this.targetRelations = this.projectRelations
							.filter((res) => res.allowableForNullTarget === false)
							.map((res) => this.titleCaseWord(res.name));
						this.noTargetRelations = this.projectRelations
							.filter((res) => res.allowableForNullTarget === true)
							.map((res) => this.titleCaseWord(res.name));
					}
					this.mapRelations = this.projectRelations.map((res) => this.titleCaseWord(res.name));
				}
				this.ruleOptions = ['FALSE', ...this.ruleOptions];
				this.mapAdvices = results.mapAdvices || [];
				if (this.mapAdvices.length > 0) {
					this.mapAdvices = results.mapAdvices.map((res: any) => {
						return res.name;
					});
				}
				this.loadGridColumns();
			},
			error: (err: any) => {
				this.loadError = true;
				console.error(' Error: ', err);
				this.authenticationService.checkError(err);
			},
		});
	}

	titleCaseWord(word: string) {
		if (!word) return word;
		return word[0].toUpperCase() + word.substr(1).toLowerCase();
	}

	getDefaultRelationship(forNullTarget: boolean): string {
		if (this.projectRelations.length === 1) {
			return this.titleCaseWord(this.projectRelations[0].name);
		}
		for (let r = 0; r < this.projectRelations.length; r++) {
			if (this.projectRelations[r].allowableForNullTarget === forNullTarget) {
				return this.titleCaseWord(this.projectRelations[r].name);
			}
		}
		return '';
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
			localStorage.setItem(this.listSearchInput, JSON.stringify(this.searchInput));
			this.checkSearchFilters();
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
		this.closeConceptDetails();
		this.searchBrowserInput = this.searchBrowserInput.trim();

		if (CodeUtility.hasValue(this.searchBrowserInput) && this.searchBrowserInput.length > 2) {
			this.setPageSize(10);
			this.goToPage(0);
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
		}
	}

	setPageSize(size: number) {
		this.goToPage(0);
		this.browserApi.setGridOption('paginationPageSize', size);
	}

	goToPage(number: number) {
		this.browserApi.paginationGoToPage(number);
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
			error: (err) => {
				console.error(' Error: ', err);
				this.authenticationService.checkError(err);
			},
		});
	}

	filterSelection(filter: string): void {
		switch (filter) {
			case 'workflow':
				this.gridApi.setGridOption('quickFilterText', this.workflowFilter);
				localStorage.setItem(this.mapsetListWorkflowFilter, JSON.stringify(this.workflowFilter));
				break;
			case 'assigned':
				this.gridApi.setGridOption('quickFilterText', this.assignedFilter);
				localStorage.setItem(this.mapsetListAssignedFilter, JSON.stringify(this.assignedFilter));
				break;
		}
	}

	createDataSource() {
		return {
			rowCount: null,
			getRows: (rowParams: any) => {
				const startRow = rowParams.startRow;
				const endRow = rowParams.endRow;
				const sortModel = rowParams.sortModel;
				this.browserApi.setGridOption('loading', true);
				let query = this.searchBrowserInput;
				if (this.searchBrowserInput === '') {
					query = '';
				}
				const storedWorkflowFilter = localStorage.getItem(this.mapsetListWorkflowFilter);
				if (storedWorkflowFilter) {
					this.workflowFilter = JSON.parse(storedWorkflowFilter);
				}
				const storedAssignedFilter = localStorage.getItem(this.mapsetListAssignedFilter);
				if (storedAssignedFilter) {
					this.assignedFilter = JSON.parse(storedAssignedFilter);
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
					let addFilters = '';
					if (this.workflowFilter !== '') {
						addFilters += `&workflowStatus=${this.workflowFilter}`;
					}
					if (this.assignedFilter !== '') {
						addFilters += `&assignedUser=${this.assignedFilter}`;
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

								if (this.browserData?.length > 0) {
									this.browserApi.setGridOption('loading', false);
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
							error: (error: any) => {
								this.browserApi.showNoRowsOverlay();
								rowParams.successCallback([], 0);
								//console.error(' Error: ', error);
								this.authenticationService.checkError(error);
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
		if (this.mapsetInfo?.id !== undefined) {
			this.refsetService.getMappingByMapsetConceptList(this.mapsetInfo.id, this.conceptCodes.join(',')).subscribe({
				next: (response) => {
					const listData = [];
					const list = response.items;
					this.mapsetResponse = list;
					this.assignedFilterOptions = [];
					let source = '';
					let odd = true;
					let even = false;
					for (let i = 0; i < list.length; i++) {
						const results = list[i];
						let data = {};
						let count = 0;
						for (let b = 0; b < results.mapEntries.length; b++) {
							if (this.numOfGroups < results.mapEntries[b].group) {
								this.numOfGroups = results.mapEntries[b].group;
							}
							results.mapEntries[b].advices = results.mapEntries[b].advices.filter(function (res: any) {
								return res !== '';
							});
							let adviceAlways = [];
							adviceAlways = results.mapEntries[b].advices.filter(function (res: any) {
								return res.indexOf('ALWAYS') > -1;
							});
							let mapAdvices = [];
							mapAdvices = results.mapEntries[b].advices.filter(function (res: any) {
								return res.indexOf('ALWAYS') === -1;
							});
							results.mapEntries[b].mapAdvices = mapAdvices;
							results.mapEntries[b].adviceAlways = adviceAlways;
							const toDescription = [];
							for (let i = 0; i < results.mapEntries[b].descriptions?.length; i++) {
								toDescription.push(results.mapEntries[b].descriptions[i]);
							}
							if (toDescription.length > 0) {
								results.mapEntries[b].toDescription = toDescription;
							}
							if (source === '') {
								source = results.code;
							}
							if (source !== results.code) {
								source = results.code;
								if (!even) {
									even = true;
									odd = false;
								} else {
									even = false;
									odd = true;
								}
							}
							data = {
								uuid: results.code + results.mapEntries[b].modified + b,
								index: results.code + count,
								active: results.active,
								feedback: true,
								mapEntries: results.mapEntries[b],
								descriptions: results?.descriptions,
								entries: results.mapEntries.length,
								code: results.code,
								name: results.name,
								toDescription: toDescription,
								toName:
									results.mapEntries[b].toName.length > 0 && results.mapEntries[b].toName !== ' DOES NOT EXIST'
										? results.mapEntries[b].toName
										: '---',
								toCode:
									results.mapEntries[b].toCode.length > 0
										? results.mapEntries[b].group + '/' + results.mapEntries[b].priority + '#' + results.mapEntries[b].toCode
										: results.mapEntries[b].group + '/' + results.mapEntries[b].priority + '#[Empty Target]',
								rule: results.mapEntries[b].rule.length > 0 ? results.mapEntries[b].rule : '---',
								odd: odd,
								even: even,
								relation: results.mapEntries[b].relation.length > 0 ? this.titleCaseWord(results.mapEntries[b].relation) : '---',
								modified: results.mapEntries[b].modified,
								modifiedBy: results.mapEntries[b].modifiedBy,
								advices: results.mapEntries[b].advices,
								advices_open: false,
								group: results.mapEntries[b].group,
								priority: results.mapEntries[b].priority,
								moduleId: results.mapEntries[b].moduleId,
								modFlag: this.getModuleLanguageIcon(results.mapEntries[b].moduleId),
								modLang: this.getModuleLanguageName(results.mapEntries[b].moduleId),
								workflowStatus: results.mappingWorkflow?.workflowStatus,
								hasNotes: results.mapNotes?.length > 0 ? true : false,
								assignedUser: results.mappingWorkflow?.assignedUser,
								editable: this.isMapEditable(results.mappingWorkflow?.workflowStatus, results.mappingWorkflow?.assignedUser),
								showChanged: this.userChanged,
							};
							const assignedUser = results.mappingWorkflow?.assignedUser;
							if (assignedUser !== null && assignedUser !== undefined) {
								const isDuplicate = this.assignedFilterOptions.some((option) => option.value === assignedUser);
								if (!isDuplicate) {
									this.assignedFilterOptions.push({
										label: assignedUser,
										value: assignedUser,
									});
								}
							}
							count++;
							listData.push(data);
						}
					}
					this.mapsetData = listData;

					if (listData?.length > 0) {
						this.showPaging = true;
						this.loaded = true;
					} else {
						this.showPaging = false;
					}
					setTimeout(() => {
						const lastIndex = document.getElementsByClassName('ag-header').length - 1;
						const child = document.getElementsByClassName('ag-header')[0]; //lastIndex];
						document.getElementById('directoryHeader').appendChild(child);
						this.changeHeaderTitle();
					}, 400);

					this.breadcrumbService.setBreadcrumbs([
						{ path: this.libraryOnly ? '/library/' : '/projects/', label: this.libraryOnly ? 'Library' : 'Projects' },
						{ path: this.libraryOnly ? '/library/' : '/projects/' + '/mapset/' + this.mapsetCode + '/mappings', label: this.mapsetName },
						{ label: 'List Edit Mappings' },
					]);
				},
				error: (error: any) => {
					console.error(' Error: ', error);
					this.authenticationService.checkError(error);
					setTimeout(() => {
						this.goToMappingsPage();
					}, 1500);
				},
			});
		}
	}

	isMapEditable(workflowStatus: string, assignedUser: string): boolean {
		let editable = false;
		const foundActions = this.reviewMapWF.filter((wf: any) => {
			if (workflowStatus !== wf.status) {
				return false;
			}
			return Array.isArray(wf.roles) && wf.roles.some((role: string) => this.userRoles.includes(role));
		});
		if (foundActions.length > 0) {
			const foundEdit = foundActions.filter((wfAction: Record<string, unknown>) => {
				return wfAction.edit === true;
			});
			if (foundEdit.length > 0) {
				if (assignedUser === this.user?.userName) {
					editable = true;
				}
			}
		}
		return editable;
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

	searchBrowser() {
		if (this.showConfigSection) {
			this.toggleSectionView('showConfigSection');
		}
		if (!this.showBrowserSection) {
			this.toggleSectionView('showBrowserSection');
			this.secondWindow.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
		setTimeout(() => {
			this.searchBrowserInput = this.targetFC.value['code'];
			this.onBrowserSearchChange();
		}, 100);
	}

	openPopover(event: any, params: any): void {
		this.showAdvicePopover = true;
		this.showGroupPopover = false;
		this.showTargetPopover = false;
		this.popoverLocationY = event.y + 15 - 395 + document.getElementsByClassName('mt2-container')[0].scrollTop;
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

	openToBeDevelopedModal(content: any) {
		this.toBeDevelopedModalRef = this.modalService.open(content, { centered: true });
		this.isModalOpen = true;
	}

	closeToBeDevelopedModal() {
		this.toBeDevelopedModalRef.close();
		this.isModalOpen = false;
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

	checkMapEditStatus(map): boolean {
		let editable = false;
		const status = map.workflowStatus === undefined ? map.mappingWorkflow.workflowStatus : map.workflowStatus;
		const assigned = map.assignedUser === undefined ? map.mappingWorkflow.assignedUser : map.assignedUser;
		const availableActions = this.reviewMapWF.filter((wf: any) => {
			if (!status.includes(wf.status) || wf.edit !== true) {
				return false;
			}

			return Array.isArray(wf.roles) && wf.roles.some((role: string) => this.userRoles.includes(role));
		});
		if (availableActions.length > 0) {
			if (assigned === this.user?.userName) {
				editable = true;
				return editable;
			} else {
				return editable;
			}
		} else {
			return editable;
		}
	}

	selectAction(action: string) {
		let checkList;
		let modal = false;
		let showInterval;
		let defaultRule = '';
		if (!this.ruleBased) {
			defaultRule = 'TRUE';
		}
		for (let m of this.mapsetData) {
			m.updated = false;
			this.gridApi.redrawRows();
		}
		switch (action) {
			case 'view':
				if (this.checkedNum === 1) {
					for (let c = 0; c < this.mapsetData.length; c++) {
						if (this.mapsetData[c].checked === true) {
							setTimeout(() => {
								this.goToMappingPage(this.mapsetData[c].code);
							}, 2);
						}
					}
				}
				break;
			case 'batch':
				if (this.checkedNum > 1) {
					const codes: string[] = [];
					for (let c = 0; c < this.mapsetData.length; c++) {
						if (this.mapsetData[c].checked === true) {
							codes.push(this.mapsetData[c].code);
						}
					}
					const uniqueCodes = [...new Set(codes)];
					if (uniqueCodes.length > 0) {
						setTimeout(() => {
							this.goToBatchMappingsPage(uniqueCodes);
						}, 2);
					}
				}
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
		this.mapsetData.forEach((map: any) => {
			if (map.checked) {
				map.updated = true;
				map.checked = false;
			}
		});
		this.checkedNum = 0;
		this.gridApi.redrawRows();
	}

	/* mappings table functions */
	checkboxRowSelect(event: any, index: any) {
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
		this.checkedStatusActions();
	}

	checkedStatusActions() {
		this.singleEditEnabled = false;
		this.listEditEnabled = false;
		this.workFlowMapActions = [];
		let multiStatus = [];
		let assigned = [];
		for (let c = 0; c < this.mapsetData.length; c++) {
			if (this.mapsetData[c].checked === true) {
				assigned.push(this.mapsetData[c].assignedUser);
				multiStatus.push(this.mapsetData[c].workflowStatus);
			}
		}
		if (this.checkedNum > 0 && multiStatus.length > 0) {
			const availableActions = this.reviewMapWF.filter((wf: any) => {
				if (!multiStatus.includes(wf.status)) {
					return false;
				}

				return Array.isArray(wf.roles) && wf.roles.some((role: string) => this.userRoles.includes(role));
			});
			if (availableActions) {
				const bulkActions = new Set(availableActions.map((item) => `${item.value}-${item.status}`));

				if (bulkActions.size > 0) {
					this.workFlowMapActions = availableActions;
				}
				this.isMultiple = this.checkedNum > 1;
			}
			const foundEdit = availableActions.filter((wfAction: Record<string, unknown>) => {
				return wfAction.edit === true;
			});
			if (foundEdit.length > 0) {
				const thisUser = assigned.find((u) => {
					return u === this.user?.userName;
				});
				if (thisUser !== undefined) {
					this.listEditEnabled = true;
				}
			}
		}
	}

	checkboxAllClick() {
		this.gridSelectAll == undefined || this.gridSelectAll ? (this.gridSelectAll = false) : (this.gridSelectAll = true);
		for (let data of this.mapsetData) {
			data.checked = this.gridSelectAll;
		}
		this.gridApi.setGridOption('rowData', this.mapsetData);
		this.gridApi.redrawRows();
		this.checkedNum = this.gridSelectAll ? this.mapsetData.length : 0;
		this.checkedStatusActions();
	}

	getModuleLanguageIcon(moduleId: string) {
		let flag = '';
		this.moduleMetadata?.module.forEach((data: any) => {
			if (data.id === moduleId) {
				flag = data.countryCode;
			}
		});
		return flag;
	}

	getModuleLanguageName(moduleId: string) {
		let lang = '';
		this.moduleMetadata.module.forEach((data: any) => {
			if (data.id === moduleId) {
				lang = data.name;
			}
		});
		return lang;
	}

	getValueLength(params: any): number {
		let number = 0;
		const value = params.getValue();
		if (value !== undefined) {
			number = value.number;
		}
		//remove 1 for 'ALWAYS'
		number--;
		return number;
	}

	getValueList(params: any): Array<any> {
		let list = [];
		const value = params.getValue();
		if (value !== undefined) {
			list = value.list;
		}
		return list;
	}

	/*end functions*/

	goToMappingPage(code: any) {
		this.router.navigate(
			[
				this.libraryOnly
					? '/library' + '/mapset/' + this.mapsetCode + '/mapping/' + code
					: '/projects' + '/mapset/' + this.mapsetCode + '/mapping/' + code,
			],
			{
				replaceUrl: false,
				skipLocationChange: false,
			},
		);
	}

	goToMappingsPage() {
		this.router.navigate(['/mapset/' + this.mapsetCode + '/mappings'], { replaceUrl: false, skipLocationChange: false });
		this.router.navigate(
			[this.libraryOnly ? '/library' + '/mapset/' + this.mapsetCode + '/mappings' : '/projects' + '/mapset/' + this.mapsetCode + '/mappings'],
			{
				replaceUrl: false,
				skipLocationChange: false,
			},
		);
	}

	goToBatchMappingsPage(codes: any) {
		this.router.navigate(['/projects/mapset/' + this.mapsetCode + '/mappings/' + codes.join('_') + '/batch'], {
			replaceUrl: false,
			skipLocationChange: false,
		});
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

	onResize(event: any) {}

	updateNotesStatus(event: any) {
		for (let c = 0; c < this.mapsetData.length; c++) {
			if (this.mapsetData[c].code === event.conceptCode) {
				this.mapsetData[c].hasNotes = event.hasNotes;
			}
		}
		this.gridApi.refreshCells(this.gridParams);
		this.gridApi.redrawRows();
	}

	@HostListener('window:scroll', ['$event'])
	onScroll(event: any) {
		//this.closePopover();
	}

	@HostListener('window:beforeunload', ['$event'])
	onBeforeUnload($event: BeforeUnloadEvent) {
		if (localStorage.getItem('unsavedChanges') === 'true') {
			$event.preventDefault(); // Required for modern browsers
			$event.returnValue = ''; // Triggers the native prompt
		}
	}

	ngOnDestroy() {
		this.userChanged = false;
		localStorage.setItem('unsavedChanges', 'false');
	}
}
