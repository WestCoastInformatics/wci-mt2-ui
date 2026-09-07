import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, OnInit, Output, ElementRef, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DialogService } from 'src/app/dialog/services/dialog.service';
import { TemplateRendererComponent } from 'src/app/components/cellRenderers/template.renderer';
import { CategoryFilterComponent } from 'src/app/components/categoryFilter/category-filter.component';
import { DateTextFilterComponent } from 'src/app/components/dateTextFilter/date-text-filter.component';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { MT2Service } from 'src/app/services/mt2.service';
import { Title } from '@angular/platform-browser';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { RefsetUtility } from 'src/app/utilities/refset.utility';
import { Constants } from 'src/app/utilities/constants.utility';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { Debounce } from 'src/app/decorators/debounce.decorator';
import { User } from 'src/app/models/user';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';

@Component({
	standalone: false,
	selector: 'app-dashboard',
	templateUrl: './dashboard.component.html',
	styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, AfterViewInit {
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
	initialGridWidth: number;
	showFullNarrativeText = false;
	showFullNotesText = false;
	showLoadingSpinner = false;
	toggleDropdown = false;
	numOfResults = 0;
	directUrl = '';
	numOfMembers: any;
	mapsetLibraryColumnStorage = 'mapsetLibraryColumnStorage';
	disableChannel = new BroadcastChannel('disable-button-channel');
	originalGridParams: any;
	uiUtility = UiUtility;
	showLoadingSearch = true;
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
	allMapsets: any;

	@Output() loadingSpinner = new EventEmitter<boolean>(true);

	@ViewChild('workflowStatusSection') workflowStatusSection!: TemplateRef<any>;

	constructor(
		private router: Router,
		private titleService: Title,
		private refsetService: RefsetService,
		private changeDetectorRef: ChangeDetectorRef,
		private breadcrumbService: BreadcrumbService,
		private authenticationService: AuthenticationService,
		private mt2Service: MT2Service,
	) {
		document.body.scrollTop = 0;
		refsetService.getTaxonomyRoot();
	}

	//***** Framework Functions *****/
	ngOnInit() {
		this.user = this.authenticationService.getUser();
		this.titleService.setTitle('Mapping Tool - Dashboard');
		this.breadcrumbService.setBreadcrumbs([{ label: 'Dashboard' }]);
		this.clearSavedSelections();
		this.getModuleMetadata();
		this.disableChannel.postMessage(false);
	}

	ngAfterViewInit() {
		if (this.workflowStatusSection) {
			this.refsetService.getMapsets().subscribe({
				next: (results) => {
					if (results?.length > 0) {
						this.allMapsets = results;
						this.getMapsetData();
					} else {
						console.error('no mapset found');
					}
				},
				error: (err) => {
					console.error(' Error: ', err);
					this.authenticationService.checkError(err);
				},
			});
		}
	}

	private clearSavedSelections(): void {
		const keysToRemove: string[] = [];

		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);

			if (
				key?.startsWith('library_mapsetSearchInput') ||
				key?.startsWith('library_showMapTable') ||
				key?.startsWith('library_mapsetVersion') ||
				key?.startsWith('library_mapsetGridCurrentPageSize') ||
				key?.startsWith('library_mapsetGridCurrentPageNum') ||
				key?.startsWith('library_mapsetRecordsColumns') ||
				key?.startsWith('library_batchSearchInput') ||
				key?.startsWith('projects_mapsetSearchInput') ||
				key?.startsWith('projects_showMapTable') ||
				key?.startsWith('projects_mapsetVersion') ||
				key?.startsWith('projects_mapsetGridCurrentPageSize') ||
				key?.startsWith('projects_mapsetGridCurrentPageNum') ||
				key?.startsWith('projects_mapsetRecordsColumns') ||
				key?.startsWith('projects_batchSearchInput')
			) {
				keysToRemove.push(key);
			}
		}

		keysToRemove.forEach((key) => localStorage.removeItem(key));
	}

	getMapsetData() {
		this.columnDefs = [
			{
				field: 'mapSetCode',
				tooltipField: 'mapSetCode',
				headerName: 'Map Set ID',
				cellClass: 'mt2-directory-column-id',
				minWidth: 65,
				resizable: true,
				sortable: false,
				unSortIcon: false,
				suppressSorting: true,
			},
			{
				field: 'mapSetName',
				tooltipField: 'mapSetName',
				headerName: 'Map Set Name',
				cellClass: 'mt2-directory-column-name',
				flex: 2,
				resizable: true,
				minWidth: 65,
				sort: 'asc',
				sortable: false,
				unSortIcon: false,
				suppressSorting: true,
			},
			{
				field: 'conceptCode',
				tooltipField: 'conceptCode',
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
				field: 'conceptName',
				tooltipField: 'conceptName',
				headerName: 'Source PT',
				cellClass: 'mt2-directory-column-name',
				flex: 2,
				resizable: true,
				minWidth: 65,
				sort: 'asc',
				sortable: false,
				unSortIcon: false,
				suppressSorting: true,
			},
			{
				field: 'workflowStatus',
				tooltipField: 'workflowStatus',
				headerName: 'Workflow Status',
				cellClass: 'mt2-directory-column-version-status',
				minWidth: 165,
				width: 200,
				resizable: true,
				cellRenderer: TemplateRendererComponent,
				cellRendererParams: { template: this.workflowStatusSection },
				unSortIcon: false,
				sortable: false,
			},
			{
				field: 'modified',
				tooltipValueGetter: UiUtility.gridDateValueGetter,
				headerName: 'Last Modified',
				cellClass: 'mt2-directory-column-modified-date',
				minWidth: 65,
				width: 170,
				resizable: true,
				valueGetter: UiUtility.gridDateValueGetter,
				floatingFilterComponent: DateTextFilterComponent,
				floatingFilterComponentParams: { suppressFilterButton: true },
				sortable: false,
				unSortIcon: false,
				suppressSorting: true,
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
		};

		this.showTable = true;
		this.changeDetectorRef.detectChanges();
	}

	showDropdown(): void {
		this.toggleDropdown = !this.toggleDropdown;
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

		// this.refsetService.getMapsetsByStatus('PUBLISHED').subscribe({
		this.refsetService.getMappingsRecentlyModified().subscribe({
			next: (results) => {
				this.showLoadingSearch = false;
				const data = results;
				let mappings = [];
				this.refsetData = [];

				for (const item of data.items) {
					let mapping = {
						modified: item.modified,
						mapSetId: item.mapSetId,
						mapSetName: '',
						mapSetCode: '',
						conceptCode: item.sourceConceptCode,
						conceptName: '',
						workflowStatus: item.workflowStatus,
					};
					mappings.push(mapping);
				}
				for (let map of mappings) {
					for (const all of this.allMapsets) {
						if (map.mapSetId === all.id) {
							map.mapSetName = all.refSetName;
							map.mapSetCode = all.refSetCode;

							this.refsetService.getMappingByMapsetConceptList(map.mapSetCode, map.conceptCode).subscribe({
								next: (results) => {
									if (results?.items.length > 0) {
										for (let amp of mappings) {
											if (amp.conceptCode === results.items[0].code) {
												amp.conceptName = results.items[0].name;
											}
										}
										this.refsetData = mappings;
										results.items = this.refsetData;
										UiUtility.applyServerPagedGridResults(
											results,
											this.refsetGridApi,
											this.refsetGridPaging,
											pageNumber,
											null,
											false,
										);
									} else {
										console.error('no mapset found');
									}
								},
								error: (err) => {
									console.error(' Error: ', err);
									this.authenticationService.checkError(err);
								},
							});
						}
					}
				}
				this.refsetData = mappings;
				this.numOfMembers = results.total;
				this.numOfResults = results.total;
				results.items = this.refsetData;
				const lastIndex = document.getElementsByClassName('ag-header').length - 1;
				const child = document.getElementsByClassName('ag-header')[lastIndex];
				document.getElementById('directoryHeader').appendChild(child);

				if (results.total == 0) {
					this.refsetGridPaging.totalKnown = true;
					this.refsetGridApi.showNoRowsOverlay();
					this.refsetGridApi.setGridOption('rowData', []);
					if (pageNumber > 1) {
						this.refsetGridPaging.totalRows = this.refsetGridApi.paginationGetPageSize() * (pageNumber - 1);
						this.refsetGridPaging.totalKnown = true;
					}
					this.showPaging = false;
					return;
				} else {
					this.showPaging = true;
				}

				UiUtility.applyServerPagedGridResults(results, this.refsetGridApi, this.refsetGridPaging, pageNumber, null, false);
			},
			error: (err: any) => {
				this.refsetGridApi.showNoRowsOverlay();
				this.refsetGridApi.setGridOption('rowData', []);
				this.authenticationService.checkError(err);
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
			const selectedRow = this.refsetGridApi.getSelectedRows()[0];
			if (selectedRow) {
				this.goToMappingPage(selectedRow.mapSetCode, selectedRow.conceptCode);
			}
		}
	};

	goToMappingPage(code: any, mappingCode: any) {
		this.router.navigate(['/projects' + '/mapset/' + code + '/mapping/' + mappingCode], {
			replaceUrl: false,
			skipLocationChange: false,
		});
	}

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
			localStorage.setItem('librarySearchInput', JSON.stringify(this.searchInput));
		}
	}

	//***** General Functions *****/

	goToDetailsPage(refsetId: any, versionDate: any) {
		const url = new URL(window.location.href);
		url.searchParams.set('reload', 'true');
		window.history.pushState({}, '', url.href);
		this.router.navigate(['/details', refsetId, versionDate], { replaceUrl: false, skipLocationChange: false });
	}

	goToMapRecordsPage(code: any) {
		this.router.navigate(['library/mapset/' + code + '/mappings'], { replaceUrl: false, skipLocationChange: false });
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
				error: (err) => {
					console.error(' Error: ', err);
					this.authenticationService.checkError(err);
				},
			});
		} else {
			this.moduleMetadata = this.mt2Service.moduleMetadata.value;
		}
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
		const gridWidth = document.getElementsByClassName('mt2-ag-grid')[0]?.clientWidth;
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
