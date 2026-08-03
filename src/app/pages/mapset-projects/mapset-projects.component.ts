import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output, ElementRef, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
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
import { NotificationService } from 'src/app/services/notification.service';
import { PaginationService } from 'src/app/services/pagination.service';

@Component({
	standalone: false,
	selector: 'app-mapset-projects',
	templateUrl: './mapset-projects.component.html',
	styleUrls: ['./mapset-projects.component.css'],
})
export class MapsetProjectsComponent implements OnInit {
	user!: User;
	searchInput = '';
	viewOptions = [
		{ value: 'all', display: 'All' },
		{ value: 'public', display: 'Public' },
		{ value: 'private', display: 'Private' },
	];
	selectedView = 'all';
	refsetGridApi: any;
	columnDefs: any;
	refsetGridColumns = [
		{ name: 'information', show: true },
		{ name: 'refsetId', show: true },
	];
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
	refsetData: any;
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
	directUrl: string | undefined;
	numOfMembers: any;
	mapsetLibraryColumnStorage = 'mapsetLibraryColumnStorage';
	disableChannel = new BroadcastChannel('disable-button-channel');
	originalGridParams: any;
	uiUtility = UiUtility;
	showLoadingSearch = true;
	toBeDevelopedModalRef!: NgbModalRef;
	downloadModalRef!: NgbModalRef;
	mapsetInfoModalRef!: NgbModalRef;
	isModalOpen = false;
	showPaging = false;
	paginationPages: any = {};
	private isNewPageSize = false;
	downloadError = '';
	downloading = false;
	selectedFormat = {};
	formats = [];
	selectedType = {};
	types = [];
	internationalId = '449080006';
	moduleMetadata: any;
	selectExportMetadata = false;
	downloadTitle = 'Download';
	mapsetInfo: any = {};
	selectedVersion: any;

	@Output() loadingSpinner = new EventEmitter<boolean>(true);

	@ViewChild('workflowStatusSection') workflowStatus!: TemplateRef<any>;
	@ViewChild('directoryInfoDialog') infoDialog!: TemplateRef<any>;
	@ViewChild('directoryFeedbackDialog') feedbackDialog!: TemplateRef<any>;
	@ViewChild('directoryInfoSection') infoSection!: TemplateRef<any>;
	@ViewChild('directoryVersionDate') versionDate!: TemplateRef<any>;
	@ViewChild('directoryNameSection') nameSection!: TemplateRef<any>;
	@ViewChild('directoryActionSection') actionSection!: TemplateRef<any>;
	@ViewChild('directoryPaging') paginationComponent!: PaginationComponent;
	@ViewChild('directoryCategoryFilter') categoryFilter!: TemplateRef<any>;
	@ViewChild('directoryWorkflowStatusSection') versionStatus!: TemplateRef<any>;
	@ViewChild('directorySearchInput') private directorySearchInput!: ElementRef;
	@ViewChild('downloadModal') downloadModal!: TemplateRef<any>;

	constructor(
		private router: Router,
		private titleService: Title,
		private dialogFactoryService: DialogFactoryService,
		private refsetService: RefsetService,
		private changeDetectorRef: ChangeDetectorRef,
		private breadcrumbService: BreadcrumbService,
		private authenticationService: AuthenticationService,
		private modalService: NgbModal,
		private pagerService: PaginationService,
		private mt2Service: MT2Service,
		private notificationService: NotificationService,
	) {
		document.body.scrollTop = 0;
		refsetService.getTaxonomyRoot();
	}

	//***** Framework Functions *****/
	ngOnInit() {
		this.user = this.authenticationService.getUser();
		this.titleService.setTitle('Mapping Tool - Map Set Projects');
		this.breadcrumbService.setBreadcrumbs([{ label: 'Map Set Projects' }]);
		this.clearSavedSelections();
		this.getMapsetData();
		this.getModuleMetadata();
		this.disableChannel.postMessage(false);
	}

	private clearSavedSelections(): void {
		const keysToRemove: string[] = [];

		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);

