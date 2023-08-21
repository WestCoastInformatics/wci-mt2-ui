import { AfterViewInit, ChangeDetectorRef, Component, OnInit, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Context } from 'ag-grid-community';
import { CategoryFilterComponent } from 'src/app/components/categoryFilter/category-filter.component';
import { DateTextFilterComponent } from 'src/app/components/dateTextFilter/date-text-filter.component';
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';
import { PaginationComponent } from 'src/app/components/pagination/pagination.component';
import { Debounce } from 'src/app/decorators/debounce.decorator';
import { DialogService } from 'src/app/dialog/services/dialog.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { ToggleService } from 'src/app/services/toggle-service/toggle.service';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { RefsetUtility } from 'src/app/utilities/refset.utility';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProjectsComponentService } from 'src/app/pages/projects/projects-component.service';
import { User } from 'src/app/models/user';

@Component({
	selector: 'projects-refset',
	templateUrl: './projects-refset.component.html',
	styleUrls: ['./projects-refset.component.scss'],
})
export class ProjectsRefsetComponent implements OnInit, AfterViewInit, OnDestroy {
	routerParamsSubscription: Subscription;
	routerEventSubscription: Subscription;
	user: User;
	projectList: any[] = [];
	projectSubscription: Subscription;
	selectedProject: any;
	organizationId: any;
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
	refsetGridOptions: any;
	refsetGridPaging = {
		pageSize: 10,
		pageSizeOptions: [10, 25, 50, 100],
		totalKnown: false,
		totalRows: null,
		manualStateRefresh: new Boolean(true),
	};
	refsetGridLastFilter = '';
	refsetGridLastSort = '';
	refsetData: any;
	dialog: DialogService;
	versions: any;
	workflowStatuses = [];
	initialGridWidth: number;
	showFullNarrativeText = false;
	showFullNotesText = false;
	showLoadingSpinner = false;
	createRefsetProperties = {};
	metadataAndConcepts = true;
	context: Context;
	originalGridParams: any;
	existingBranchVersions: any;
	numOfResults = 0;
	projectIsUat: boolean;
	projectId: any;
	uiUtility = UiUtility;
	currentURL: string;
	dataSource: {};
	gridInterval: any;

	@ViewChild('projectNameSection') nameSection: TemplateRef<any>;
	@ViewChild('projectWorkflowStatusSection') workflowStatus: TemplateRef<any>;
	@ViewChild('projectPaging') paginationComponent: PaginationComponent;
	@ViewChild('projectActionSection') actionSection: TemplateRef<any>;

	constructor(
		protected readonly router: Router,
		protected readonly titleService: Title,
		protected readonly refsetService: RefsetService,
		private readonly changeDetectorRef: ChangeDetectorRef,
		public readonly toggleService: ToggleService,
		protected readonly authService: AuthenticationService,
		private readonly modalService: NgbModal,
		protected readonly route: ActivatedRoute,
		private readonly projectsComponentService: ProjectsComponentService
	) {
		document.body.scrollTop = 0;
		refsetService.getTaxonomyRoot();
	}

