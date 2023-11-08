import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ICellRendererComp, ICellRendererParams, RowSpanParams } from 'ag-grid-community';
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

@Component({
	selector: 'app-mapset-records',
	templateUrl: './mapset-records.component.html',
	styleUrls: ['./mapset-records.component.scss'],
})
export class MapsetRecordsComponent implements OnInit, AfterViewInit {
	user: User;
	searchInput: string;
	viewOptions = [
		{ value: 'all', display: 'All' },
		{ value: 'public', display: 'Public' },
		{ value: 'private', display: 'Private' },
	];
	selectedView = 'all';
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
	uiUtility = UiUtility;
	showLoadingSearch = true;
	toBeDevelopedModalRef: NgbModalRef;
	isModalOpen = false;
	mapsetName = 'Mapset Name';
	mapsetCode: string;
	routeParamsSubscription$: Subscription;
	gridSelectAll = false;

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
		refsetService.getTaxonomyRoot();
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

		this.disableChannel.postMessage(false);
	}

	getMapsetInfo() {
		this.refsetService.getMapsets().subscribe({
			next: (results) => {
				const thisResult = results.filter((res) => {
					return res.refSetCode === this.mapsetCode;
				});
				this.mapsetName = thisResult[0].refSetName;
			},
		});
	}

	ngAfterViewInit() {
		this.refsetService.getMapsets().subscribe((results) => {
			this.versionStatuses = results;
			const versionStatusArray = []; //this.versionStatuses?.items;
			this.versions = []; //versionResults;
			const versionsArray = []; //this.versions?.items;
			const editionsArray = []; //editionResults.items;
			for (let i = 0; i < editionsArray.length; i++) {
				editionsArray[i] = { 'value': editionsArray[i].branch, 'name': editionsArray[i].name };
			}
			this.organizations = []; //organizationResults;
			const organizationsArray = []; //this.organizations?.items;

			for (let i = 0; i < versionStatusArray.length; i++) {
				versionStatusArray[i].key = versionStatusArray[i].key.toLowerCase();
				versionStatusArray[i].value = versionStatusArray[i].value.toLowerCase();
			}

			this.columnDefs = [
				{
					field: 'spanned',
					tooltipField: '',
					headerName: 'Check/Uncheck All',
					headerComponentParams: {
						template:
							'<div class="ag-cell-label-container" role="presentation">' +
							'  <span ref="eMenu" class="ag-header-icon ag-header-cell-menu-button"></span>' +
							'  <div ref="eLabel" class="ag-header-cell-label" role="presentation">' +
							'    <span ref="eSortOrder" class="ag-header-icon ag-sort-order"></span>' +
							'    <span ref="eSortAsc" class="ag-header-icon ag-sort-ascending-icon"></span>' +
							'    <span ref="eSortDesc" class="ag-header-icon ag-sort-descending-icon"></span>' +
							'    <span ref="eSortNone" class="ag-header-icon ag-sort-none-icon"></span>' +
							'	 <input type="checkbox" onclick="checkboxHandleClick(event)" title="Check/Uncheck All" />' +
							'    <span ref="eFilter" class="ag-header-icon ag-filter-icon"></span>' +
							'  </div>' +
							'</div>',
					},
					filter: false,
					resizable: false,
					minWidth: 55,
					width: 55,
					cellRenderer: TemplateRendererComponent,
					cellRendererParams: { template: this.checkSection },
					sortable: false,
					unSortIcon: false,
					cellClass: 'blue-link',
					rowSpan: rowSpan,
					cellClassRules: {
						'cell-spanner': 'value===true',
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
					filterParams: {
						textMatcher: ({ filter, value, filterText }) => {
							/*let match = false;
							if (value.includes(filterText) || value == '') {
								match = true;
							}
							return match;*/
						},
					},
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
					filterParams: {
						textMatcher: ({ filter, value, filterText }) => {
							/*let match = false;
							if (value.includes(filterText) || value == '') {
								match = true;
							}
							return match;*/
						},
					},
				},
				{
					field: 'group',
					tooltipField: 'group',
					headerName: 'Group',
					width: 100,
					resizable: true,
					unSortIcon: true,
					filter: 'agTextColumnFilter',
					filterParams: {
						textMatcher: ({ filter, value, filterText }) => {
							/*let match = false;
						if (value.includes(filterText) || value == '') {
							match = true;
						}
						return match;*/
						},
					},
				},
				{
					field: 'priority',
					tooltipField: 'priority',
					headerName: 'Priority',
					cellClass: 'rt2-directory-column-id',
					flex: 1,
					minWidth: 85,
					resizable: true,
					unSortIcon: true,
					filter: 'agTextColumnFilter',
					filterParams: {
						textMatcher: ({ filter, value, filterText }) => {
							/*let match = false;
							if (value.includes(filterText) || value == '') {
								match = true;
							}
							return match;*/
						},
					},
				},
				{
					field: 'toCode',
					tooltipField: 'toCode',
					headerName: 'Target',
					flex: 1,
					minWidth: 100,
					cellRenderer: TemplateRendererComponent,
					cellRendererParams: {
						template: this.codeSection,
					},
					resizable: true,
					unSortIcon: true,
					sortable: true,
					filter: 'agTextColumnFilter',
					filterParams: {
						textMatcher: ({ filter, value, filterText }) => {
							/*let match = false;
							if (value.includes(filterText) || value == '') {
								match = true;
							}
							return match;*/
						},
					},
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
					filterParams: {
						textMatcher: ({ filter, value, filterText }) => {
							/*let match = false;
							if (value.includes(filterText) || value == '') {
								match = true;
							}
							return match;*/
						},
					},
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
					filterParams: {
						textMatcher: ({ filter, value, filterText }) => {
							/*let match = false;
						if (value.includes(filterText) || value == '') {
							match = true;
						}
						return match;*/
						},
					},
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
					filterParams: {
						textMatcher: ({ filter, value, filterText }) => {
							/*let match = false;
						if (value.includes(filterText) || value == '') {
							match = true;
						}
						return match;*/
						},
					},
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
					filterParams: {
						textMatcher: ({ filter, value, filterText }) => {
							/*let match = false;
							if (value.includes(filterText) || value == '') {
								match = true;
							}
							return match;*/
						},
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
					filterParams: {
						textMatcher: ({ filter, value, filterText }) => {
							/*let match = false;
							if (value.includes(filterText) || value == '') {
								match = true;
							}
							return match;*/
						},
					},
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

			this.refsetGridOptions.getRowStyle = (params) => {
				if (this.mapsetData) {
					if (this.mapsetData[params.node.rowIndex].spanned) {
						return this.getSameRowStyle(); //span row
					} else {
						return this.getNextRowStyle(); //reg row
					}
				}
			};
			this.showTable = true;
			this.changeDetectorRef.detectChanges();
		});
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

	//***** AG Grid Functions *****/
	onGridReady = (gridReadyParams) => {
		const searchTime = Date.now();
		this.searchCallArray.push(searchTime);

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

		if (this.selectedView === 'public') {
			query = CodeUtility.addIfNotEmpty(query, ' AND ') + 'privateRefset: false';
		} else if (this.selectedView === 'private') {
			query = CodeUtility.addIfNotEmpty(query, ' AND ') + 'privateRefset: true';
		}

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

		this.refsetService.getMappingByCode(this.mapsetCode).subscribe({
			next: (results) => {
				this.showLoadingSearch = false;
				// if this is not the latest search call then do not apply the results
				if (searchTime - this.searchCallArray[this.searchCallArray.length - 1] < 0) {
					return;
				}

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
							'downloadable': spanned ? false : true,
							'entries': results[a].mapEntries.length,
							'code': b > 0 && spanned ? '' : results[a].code,
							'name': b > 0 && spanned ? '' : results[a].name,
							'toName': results[a].mapEntries[b].toName.length > 0 && results[a].mapEntries[b].toName !== ' DOES NOT EXIST' ? results[a].mapEntries[b].toName : '---',
							'toCode': results[a].mapEntries[b].toCode.length > 0 ? results[a].mapEntries[b].group + '/' + results[a].mapEntries[b].toCode : 'No map entries available.',
							'rule': results[a].mapEntries[b].rule.length > 0 ? results[a].mapEntries[b].rule : '---',
							'relation': results[a].mapEntries[b].relation.length > 0 ? results[a].mapEntries[b].relation : '---',
							'modified': b > 0 && spanned ? '' : results[a].mapEntries[b].modified,
							'advices': results[a].mapEntries[b].advices,
							'group': results[a].mapEntries[b].group,
							'priority': results[a].mapEntries[b].priority,
						});
						count++;
					}
				}
				results = data;
				this.mapsetData = data;
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

	quickFilterMatcher = (quickFilterParts, rowQuickFilterAggregateText) => {
		//const results = quickFilterParts.every((part) => rowQuickFilterAggregateText.match(part));
		/*if (!results) {
			//quick filter search all grid by text any * column - do this after as an external filter! https://www.ag-grid.com/angular-data-grid/filter-external/
			const spans = this.mapsetData.filter((res) => {
				console.log(res);
				if (res.entries > 1) {
					//console.log(res.mapEntries);
				}
				if (res.spanned) {
					console.log('entries');
					console.log(res.toCode);
				}
				return res;
			});
		}
		*/
		//return results;
	};

	editionValueGetter = function (params) {
		if (!CodeUtility.hasValue(params?.data)) {
			return '';
		}
		let branch;
		if (params?.data?.edition?.branch) {
			params.data.flagIcon = RefsetUtility.getEditionFlagIcon(params?.data?.edition?.branch);

			//remove this if change to LibrarySortField
			//
			branch = params?.data?.edition?.branch;
			if (branch.toLowerCase().includes('affiliate')) {
				branch = branch.toLowerCase().substring(0, branch.toLowerCase().lastIndexOf('/snomedct-'));
			}
			//
		}
		//change from: = branch, to: = params?.data?.edition?.LibrarySortField
		params.data.librarySortField = branch;

		return params.data.librarySortField;
	};

	versionStatusValueGetter = function (params) {
		if (!CodeUtility.hasValue(params?.data.versionStatus)) {
			return '';
		}

		return params.data.versionStatus.toLowerCase();
	};

	checkboxRowSelect(event, index) {
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

	onGridCellClick = (event) => {
		//	if (event.column.colId === 'information' || event.column.colId === 'actions') {
		//
		//} else {
		const selectedRows = this.refsetGridApi.getSelectedRows();
		let selectedId: string;
		let selectedVersionDate: string;

		selectedRows.forEach(function (selectedRow, index) {
			selectedId = selectedRow.refsetId;
			selectedVersionDate = RefsetUtility.getVersionDateForRefsetApiCall(selectedRow);
		});
		//console.log(selectedRows);
		//this.goToDetailsPage(selectedId, selectedVersionDate);
		//	}
	};

	gridEvent(action): void {
		//console.log(action);
		const selectedRows = this.refsetGridApi.getSelectedRows();
		//console.log(selectedRows);
		this.openToBeDevelopedModal(this.tbdModal);
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
			this.showLoadingSearch = true;
			this.onGridReady(this.originalGridParams);
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

	goToDetailsPage(refsetId, versionDate) {
		const url = new URL(window.location.href);
		url.searchParams.set('reload', 'true');
		window.history.pushState({}, '', url.href);
		this.router.navigate(['/details', refsetId, versionDate], { replaceUrl: false, skipLocationChange: false });
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

	getAdviceDisplayLink(value): string {
		let adviceLink = '--';
		if (value) {
			if (value.length > 0) {
				adviceLink = 'Advices (' + value.length + ')';
			}
		}
		return adviceLink;
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
		const gridWidth = document.getElementsByClassName('rt2-ag-grid')[0]?.clientWidth;
		document.getElementsByClassName('ag-header')[0]?.setAttribute('style', `width: ${gridWidth}px;`);
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
}
function rowSpan(params: RowSpanParams) {
	if (params.data.entries >= 1) {
		return params.data.entries;
	} else {
		return 1;
	}
}