			if (
				key?.startsWith('projects_mapsetSearchInput') ||
				key?.startsWith('projects_showMapTable') ||
				key?.startsWith('projects_mapsetVersion') ||
				key?.startsWith('projects_mapsetGridCurrentPageSize') ||
				key?.startsWith('projects_mapsetGridCurrentPageNum') ||
				key?.startsWith('projects_batchSearchInput')
			) {
				keysToRemove.push(key);
			}
		}

		keysToRemove.forEach((key) => localStorage.removeItem(key));
	}

	getMapsetData() {
		this.refsetService.getMapsetsByStatus('IN DEVELOPMENT').subscribe({
			next: ([results]) => {
				this.versionStatuses;
				let versionStatusArray;
				this.columnDefs = [
					// This is an exception to resizeable field because it is an info icon field
					{
						field: 'id',
						colId: 'information',
						headerName: '',
						minWidth: 50,
						width: 70,
						cellClass: 'rt2-directory-column-information',
						cellRenderer: TemplateRendererComponent,
						cellRendererParams: { template: this.infoSection },
						filter: false,
						resizable: false,
						sortable: false,
						getQuickFilterText: (params: any) => {
							return '';
						},
					},
					{
						field: 'refSetCode',
						tooltipField: 'refSetCode',
						headerName: 'Map Set ID',
						cellClass: 'rt2-directory-column-id',
						minWidth: 65,
						resizable: true,
						unSortIcon: true,
					},
					{
						field: 'refSetName',
						tooltipField: 'refSetName',
						headerName: 'Map Set Name',
						cellClass: 'rt2-directory-column-name',
						flex: 2,
						resizable: true,
						minWidth: 65,
						sort: 'asc',
						unSortIcon: true,
					},
					{
						field: 'versionStatus',
						tooltipField: 'versionStatus',
						headerName: 'Version Status',
						cellClass: 'rt2-directory-column-version-status',
						minWidth: 165,
						width: 200,
						resizable: true,
						cellRenderer: TemplateRendererComponent,
						cellRendererParams: { template: this.workflowStatus },
						unSortIcon: true,
					},
					{
						field: 'version',
						tooltipValueGetter: UiUtility.gridDateValueGetter,
						headerName: 'Version Date',
						cellClass: 'rt2-directory-column-version-date',
						minWidth: 65,
						width: 170,
						resizable: true,
						valueGetter: UiUtility.gridDateValueGetter,
						floatingFilterComponent: DateTextFilterComponent,
						floatingFilterComponentParams: { suppressFilterButton: true },
						unSortIcon: true,
						filter: false,
					},
					{
						field: 'modified',
						tooltipValueGetter: UiUtility.gridDateValueGetter,
						headerName: 'Last Modified',
						cellClass: 'rt2-directory-column-modified-date',
						minWidth: 65,
						width: 170,
						resizable: true,
						valueGetter: UiUtility.gridDateValueGetter,
						floatingFilterComponent: DateTextFilterComponent,
						floatingFilterComponentParams: { suppressFilterButton: true },
						unSortIcon: true,
					},
					// This is an exception to a resizeable field because it is an action field
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
						getQuickFilterText: (params: any) => {
							return '';
						},
					},
				];
				this.refsetGridOptions = {
					context: { componentParent: this },
					pagination: true,
					animateRows: false,
					rowModelType: 'clientSide',
					suppressColumnVirtualisation: true, // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
					suppressPaginationPanel: true,
					paginationPageSize: this.refsetGridPaging.pageSize,
					rowSelection: 'single',
					enableCellTextSelection: true,
					onCellDoubleClicked: this.onGridCellClick,
					onGridReady: this.onGridReady,
					frameworkComponents: {
						templateRenderer: TemplateRendererComponent,
						categoryFilterComponent: CategoryFilterComponent,
						dateTextFilterComponent: DateTextFilterComponent,
					},
					defaultColDef: {
						sortable: true,
						filter: false,
						sortingOrder: ['asc', 'desc'],
						floatingFilter: false,
						floatingFilterComponentParams: { placeholder: '', suppressFilterButton: false },
						suppressMenu: true,
						resizable: true,
					},
					enableBrowserTooltips: true,
					rowClassRules: {
						refset_tool_grid_inactive_row: function (params: any) {
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
			},
			error: (error) => {
				//
			},
		});
	}

	showDropdown(): void {
		this.toggleDropdown = !this.toggleDropdown;
	}

	menuOpened() {
		this.directorySearchInput.nativeElement.focus();
	}

	//***** AG Grid Functions *****/
	onGridReady = (gridReadyParams: any) => {
		this.originalGridParams = gridReadyParams;
		this.refsetGridApi = gridReadyParams.api;
		this.refsetGridApi.setFilterModel(null);
		this.onResize(undefined);

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

		this.refsetService.getMapsetsByStatus('IN DEVELOPMENT').subscribe({
			next: (results) => {
				this.showLoadingSearch = false;

				const data = results;

				this.refsetData = data;
				this.numOfMembers = results.length;
				this.numOfResults = results.total;

				const lastIndex = document.getElementsByClassName('ag-header').length - 1;
				const child = document.getElementsByClassName('ag-header')[lastIndex];
				document.getElementById('directoryHeader').appendChild(child);

				if (results.length == 0) {
					this.refsetGridPaging.totalKnown = true;
					this.refsetGridApi.showNoRowsOverlay();
					this.refsetGridApi.setGridOption('rowData', []);

					if (pageNumber > 1) {
						this.refsetGridPaging.totalRows = this.refsetGridApi.paginationGetPageSize() * (pageNumber - 1);
						this.refsetGridPaging.totalKnown = true;
						this.paginationComponent.goToPage(pageNumber - 1);
					}
					this.showPaging = false;
					return;
				} else {
					this.showPaging = true;
				}
				const storedInput = localStorage.getItem('projectsSearchInput');
				if (storedInput) {
					this.searchInput = JSON.parse(storedInput);
					this.refsetGridApi.setGridOption('quickFilterText', this.searchInput);
				}

				UiUtility.applyServerPagedGridResults(results, this.refsetGridApi, this.refsetGridPaging, pageNumber, null, false);
			},
			error: (error) => {
				this.refsetGridApi.showNoRowsOverlay();
				this.refsetGridApi.setGridOption('rowData', []);
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

	getCurrentPage() {
		let current = 1;
		if (this.refsetGridApi) {
			current = this.refsetGridApi.paginationGetCurrentPage();
		}
		return current;
	}

	editionValueGetter = function (params: any) {
		if (!CodeUtility.hasValue(params?.data)) {
			return '';
		}

		params.data.flagIcon = RefsetUtility.getEditionFlagIcon(params?.data?.edition?.branch);
		return params?.data?.edition?.name;
	};

	versionStatusValueGetter = function (params: any) {
		if (!CodeUtility.hasValue(params?.data)) {
			return '';
		}

		return params.data.versionStatus.toLowerCase();
	};

	onGridCellClick = (event: any) => {
		if (event.column.colId === 'information' || event.column.colId === 'actions') {
			//
		} else {
			const selectedRows = this.refsetGridApi.getSelectedRows();
			let selectedId: string;
			let selectedVersionDate: string;
			let selectedCode: string;

			selectedRows.forEach(function (selectedRow, index) {
				selectedId = selectedRow.refsetId;
				selectedCode = selectedRow.refSetCode;
				selectedVersionDate = RefsetUtility.getVersionDateForRefsetApiCall(selectedRow);
			});

			//this.goToDetailsPage(selectedId, selectedVersionDate);
			this.goToMapRecordsPage(selectedCode);
		}
	};

	@Debounce()
	changedViewFilter() {
		this.showLoadingSearch = true;
		this.onGridReady(this.originalGridParams);
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
			this.refsetGridApi.setGridOption('quickFilterText', this.searchInput);
			localStorage.setItem('projectsSearchInput', JSON.stringify(this.searchInput));
		}
	}

	//***** General Functions *****/

	openEclBuilder(fieldId: any) {
		UiUtility.openEclBuilder(fieldId, 'MAIN');
	}

	downloadMapsets(params) {
		this.mapsetInfo = params.data;
		this.downloadTitle = 'Download ' + this.mapsetInfo.refSetCode + ' ' + this.mapsetInfo.refSetName;
		this.types = [
			{ value: 'SNAPSHOT', display: 'SNAPSHOT' },
			{ value: 'DELTA', display: 'DELTA' },
		];
		this.formats = [
			{ value: 'RF2', display: 'RF2' },
			{ value: 'RF2_WITH_NAMES', display: 'RF2 With Names' },
			{ value: 'SCTIDS', display: 'List Of SCTIDs' },
		];
		this.openDownloadModal(this.downloadModal);
	}

	startDownload() {
		this.downloadError = '';
		if (this.selectedFormat['value'] !== undefined && this.selectedType['value'] !== undefined) {
			this.downloading = true;
			this.refsetService.getMapsetsByCode(this.mapsetInfo.refSetCode).subscribe((results) => {
				this.mapsetInfo = results;
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
			});
		} else {
			this.downloadError = 'Please select a download type and format.';
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

	openDownloadModal(content: any) {
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

	openMapsetInfoModal(params: any, content: any) {
		this.mapsetInfo = params.data;
		this.mapsetInfoModalRef = this.modalService.open(content, { size: 'lg', centered: true });
		this.isModalOpen = true;
	}

	closeMapsetInfoModal() {
		this.mapsetInfoModalRef.close();
		this.isModalOpen = false;
	}

	openToBeDevelopedModal(content: any) {
		this.toBeDevelopedModalRef = this.modalService.open(content, { centered: true });
		this.isModalOpen = true;
	}

	closeToBeDevelopedModal() {
		this.toBeDevelopedModalRef.close();
		this.isModalOpen = false;
	}

	goToDetailsPage(refsetId: any, versionDate: any) {
		const url = new URL(window.location.href);
		url.searchParams.set('reload', 'true');
		window.history.pushState({}, '', url.href);
		this.router.navigate(['/details', refsetId, versionDate], { replaceUrl: false, skipLocationChange: false });
	}

	goToMapRecordsPage(code: any) {
		this.router.navigate(['projects/mapset/' + code + '/mappings'], { replaceUrl: false, skipLocationChange: false });
	}

	getRefsetRow(refsetId: string) {
		let refset;

		for (let i = 0; i < this.refsetData.length; i++) {
			if (this.refsetData[i].refsetId == refsetId) {
				refset = this.refsetData[i];
				break;
			}
		}

		return refset;
	}

	formatVersionDate(date: any): string {
		return date.slice(0, 4) + '-' + date.slice(4, 6) + '-' + date.slice(6, 8);
	}

	dateFormatter(val: any): any {
		return UiUtility.dateFormatter(val);
	}

	getModuleLanguageIcon(moduleId: string) {
		let flag = '';
		this.moduleMetadata.module.forEach((data: any) => {
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

	onResize(event: any) {
		const gridWidth = document.getElementsByClassName('rt2-ag-grid')[0]?.clientWidth;
		document.getElementsByClassName('ag-header')[0]?.setAttribute('style', `width: ${gridWidth}px;`);
	}

	setDescriptions(refsetData: any): Array<string> {
		return refsetData?.descriptions;
	}

	showFlagIcon(event: any, show: any) {
		if (show) {
			event.target.style.display = 'inline';
		} else {
			event.target.style.display = 'none';
		}
	}

	latestDate(refset: any, versionList: any[]): string {
		if (refset.versionStatus === Constants.IN_DEVELOPMENT) {
			return 'Latest';
		}
		return versionList && versionList[0] ? `${versionList[0].date}` : '';
	}
}