	// ***** Framework Functions *****/
	ngOnInit() {
		this.titleService.setTitle('Reference Set Tool - Projects - Reference Sets');
		this.user = this.authService.getUser();

		this.routerParamsSubscription = this.route.params.subscribe((params) => {
			this.organizationId = params['organizationId'];
			this.projectId = params['projectId'];
		});

		this.routerEventSubscription = this.router.events.subscribe((event) => {
			if (this.router.url.includes('organization') && this.router.url.includes('edition') && this.router.url.includes('projects') && this.router.url.includes('refsets')) {
				this.checkLocationPath(this.router.url);
			} else {
				this.ngOnDestroy();
			}
		});

		this.refsetGridOptions = {
			context: { componentParent: this },
			pagination: true,
			suppressColumnVirtualisation: true, // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
			suppressPaginationPanel: true,
			paginationPageSize: this.refsetGridPaging.pageSize,
			cacheBlockSize: this.refsetGridPaging.pageSize,
			maxBlocksInCache: 1,
			rowModelType: 'infinite',
			enableCellTextSelection: true,
			rowSelection: 'single',
			onCellClicked: this.onGridCellClick,
			onGridReady: this.onGridReady,
			frameworkComponents: {
				'templateRenderer': TemplateRenderer,
				'categoryFilterComponent': CategoryFilterComponent,
				'dateTextFilterComponent': DateTextFilterComponent,
			},
			defaultColDef: {
				sortable: true,
				filter: true,
				sortingOrder: ['asc', 'desc'],
				floatingFilter: true,
				floatingFilterComponentParams: { placeholder: '', suppressFilterButton: true },
				suppressMenu: true,
				menuTabs: ['columnsMenuTab'],
				resizable: true,
			},
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

		this.gridInterval = setInterval(() => {
			this.loadGridColumns();
			clearInterval(this.gridInterval);
		}, 10);
	}

	checkLocationPath(url) {
		if (this.currentURL != url) {
			this.currentURL = url;
			const parts = url.split('/');
			for (let p = 0; p < parts.length; p++) {
				if (parts[p].includes('organization')) {
					if (parts[p + 1] != undefined) {
						this.organizationId = parts[p + 1];
					}
				}
				if (parts[p].includes('projects')) {
					if (parts[p + 1] != undefined) {
						this.projectId = parts[p + 1];
					}
				}
			}
			if (this.organizationId) {
				this.showRefsetData();
			}
		}
	}

	ngAfterViewInit() {
		this.workflowStatuses = [
			{ type: 'status', name: 'In Edit', value: 'IN_EDIT' },
			{ type: 'status', name: 'In Review', value: 'IN_REVIEW' },
			{ type: 'status', name: 'In Upgrade', value: 'IN_UPGRADE' },
			{ type: 'status', name: 'Published', value: 'PUBLISHED' },
			{ type: 'status', name: 'Ready For Edit', value: 'READY_FOR_EDIT' },
			{ type: 'status', name: 'Ready For Publication', value: 'READY_FOR_PUBLICATION' },
			{ type: 'status', name: 'Ready For Review', value: 'READY_FOR_REVIEW' },
			{ type: 'status', name: 'Review Completed', value: 'REVIEW_COMPLETED' },
		];

		this.refsetService.getVersions().subscribe((versionResults) => {
			this.versions = versionResults;
		});

		this.changeDetectorRef.detectChanges();
	}

	loadGridColumns(): void {
		this.columnDefs = [
			{ field: 'refsetId', tooltipField: 'refsetId', headerName: 'Reference ID', cellClass: 'rt2-directory-column-id', minWidth: 65, resizable: true, unSortIcon: true },
			{
				field: 'name',
				tooltipField: 'name',
				headerName: 'Reference Name',
				cellClass: 'rt2-directory-column-name',
				flex: 1,
				minWidth: 65,
				resizable: true,
				cellRenderer: 'templateRenderer',
				cellRendererParams: { template: this.nameSection },
				unSortIcon: true,
			},
			{ field: 'assignedUser', tooltipField: 'assignedUser', headerName: 'Assignee', cellClass: 'text-lowercase', minWidth: 65, resizable: true, unSortIcon: true },
			{
				field: 'workflowStatus',
				tooltipField: 'workflowStatus',
				headerName: 'Workflow Status',
				cellClass: 'rt2-directory-column-workflow-status',
				minWidth: 65,
				resizable: true,
				cellRenderer: 'templateRenderer',
				cellRendererParams: { template: this.workflowStatus },
				floatingFilterComponent: 'categoryFilterComponent',
				floatingFilterComponentParams: { suppressFilterButton: true, names: this.workflowStatuses },
				unSortIcon: true,
			},
			{
				field: 'versionDate',
				tooltipValueGetter: UiUtility.gridDateValueGetter,
				headerName: 'Version Date',
				cellClass: 'rt2-directory-column-version-date',
				minWidth: 65,
				resizable: true,
				valueGetter: UiUtility.gridDateValueGetter,
				floatingFilterComponent: 'categoryFilterComponent',
				floatingFilterComponentParams: { suppressFilterButton: true, names: this.versions?.items },
				unSortIcon: true,
			},
			{
				field: 'modified',
				tooltipValueGetter: UiUtility.gridDateValueGetter,
				headerName: 'Last Modified Date',
				cellClass: 'rt2-directory-column-modified-date',
				minWidth: 65,
				resizable: true,
				valueGetter: UiUtility.gridDateValueGetter,
				floatingFilterComponent: 'dateTextFilterComponent',
				floatingFilterComponentParams: { suppressFilterButton: true },
				sort: 'desc',
				unSortIcon: true,
			},
			// This is an exception to a resizeable field because it is an action field
			{
				field: 'downloadable',
				colId: 'actions',
				headerName: '',
				minWidth: 65,
				width: 110,
				cellClass: 'rt2-directory-column-actions',
				cellRenderer: 'templateRenderer',
				cellRendererParams: { template: this.actionSection },
				sortable: false,
				filter: false,
				resizable: false,
			},
		];

		this.showRefsetData();
	}

	getProjects(): void {
		const project_id = this.projectId;
		this.projectSubscription = this.projectsComponentService.getProjects().subscribe((results) => {
			this.projectList = <any>results;
			for (const project of this.projectList) {
				if (project_id == project.id) {
					this.selectedProject = project;
					this.getBranchVersions();
					this.createRefsetProperties = { project: this.selectedProject, definitionClauses: [{ value: '', negated: false }] };
					return;
				}
			}
		});
	}

	showRefsetData() {
		if (this.originalGridParams) {
			this.onGridReady(this.originalGridParams);
		}
		if (this.refsetGridApi) {
			this.refsetGridApi.showLoadingOverlay();
		}

		if (this.refsetGridApi) {
			this.dataSource = {};
		}
		this.getRefsets();
		this.getProjects();
	}

	projectRefsetReload() {
		window.location.reload();
	}

	onGridReady = (gridReadyParams) => {
		this.originalGridParams = gridReadyParams;
		this.refsetGridApi = gridReadyParams?.api;
		this.refsetGridColumnApi = gridReadyParams?.columnApi;
	};

	getRefsets(): void {
		this.dataSource = {
			rowCount: null,
			getRows: (rowParams) => {
				let pageNumber = Math.floor(rowParams.endRow / this.refsetGridApi.paginationGetPageSize());
				if (pageNumber < 1) {
					pageNumber = 1;
				}
				let query = UiUtility.formatFilterData(rowParams.filterModel);
				const sort = UiUtility.formatSortData(rowParams.sortModel);

				query = CodeUtility.addIfNotEmpty(query, ' AND ') + 'projectId:' + this.projectId;

				const newFilterString = query;
				const newSortString = JSON.stringify(sort);

				// if the filters or sort have changed then move to the first page
				if (newFilterString !== this.refsetGridLastFilter || newSortString !== this.refsetGridLastSort) {
					pageNumber = 1;
					this.refsetGridApi?.api?.paginationGoToPage(0);
				}

				// if the filters have changed then reset the total row variables
				if (newFilterString !== this.refsetGridLastFilter) {
					this.refsetGridPaging.totalRows = null;
					this.refsetGridPaging.totalKnown = false;
				}

				this.refsetGridLastFilter = newFilterString;
				this.refsetGridLastSort = newSortString;

				query = query.replace(/\//g, '%2F');

				const restParams: any = {
					limit: this.refsetGridApi.paginationGetPageSize(),
					offset: pageNumber - 1,
					searchConcepts: this.metadataAndConcepts,
					showInDevelopment: true,
					countComments: true,
					sortModel: rowParams.sortModel,
					filterModel: rowParams.filterModel,
					query: query,
				};

				if (this.projectId != '0') {
					this.refsetService.getRefsets({ ...restParams, ...sort }).subscribe(
						(results) => {
							this.numOfResults = results.total;
							if (results.items.length == 0 && pageNumber > 1) {
								this.refsetGridPaging.totalRows = this.refsetGridApi.paginationGetPageSize() * (pageNumber - 1);
								this.refsetGridPaging.totalKnown = true;
								this.paginationComponent.goToPage(pageNumber - 1);

								return;
							}

							const data = results.items;
							this.refsetData = data;

							if (data?.length > 0) {
								this.refsetGridApi.hideOverlay();
								let currentRowCount = null;
								let lastRow = -1;

								if (results.totalKnown || data.length < this.refsetGridApi.paginationGetPageSize() || this.refsetGridPaging.totalKnown) {
									if (results.totalKnown) {
										lastRow = results.total;
									} else if (this.refsetGridPaging.totalKnown) {
										lastRow = this.refsetGridPaging.totalRows;
									} else {
										currentRowCount = data.length + (pageNumber - 1) * this.refsetGridApi.paginationGetPageSize();
										lastRow = currentRowCount;
									}

									this.refsetGridPaging.totalRows = lastRow;
									this.refsetGridPaging.totalKnown = true;
								} else {
									currentRowCount = data.length + (pageNumber - 1) * this.refsetGridApi.paginationGetPageSize();
								}

								rowParams.successCallback(data, lastRow);
							} else {
								this.refsetGridApi.showNoRowsOverlay();
								rowParams.successCallback([], 0);
							}

							this.refsetGridPaging.manualStateRefresh = new Boolean(true);
							UiUtility.applyGridPlaceholders('.ag-floating-filter-input .ag-input-field-input');
						},
						(error) => {
							this.refsetGridApi.showNoRowsOverlay();
							rowParams.successCallback([], 0);
						}
					);
				} else {
					this.numOfResults = 0;
					this.refsetGridApi.showNoRowsOverlay();
					rowParams.successCallback([], 0);
				}
			},
		};
		if (this.refsetGridApi) {
			this.refsetGridApi.setDatasource(this.dataSource);
		}
	}

	onGridCellClick = (event) => {
		if (event.column.colId === 'information' || event.column.colId === 'actions') {
			return;
		} else {
			const selectedRows = this.refsetGridApi.getSelectedRows();
			let refsetId: string;
			let versionDate: string;

			selectedRows.forEach(function (selectedRow, index) {
				refsetId = selectedRow.refsetId;
				versionDate = RefsetUtility.getVersionDateForRefsetApiCall(selectedRow);
			});

			this.goToDetailsPage(refsetId, versionDate);
		}
	};

	@Debounce()
	changedViewFilter() {
		this.refsetGridApi.purgeInfiniteCache();
	}

	goToDetailsPage(refsetId, versionDate) {
		this.router.navigate(['/details', refsetId, versionDate], { replaceUrl: false, skipLocationChange: false });
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

	private getBranchVersions(): void {
		if (this.selectedProject) {
			this.refsetService.getBranchVersions(`branch=${this.selectedProject?.edition?.branch.toString()}`).subscribe((results) => {
				this.existingBranchVersions = results.items ? results.items : undefined;
			});
		}
	}

	capitalizeFirstLetterOfString(stringValue: string): string {
		if (stringValue) {
			return stringValue.replace(/(?:^|\s|[-"'([{])+\S/g, (c) => c.toUpperCase());
		}

		return stringValue;
	}

	getRoleString(): string {
		if (!this.selectedProject) {
			return '';
		}

		return UiUtility.getRoleString(this.selectedProject.roles);
	}

	openWorkflowDiagramModal(workflowDiagramModal: NgbModal) {
		this.modalService.open(workflowDiagramModal, {
			windowClass: 'workflow-diagram-modal',
		});
	}

	ngOnDestroy() {
		if (this.routerParamsSubscription) {
			this.routerParamsSubscription.unsubscribe();
		}
		if (this.routerEventSubscription) {
			this.routerEventSubscription.unsubscribe();
		}
		if (this.projectSubscription) {
			this.projectSubscription.unsubscribe();
		}
	}
}
