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
import { Constants } from 'src/app/utilities/constants.utility';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { PaginationComponent } from 'src/app/components/pagination/pagination.component';
import { Debounce } from 'src/app/decorators/debounce.decorator';
import { User } from 'src/app/models/user';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { NotificationService } from 'src/app/services/notification.service';
import { formatDate } from '@angular/common';
import { PaginationService } from 'src/app/services/pagination.service';
import { FormControl } from '@angular/forms';

@Component({
	standalone: false,
	selector: 'app-mapset-records',
	templateUrl: './mapset-records.component.html',
	styleUrls: ['./mapset-records.component.css'],
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
	workFlowModalRef: NgbModalRef;
	downloadModalRef: NgbModalRef;
	batchListModalRef: NgbModalRef;
	isModalOpen = false;
	mapsetInfo: any = {};
	mapsetVersions: any[] = [];
	mapsetCode: string;
	routeParamsSubscription$: Subscription;
	gridSelectAll = false;
	advicePopoverLocation = '45px';
	showMapTable = 'table';
	checkedNum = 0;
	useDialog = false;
	showMappingsSection = true;
	showMetadataSection = false;
	showHistorySection = false;
	downloadError = '';
	downloading = false;
	selectedFormat = {};
	formats = [];
	selectedType = {};
	types = [];
	selectExportMetadata = false;
	loaded = false;
	showPaging = false;
	datasource: any;
	recordRows = [];
	mapSetSubscription: Subscription;
	isNewPageSize = false;
	internationalId = '449080006';
	mapsetRecordsColumnStorage = 'mapsetRecordsColumnStorage';
	mapsetSearchInput = 'mapsetSearchInput';
	mapsetGridCurrentPageNum = 'mapsetGridCurrentPageNum';
	mapsetGridCurrentPageSize = 'mapsetGridCurrentPageSize';
	moduleMetadata: any;
	rowColors = [{ background: 'white' }, { background: '#f2f2f2' }];
	currentRowColor = 0;
	downloadTitle = 'Download';
	downloadType = 'all';
	workFlowStatus = { label: '', value: '', message: '', notes: '' };
	workFlowNotesFC = new FormControl('');
	batchListFC = new FormControl('');
	showEdit = true;
	editStatus = true;
	// { label: 'Cancel Edit', value: 'CANCEL_EDIT', message: 'Are you sure you want to cancel editing this Map Set?', notes: '' },
	editWF = [
		{ label: 'Edit', value: 'EDIT', message: 'Are you sure you want to edit this Map Set?', notes: '' },
		{ label: 'Finish Edit', value: 'FINISH_EDIT', message: 'Are you sure you want to finish editing this Map Set?', notes: '' },
	];
	showUpgrade = true;
	upgradeStatus = true;
	upgradeWF = [
		{ label: 'Upgrade', value: 'UPGRADE', message: 'Are you sure you want to upgrade this Map Set?', notes: '' },
		{ label: 'Cancel Upgrade', value: 'CANCEL_UPGRADE', message: 'Are you sure you want to cancel upgrading this Map Set?', notes: '' },
		{ label: 'Finish Upgrade', value: 'FINISH_UPGRADE', message: 'Are you sure you want to finish upgrading this Map Set?', notes: '' },
	];
	showReview = true;
	requestStatus = true;
	reviewStatus = false;
	reviewWF = [
		{ label: 'Request Review', value: 'REQUEST_REVIEW', message: 'Are you sure you want to request review of this Map Set?', notes: '' },
		{ label: 'Withdraw Review', value: 'WITHDRAW', message: 'Are you sure you want to withdraw review of this Map Set?', notes: '' },
		{ label: 'Review', value: 'REVIEW', message: 'Are you sure you want to review this Map Set?', notes: '' },
		{ label: 'Reject Review', value: 'REJECT_REVIEW', message: 'Are you sure you want to reject review for this Map Set?', notes: '' },
		{ label: 'Accept Review', value: 'ACCEPT_REVIEW', message: 'Are you sure you want to accept review for this Map Set?', notes: '' },
	];
	showPublish = true;
	publishStatus = true;
	startPublish = false;
	finishPublish = false;
	publishWF = [
		{ label: 'Request Publish', value: 'REQUEST_PUBLICATION', message: 'Are you sure you want to request to publish this Map Set?', notes: '' },
		{
			label: 'Withdraw Request',
			value: 'FAILS_RVF',
			message: 'Are you sure you want to withdraw request to publish this Map Set?',
			notes: '',
		},
		// { label: 'Start Publish', value: 'START_PUBLISH', message: 'Are you sure you want to start publishing of this Map Set?', notes: '' },
		// { label: 'Finish Publish', value: 'PUBLISH_REFSET', message: 'Are you sure you want to finish publishing this Map Set?', notes: '' },
	];

	@Output() loadingSpinner = new EventEmitter<boolean>(true);

	@ViewChild('directoryInfoDialog') infoDialog: TemplateRef<any>;
	@ViewChild('directoryFeedbackDialog') feedbackDialog: TemplateRef<any>;
	@ViewChild('toBeDevelopedModal') tbdModal: TemplateRef<any>;
	@ViewChild('workFlowModal') workflowModal: TemplateRef<any>;
	@ViewChild('batchListModal') batchListModal: TemplateRef<any>;
	@ViewChild('workFlowModalNotes') private workflowModalNotes: ElementRef;
	@ViewChild('batchModalList') private batchModalList: ElementRef;
	@ViewChild('directoryCheckSection') checkSection: TemplateRef<any>;
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
	@ViewChild('actions') private actions: MatSelect;
	@ViewChild('directorySearchInput') private directorySearchInput: ElementRef;
	@ViewChild('gridWrapper') gridWrapper: ElementRef;

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
		private notificationService: NotificationService,
	) {
		document.body.scrollTop = 0;
	}

	//***** Framework Functions *****/
	ngOnInit() {
		this.user = this.authenticationService.getUser();
		this.titleService.setTitle('Mapping Tool - Mappings');
		this.routeParamsSubscription$ = this.route.params.subscribe((routeParams) => {
			this.mapsetCode = routeParams.code;
			this.mapsetRecordsColumnStorage += this.mapsetCode;
			this.mapsetSearchInput += this.mapsetCode;
			this.mapsetGridCurrentPageNum += this.mapsetCode;
			this.mapsetGridCurrentPageSize += this.mapsetCode;
			this.clearSavedSelections();
			this.getMapsetInfo();
			this.getModuleMetadata();
		});

		// if (this.authenticationService.getUser().userName != this.authenticationService.GUEST_USER) {
		// 	this.formats.splice(1, 0, { value: 'rf2_with_names', display: 'RF2 With Names' });
		// }

		// if (this.authenticationService.getUser().userName != this.authenticationService.GUEST_USER) {
		// 	this.formats.splice(-1, 0, { value: 'freeset', display: 'Free Set' });
		// }

		this.disableChannel.postMessage(false);

		if (localStorage.getItem('showMapTable')) {
			this.changeMappingsView(JSON.parse(localStorage.getItem('showMapTable')));
		}
	}

	private clearSavedSelections(): void {
		const keysToRemove: string[] = [];

		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);

			if (key?.startsWith('batchSearchInput')) {
				keysToRemove.push(key);
			}
		}

		keysToRemove.forEach((key) => localStorage.removeItem(key));
	}

	getMapsetInfo() {
		this.refsetService.getMapsetByCode(this.mapsetCode).subscribe((results) => {
			// results is now an array of MapSet versions (PUBLISHED + IN_DEVELOPMENT)
			this.mapsetVersions = Array.isArray(results) ? results : [results];

			this.updateVersionDropdown();

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
					cellClass: 'rt2-directory-column-advices',
					minWidth: 65,
					width: 125,
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
					width: 165,
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
							inactivatedRow = params.data.active == false;
						}

						return inactivatedRow;
					},
				},
			};
			this.showTable = true;
		});
	}

	private updateVersionDropdown(): void {
		if (!this.mapsetVersions || this.mapsetVersions.length === 0) {
			this.mapsetInfo = {};
			this.versionStatuses = [];
			this.selectedVersion = undefined;
			return;
		}

		const getIsInDevelopment = (status: string): boolean => {
			return status === 'IN_DEVELOPMENT' || status === 'IN DEVELOPMENT';
		};

		this.mapsetVersions.sort((a, b) => {
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

		this.mapsetInfo = this.mapsetVersions[0];

		this.versionStatuses = this.mapsetVersions.map((v) => {
			const versionDate = v.versionDate || new Date();
			return formatDate(versionDate, 'MM-dd-yyyy', 'en-US', 'UTC') + ' (' + v.versionStatus + ') ';
		});
		if (localStorage.getItem('mapsetVersion')) {
			this.selectedVersion = JSON.parse(localStorage.getItem('mapsetVersion'));
			this.mapsetInfo = this.mapsetVersions.filter((v) => {
				const versionDate = v.versionDate || new Date();
				const mapsetVersionStatus = formatDate(versionDate, 'MM-dd-yyyy', 'en-US', 'UTC') + ' (' + v.versionStatus + ') ';
				return mapsetVersionStatus === this.selectedVersion;
			});
			this.mapsetInfo = this.mapsetInfo[0];
		} else {
			if (this.versionStatuses.length > 0) {
				this.selectedVersion = this.versionStatuses[0];
			}
		}
		this.setMapsetInfo();
	}

	setMapsetInfo() {
		localStorage.setItem('mapsetVersion', JSON.stringify(this.selectedVersion));
		this.breadcrumbService.setBreadcrumbs([{ path: '/library', label: 'Library' }, { label: this.mapsetInfo.refSetName }]);

		switch (this.mapsetInfo.workflowStatus) {
			case 'READY_FOR_EDIT':
				this.editStatus = true;
				this.showReview = true;
				this.showUpgrade = true;
				this.showPublish = true;
				break;
			case 'IN_EDIT':
				this.editStatus = false;
				this.showReview = false;
				this.showUpgrade = false;
				this.showPublish = false;

				// if (this.refsetData.roles.includes('ADMIN') && !this.refsetData.roles.includes('AUTHOR')) {
				// 	this.adminOverride = true;
				// 	this.adminOverrideText = 'Admin ';
				// }
				break;
			case 'READY_FOR_REVIEW':
				this.requestStatus = false;
				this.reviewStatus = false;
				this.showEdit = false;
				this.showUpgrade = false;
				this.showPublish = false;
				break;
			case 'IN_REVIEW':
				this.requestStatus = false;
				this.reviewStatus = true;
				this.showEdit = false;
				this.showUpgrade = false;
				this.showPublish = false;

				// if (this.refsetData.roles.includes('ADMIN') && !this.refsetData.roles.includes('REVIEWER')) {
				// 	this.adminOverride = true;
				// 	this.adminOverrideText = 'Admin ';
				// }
				break;
			case 'REVIEW_COMPLETED':
				this.editStatus = true;
				this.showReview = true;
				this.showUpgrade = false;
				this.showPublish = true;
				break;
			case 'READY_FOR_PUBLICATION':
				this.publishStatus = false;
				this.startPublish = true;
				this.finishPublish = false;
				this.showReview = false;
				this.showEdit = false;
				this.showUpgrade = false;
				break;
			case 'IN_UPGRADE':
				this.upgradeStatus = false;
				this.showReview = false;
				this.showEdit = false;
				this.showPublish = false;
				break;
			case 'IN_PUBLICATION':
				this.publishStatus = false;
				this.startPublish = false;
				this.finishPublish = true;
				this.showReview = false;
				this.showEdit = false;
				this.showUpgrade = false;
				break;
			case 'PUBLISHED':
				this.showEdit = false;
				const inDevelopmentFound = this.mapsetVersions.find((mapset) => {
					return mapset.versionStatus === 'IN_DEVELOPMENT' || mapset.versionStatus === 'IN DEVELOPMENT';
				});
				if (!inDevelopmentFound) {
					if (this.mapsetInfo?.latestPublishedVersion === true) {
						this.showEdit = true;
					}
				}
				this.showReview = false;
				this.showUpgrade = false;
				this.showPublish = false;
				break;
			default: //null
				this.editStatus = true;
				this.showReview = true;
				this.showUpgrade = true;
				this.showPublish = true;
				if (this.mapsetInfo.versionStatus === 'PUBLISHED') {
					this.showEdit = false;
					this.showReview = false;
					this.showUpgrade = false;
					this.showPublish = false;
				}
				break;
		}
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
		this.showMapTable = value;
		localStorage.setItem('showMapTable', JSON.stringify(this.showMapTable));
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
		if (gridReadyParams?.api && gridReadyParams.type === 'gridReady') {
			this.refsetGridApi = gridReadyParams.api;
		}
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
				let query = '';
				this.refsetGridApi.showLoadingOverlay();

				const storedSearchInput = localStorage.getItem(this.mapsetSearchInput);
				if (storedSearchInput) {
					this.searchInput = JSON.parse(storedSearchInput);
				}

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
						const storedPageSize = localStorage.getItem(this.mapsetGridCurrentPageSize);
						this.refsetGridPaging.pageSize = storedPageSize ? Number(JSON.parse(storedPageSize)) : 10;
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
					this.mapSetSubscription = this.refsetService.getMappingsByMapset(this.mapsetInfo.id, restParams).subscribe({
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
										index: results[a].code !== '' ? a + results[a].code + count : count,
										spanned: spanned,
										downloadable: true,
										mapEntries: results[a].mapEntries,
										descriptions: results[a].descriptions,
										entries: results[a].mapEntries.length,
										code: results[a].code,
										name: results[a].name,
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
										advices: { number: adviceArray.length, list: adviceArray },
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

							setTimeout(() => {
								const lastIndexH = document.getElementsByClassName('ag-header').length - 1;
								const childH = document.getElementsByClassName('ag-header')[lastIndexH];
								document.getElementById('directoryHeader').appendChild(childH);
								const lastIndexP = document.getElementsByClassName('ag-paging-panel').length - 1;
								const childP = document.getElementsByClassName('ag-paging-panel')[lastIndexP];
								document.getElementById('directoryPaging').appendChild(childP);
							}, 400);

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

							this.checkStored();
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

	unCheckAll() {
		this.mapsetData.forEach((map) => {
			if (map.checked) {
				map.checked = false;
			}
		});
		this.checkedNum = 0;
		this.refsetGridApi.redrawRows();
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
		setTimeout(() => {
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
		this.mapsetInfo = this.mapsetVersions.filter((v) => {
			const versionDate = v.versionDate || new Date();
			const mapsetVersionStatus = formatDate(versionDate, 'MM-dd-yyyy', 'en-US', 'UTC') + ' (' + v.versionStatus + ') ';
			return mapsetVersionStatus === this.selectedVersion;
		});
		this.mapsetInfo = this.mapsetInfo[0];
		this.setPageSize(10);
		this.goToPage(0);
		this.loaded = false;
		this.refsetGridApi.purgeInfiniteCache();
		this.setMapsetInfo();
	}

	selectAction(selectedAction: string) {
		switch (selectedAction) {
			case 'batch':
				if (this.checkedNum > 1) {
					const codes = [];
					for (let c = 0; c < this.mapsetData.length; c++) {
						if (this.mapsetData[c].checked === true) {
							codes.push(this.mapsetData[c].code);
						}
					}
					if (codes.length > 0) {
						setTimeout(() => {
							this.goToBatchMappingsPage(codes);
						}, 2);
					}
				}
				break;
			case 'list':
				this.openBatchListModal(this.batchListModal);
				break;
			case 'select':
				window['checkbox-table-all'].click();
				break;
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
			case 'edit':
				if (this.checkedNum === 1) {
					for (let c = 0; c < this.mapsetData.length; c++) {
						if (this.mapsetData[c].checked === true) {
							setTimeout(() => {
								this.goToEditMappingPage(this.mapsetData[c].code);
							}, 2);
						}
					}
				}
				break;
			case 'selected':
				this.downloadType = 'selected';
				this.downloadMapsets();
				break;
			case 'all':
				this.downloadType = 'all';
				this.downloadMapsets();
				break;
		}
	}

	openBatchListModal(content) {
		this.batchListFC.setValue('');
		this.batchListFC.reset();
		this.batchListModalRef = this.modalService.open(content, { centered: true });
		this.isModalOpen = true;
		setTimeout(() => {
			this.batchModalList.nativeElement.focus();
		}, 50);
	}

	submitBatchList() {
		let listOfIds = undefined;
		if (this.batchListFC.dirty) {
			listOfIds = this.batchListFC.value;
		}
		if (!listOfIds?.length) {
			return;
		}
		const commaRegex = /,+/gi;
		/* eslint-disable no-useless-escape */
		const allIdsString = listOfIds
			?.replaceAll(' ', ',')
			.replaceAll('\n', ',')
			.replaceAll(commaRegex, ',')
			.replaceAll(/[^,\-\_a-zA-Z0-9]/g, '')
			.trim();

		this.goToBatchMappingsPage(allIdsString.split(','));
		this.closeBatchListModal();
	}

	closeBatchListModal() {
		this.batchListModalRef.close();
		this.isModalOpen = false;
	}

	clearSearch() {
		this.loaded = false;
		if (this.searchInput) {
			this.searchInput = '';
			this.onSearchChange();
		}
	}

	@Debounce(600)
	onSearchChange() {
		this.searchInput = this.searchInput.trim();
		if (!CodeUtility.hasValue(this.searchInput) || (CodeUtility.hasValue(this.searchInput) && this.searchInput.length > 2)) {
			this.setPageSize(10);
			this.goToPage(0);
			this.loaded = false;
			this.refsetGridApi.purgeInfiniteCache();
			localStorage.setItem(this.mapsetSearchInput, JSON.stringify(this.searchInput));
		}
	}

	/*Pagination functions */
	onPaginationChanged(event: PaginationChangedEvent) {
		if (this.refsetGridApi) {
			this.isNewPageSize = this.refsetGridPaging.pageSize !== this.refsetGridApi.paginationGetPageSize();
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
		localStorage.setItem(this.mapsetGridCurrentPageSize, JSON.stringify(size));
		this.refsetGridApi.paginationGoToFirstPage();
		this.refsetGridApi.setGridOption('paginationPageSize', size);
	}

	goToPage(number: number) {
		if (this.showMapTable === 'table') {
			this.gridWrapper.nativeElement.scrollTo(0, 0);
		}
		localStorage.setItem(this.mapsetGridCurrentPageNum, JSON.stringify(number));
		this.refsetGridApi.paginationGoToPage(number);
	}

	checkStored() {
		if (this.mapsetGridCurrentPageSize !== undefined && this.mapsetGridCurrentPageNum !== undefined) {
			if (localStorage.getItem(this.mapsetGridCurrentPageSize) !== null) {
				this.refsetGridApi.setGridOption('paginationPageSize', Number(JSON.parse(localStorage.getItem(this.mapsetGridCurrentPageSize))));
			}
			setTimeout(() => {
				if (localStorage.getItem(this.mapsetGridCurrentPageNum) !== null) {
					this.goToPage(JSON.parse(localStorage.getItem(this.mapsetGridCurrentPageNum)));
				}
			}, 5);
		} else {
			if (this.mapsetGridCurrentPageSize !== undefined) {
				if (localStorage.getItem(this.mapsetGridCurrentPageSize) !== null) {
					this.setPageSize(Number(JSON.parse(localStorage.getItem(this.mapsetGridCurrentPageSize))));
				}
			}
			if (this.mapsetGridCurrentPageNum !== undefined) {
				if (localStorage.getItem(this.mapsetGridCurrentPageNum) !== null) {
					this.goToPage(JSON.parse(localStorage.getItem(this.mapsetGridCurrentPageNum)));
				}
			}
		}
	}

	//*** workflow functions ***/
	editWorkflow(status) {
		switch (status) {
			case this.editWF[0].value: //EDIT
				this.workFlowStatus = this.editWF[0];
				this.openWorkFlowModal(this.workflowModal);
				break;
			// case this.editWF[1].value: //CANCEL_EDIT
			// 	this.workFlowStatus = this.editWF[1];
			// 	this.openWorkFlowModal(this.workflowModal);
			// 	break;
			case this.editWF[1].value: //FINISH_EDIT
				this.workFlowStatus = this.editWF[1];
				this.openWorkFlowModal(this.workflowModal);
				break;
		}
	}

	upgradeWorkflow(status) {
		switch (status) {
			case this.upgradeWF[0].value: //UPGRADE
				this.workFlowStatus = this.upgradeWF[0];
				this.openWorkFlowModal(this.workflowModal);
				break;
			case this.upgradeWF[1].value: //CANCEL_UPGRADE
				this.workFlowStatus = this.upgradeWF[1];
				this.openWorkFlowModal(this.workflowModal);
				break;
			case this.upgradeWF[2].value: //FINISH_UPGRADE
				this.workFlowStatus = this.upgradeWF[2];
				this.openWorkFlowModal(this.workflowModal);
				break;
		}
	}

	reviewWorkflow(status) {
		switch (status) {
			case this.reviewWF[0].value: //REQUEST_REVIEW
				this.workFlowStatus = this.reviewWF[0];
				this.openWorkFlowModal(this.workflowModal);
				break;
			case this.reviewWF[1].value: //WITHDRAW
				this.workFlowStatus = this.reviewWF[1];
				this.openWorkFlowModal(this.workflowModal);
				break;
			case this.reviewWF[2].value: //REVIEW
				this.workFlowStatus = this.reviewWF[2];
				this.openWorkFlowModal(this.workflowModal);
				// this.openToBeDevelopedModal(this.tbdModal);
				break;
			case this.reviewWF[3].value: //REJECT_REVIEW
				this.workFlowStatus = this.reviewWF[3];
				this.openWorkFlowModal(this.workflowModal);
				break;
			case this.reviewWF[4].value: //ACCEPT_REVIEW
				this.workFlowStatus = this.reviewWF[4];
				this.openWorkFlowModal(this.workflowModal);
				break;
		}
	}

	publishWorkflow(status) {
		switch (status) {
			case this.publishWF[0].value: //REQUEST_PUBLICATION
				this.workFlowStatus = this.publishWF[0];
				this.openWorkFlowModal(this.workflowModal);
				break;
			case this.publishWF[1].value: //FAILS_RVF
				this.workFlowStatus = this.publishWF[1];
				this.openWorkFlowModal(this.workflowModal);
				break;
			case this.publishWF[2].value: //START_PUBLISH
				this.workFlowStatus = this.publishWF[2];
				this.openWorkFlowModal(this.workflowModal);
				break;
			case this.publishWF[3].value: //PUBLISH_REFSET
				this.workFlowStatus = this.publishWF[3];
				this.openWorkFlowModal(this.workflowModal);
				break;
		}
	}

	openWorkFlowModal(content) {
		this.workFlowModalRef = this.modalService.open(content, { centered: true });
		this.isModalOpen = true;
		setTimeout(() => {
			this.workflowModalNotes.nativeElement.focus();
		}, 50);
	}

	closeWorkFlowModal() {
		this.workFlowModalRef.close();
		this.isModalOpen = false;
		this.workFlowStatus = { label: '', value: '', message: '', notes: '' };
		this.workFlowNotesFC.setValue('');
		this.workFlowNotesFC.reset();
	}

	changeWorkFlowStatus() {
		if (this.workFlowNotesFC.dirty) {
			this.workFlowStatus.notes = this.workFlowNotesFC.value;
		}
		this.refsetService.setMapsetWorkflowStatus(this.mapsetInfo.id, this.workFlowStatus.value, this.workFlowStatus.notes).subscribe((response) => {
			if (response) {
				this.mapsetInfo = response;
				this.setWorkflowStatus();
				this.getMapsetInfo();
			}
		});
	}

	setWorkflowStatus() {
		switch (this.workFlowStatus.value) {
			case 'EDIT':
				this.editStatus = false;
				this.showReview = false;
				this.showUpgrade = false;
				this.showPublish = false;
				break;
			case 'FINISH_EDIT':
				this.editStatus = true;
				this.showReview = true;
				this.showUpgrade = true;
				this.showPublish = true;
				break;
			case 'UPGRADE':
				this.upgradeStatus = false;
				this.showReview = false;
				this.showEdit = false;
				this.showPublish = false;
				break;
			case 'CANCEL_UPGRADE':
				this.upgradeStatus = true;
				this.showReview = true;
				this.showEdit = true;
				this.showPublish = true;
				break;
			case 'FINISH_UPGRADE':
				this.upgradeStatus = true;
				this.showReview = true;
				this.showEdit = true;
				this.showPublish = true;
				break;
			case 'REQUEST_REVIEW':
				this.reviewStatus = false;
				this.requestStatus = false;
				this.showEdit = false;
				this.showUpgrade = false;
				this.showPublish = false;
				break;
			case 'WITHDRAW':
				this.requestStatus = true;
				this.reviewStatus = false;
				this.showEdit = true;
				this.showUpgrade = true;
				this.showPublish = true;
				break;
			case 'REVIEW':
				this.reviewStatus = true;
				this.requestStatus = false;
				this.showEdit = false;
				this.showUpgrade = false;
				this.showPublish = false;
				break;
			case 'REJECT_REVIEW':
				this.requestStatus = true;
				this.reviewStatus = false;
				this.showEdit = true;
				this.showUpgrade = true;
				this.showPublish = true;
				break;
			case 'ACCEPT_REVIEW':
				this.requestStatus = true;
				this.reviewStatus = false;
				this.showEdit = true;
				this.showUpgrade = false;
				this.showPublish = true;
				break;
			case 'REQUEST_PUBLICATION':
				this.publishStatus = false;
				this.startPublish = true;
				this.finishPublish = false;
				this.showReview = false;
				this.showUpgrade = false;
				this.showEdit = false;
				break;
			case 'FAILS_RVF':
				this.publishStatus = true;
				this.startPublish = false;
				this.finishPublish = false;
				this.showEdit = true;
				this.showReview = true;
				this.showUpgrade = true;
				this.showPublish = true;
				break;
			case 'START_PUBLISH':
				this.publishStatus = false;
				this.startPublish = false;
				this.finishPublish = true;
				this.showReview = false;
				this.showUpgrade = false;
				this.showEdit = false;
				break;
			case 'PUBLISH_REFSET':
				this.publishStatus = true;
				this.startPublish = false;
				this.finishPublish = false;
				this.showEdit = false;
				const inDevelopmentFound = this.mapsetVersions.find((mapset) => {
					return mapset.versionStatus === 'IN_DEVELOPMENT' || mapset.versionStatus === 'IN DEVELOPMENT';
				});
				if (!inDevelopmentFound) {
					if (this.mapsetInfo?.latestPublishedVersion === true) {
						this.showEdit = true;
					}
				}
				this.showReview = false;
				this.showUpgrade = false;
				this.showPublish = false;
				break;
		}
		this.closeWorkFlowModal();
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

	downloadMapsets() {
		//default All
		this.downloadTitle = 'Download ' + this.mapsetInfo.refSetName + ' ' + this.selectedVersion;
		this.types = [
			{ value: 'SNAPSHOT', display: 'SNAPSHOT' },
			{ value: 'DELTA', display: 'DELTA' },
		];

		this.formats = [
			{ value: 'RF2', display: 'RF2' },
			{ value: 'RF2_WITH_NAMES', display: 'RF2 With Names' },
			{ value: 'SCTIDS', display: 'List Of SCTIDs' },
		];
		if (this.downloadType === 'selected') {
			const selected = [];
			for (let c = 0; c < this.mapsetData.length; c++) {
				if (this.mapsetData[c].checked === true) {
					selected.push(
						this.mapsetData[c].code +
							' ' +
							this.mapsetData[c].name +
							' to ' +
							this.mapsetData[c].toCode?.split('#')[1] +
							' ' +
							this.mapsetData[c].toName,
					);
				}
			}
			if (selected.length > 0 && selected.length < 3) {
				this.downloadTitle = 'Download ' + selected.join(', ') + '.';
			} else {
				if (selected.length > 2) {
					this.downloadTitle = 'Download ' + selected.splice(0, 2).join(', ') + '... and ' + selected.length + ' more selected map sets.';
				}
			}
			this.formats = [{ value: 'tab', display: 'Tab-Delimited Text File' }];
		}
		this.openDownloadModal(this.downloadModal);
	}

	startDownload() {
		this.downloadError = '';
		if (this.downloadType === 'selected') {
			if (this.selectedFormat['value'] !== undefined) {
				this.downloading = true;
				const selected = [];
				for (let c = 0; c < this.mapsetData.length; c++) {
					if (this.mapsetData[c].checked === true) {
						selected.push(this.mapsetData[c].code);
					}
				}
				const cols = [];
				const colDefs = this.refsetGridApi.getColumnDefs();
				for (let d = 0; d < colDefs.length; d++) {
					if (colDefs[d].headerName !== undefined) {
						cols.push(colDefs[d].headerName);
					}
				}
				const params = {
					conceptCodes: selected,
					columnNames: cols,
				};

				this.refsetService.exportMapsetByCode(this.mapsetInfo.refSetCode, params).subscribe(
					(data) => {
						this.uiUtility.createMapsetReport(this.mapsetInfo.refSetCode, data);
						this.downloading = false;
						this.unCheckAll();
						this.closeDownloadModal();
					},
					(err) => {
						console.error(err);
					},
				);
			} else {
				this.downloadError = 'Please select a download format.';
			}
		} else {
			if (this.selectedFormat['value'] !== undefined && this.selectedType['value'] !== undefined) {
				this.downloading = true;
				const params = {
					branch: this.mapsetInfo.branchPath,
					mapSetCode: this.mapsetInfo.refSetCode,
					fileFormatType: this.selectedType['value'],
					fileExportType: this.selectedFormat['value'],
					fileNameDate: CodeUtility.getCurrentDate().split('-').join(''),
					languageId: this.mapsetInfo.moduleId,
					startEffectiveTime: this.mapsetInfo.version.replaceAll('-', ''),
					transientEffectiveTime: this.mapsetInfo.version.replaceAll('-', ''),
					exportMetadata: this.selectExportMetadata,
				};

				this.refsetService.exportMapset(params).subscribe(
					(data) => {
						this.getMapsetDownloadStatus(data.url);
					},
					(err) => {
						this.downloading = false;
						console.error(err);
					},
				);
			} else {
				this.downloadError = 'Please select a download type and format.';
			}
		}
	}

	getMapsetDownloadStatus(url: string) {
		this.refsetService.getDownloadMapsetStatus(url).subscribe(
			(data) => {
				const a = document.createElement('a');
				switch (data.status) {
					case 'FAILED':
						this.downloading = false;
						this.notificationService.show('Failed to download Mapset.', 'Error', 'error', { timeOut: 3000, extendedTimeOut: 0 });
						this.closeDownloadModal();
						break;
					case 'COMPLETED':
						a.href = this.refsetService.contextPath + data.result;
						a.download = url.split('/').pop();
						document.body.appendChild(a);
						a.click();
						document.body.removeChild(a);
						this.downloading = false;
						this.closeDownloadModal();
						break;
					default:
						setTimeout(() => {
							this.getMapsetDownloadStatus(url);
						}, 200);
				}
			},
			(err) => {
				this.downloading = false;
				console.error(err);
			},
		);
	}

	openDownloadModal(content) {
		this.downloadModalRef = this.modalService.open(content, { centered: true });
		this.isModalOpen = true;
	}

	closeDownloadModal() {
		this.downloadError = '';
		this.selectedFormat = {};
		this.selectedType = {};
		this.selectExportMetadata = false;
		this.downloadModalRef.close();
		this.isModalOpen = false;
	}

	goToMapsInactivesPage(code) {
		this.router.navigate(['/mapset/' + code + '/mappings/inactives'], { replaceUrl: false, skipLocationChange: false });
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

			document.getElementsByClassName('grid-wrapper')[0]?.setAttribute('style', `max-height: ${sectionsMaxHeight}px;`);
		}
		if (this.showMetadataSection) {
			document.getElementsByClassName('metadata-section')[0]?.setAttribute('style', `max-height: ${sectionsMinHeight}px;`);
		}
		if (this.showHistorySection) {
			document.getElementsByClassName('history-section')[0]?.setAttribute('style', `max-height: ${sectionsMinHeight}px;`);
		}
	}
}
