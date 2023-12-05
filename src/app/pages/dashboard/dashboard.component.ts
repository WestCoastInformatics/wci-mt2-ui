import { AfterViewInit, ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { CategoryFilterComponent } from 'src/app/components/categoryFilter/category-filter.component';
import { TemplateRendererComponent } from 'src/app/components/cellRenderers/template.renderer';
import { DateTextFilterComponent } from 'src/app/components/dateTextFilter/date-text-filter.component';
import { GridHeaderFilterComponent } from 'src/app/components/grid-header-filter/grid-header-filter.component';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { RefsetUtility } from 'src/app/utilities/refset.utility';
import { UiUtility } from 'src/app/utilities/ui.utility';

@Component({
	selector: 'app-dashboard',
	templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit, AfterViewInit {
	@ViewChild('dashboardWorkflowStatusSection') workflowStatus: TemplateRef<any>;

	// Dashboard Variables
	searchText = '';
	organizationList = [];
	projectList = [];
	teamList = [];
	currentUser: any;
	uiUtility = UiUtility;

	// Table Variables
	defaultColDef: any;
	columnDefs = [];
	data = [];
	api: any;
	columnApi: any;
	searchInput: string;
	selectedView = 'all';
	refsetGridApi: any;
	refsetGridColumnApi: any;
	refsetGridOptions: any;
	refsetGridLastFilter = '';
	refsetGridLastSort = '';
	numOfResults = 0;
	numOfMembers: any;
	showLoadingSpinner = false;

	constructor(
		private router: Router,
		private readonly breadcrumbService: BreadcrumbService,
		private readonly titleService: Title,
		private readonly refsetService: RefsetService,
		private changeDetectorRef: ChangeDetectorRef,
		private readonly authService: AuthenticationService
	) {
		document.body.scrollTop = 0;
	}

	ngOnInit(): void {
		this.titleService.setTitle('Mapping Tool - Dashboard');
		this.breadcrumbService.setBreadcrumbs([{ path: '/dashboard', label: 'Dashboard' }]);

		this.currentUser = this.authService.getUser();
		this.refsetGridOptions = {
			context: { componentParent: this },
			rowModelType: 'infinite',
			onCellClicked: this.onGridCellClick,
			onGridReady: this.onGridReady,
			frameworkComponents: {
				'templateRenderer': TemplateRendererComponent,
				'categoryFilterComponent': CategoryFilterComponent,
				'dateTextFilterComponent': DateTextFilterComponent,
				'gridHeaderFilterComponent': GridHeaderFilterComponent,
			},
			defaultColDef: {
				sortable: true,
				filter: true,
				floatingFilter: true,
				floatingFilterComponentParams: { placeholder: '', suppressFilterButton: false, suppressAndOrCondition: true },
				suppressMenu: true,
				sortingOrder: ['asc', 'desc'],
				menuTabs: ['columnsMenuTab'],
				resizable: true,
			},
		};
		this.getOrganizations();
		this.getProjects();
		this.getTeams();
	}

	ngAfterViewInit() {
		this.columnDefs = [
			{
				field: 'name',
				headerName: 'Project / Reference Set Name',
				flex: 2,
				width: 550,
				minWidth: 65,
				tooltipField: 'name',
				unSortIcon: true,
				sortable: true,
				cellRenderer: (params) => {
					return params.data ? `${params.data.name}` + (params.data.private ? '<i class="ml-3 text-muted fa fa-lock"></i>' : '') : '';
				},
				cellClass: 'pointer',
				resizable: true,
				floatingFilterComponent: 'gridHeaderFilterComponent',
				floatingFilterComponentParams: { suppressFilterButton: true, placeholder: 'Search by Project or Reference Set Name' },
			},
			{
				field: 'workflowStatus',
				tooltipField: 'workflowStatus',
				headerName: 'Workflow Status',
				unSortIcon: true,
				cellClass: '',
				cellRenderer: 'templateRenderer',
				cellRendererParams: { template: this.workflowStatus },
				sortable: true,
				flex: 1,
				minWidth: 65,
				width: 200,
				floatingFilterComponent: 'categoryFilterComponent',
				floatingFilterComponentParams: {
					suppressFilterButton: true,
					names: [
						{ type: 'status', name: 'In Edit', value: 'IN_EDIT' },
						{ type: 'status', name: 'In Review', value: 'IN_REVIEW' },
						{ type: 'status', name: 'In Upgrade', value: 'IN_UPGRADE' },
						{ type: 'status', name: 'Published', value: 'PUBLISHED' },
						{ type: 'status', name: 'Ready For Edit', value: 'READY_FOR_EDIT' },
						{ type: 'status', name: 'Ready For Publication', value: 'READY_FOR_PUBLICATION' },
						{ type: 'status', name: 'Ready For Review', value: 'READY_FOR_REVIEW' },
						{ type: 'status', name: 'Review Completed', value: 'REVIEW_COMPLETED' },
					],
				},
				resizable: true,
			},
			{
				field: 'modified',
				tooltipValueGetter: UiUtility.gridDateValueGetter,
				headerName: 'Last Modified Date',
				flex: 1,
				width: 220,
				minWidth: 65,
				unSortIcon: true,
				sortable: true,
				sort: 'desc',
				floatingFilterComponent: 'dateTextFilterComponent',
				floatingFilterComponentParams: { suppressFilterButton: true },
				valueGetter: UiUtility.gridDateValueGetter,
				resizable: false,
			},
		];

		this.changeDetectorRef.detectChanges();
	}

	onGridReady = (gridReadyParams) => {
		this.refsetGridApi = gridReadyParams.api;
		this.refsetGridColumnApi = gridReadyParams.columnApi;
		const sortModel = [{ colId: 'modified', sort: 'desc' }];
		this.refsetGridApi.setSortModel(sortModel);
		const dataSource = {
			rowCount: null,
			getRows: (rowParams) => {
				this.refsetGridApi.showLoadingOverlay();

				let pageNumber = rowParams.endRow / this.refsetGridApi.paginationGetPageSize();
				let query = UiUtility.formatFilterData(rowParams.filterModel);
				const sort = UiUtility.formatSortData(rowParams.sortModel);

				const newFilterString = query;
				const newSortString = JSON.stringify(sort);

				// if the filters or sort have changed then move to the first page
				if (newFilterString !== this.refsetGridLastFilter || newSortString !== this.refsetGridLastSort) {
					pageNumber = 1;
					this.refsetGridApi?.api?.paginationGoToPage(0);
				}

				this.refsetGridLastFilter = newFilterString;
				this.refsetGridLastSort = newSortString;

				const restParams: any = {
					limit: 10,
					offset: 0,
					searchConcepts: true,
					showInDevelopment: true,
					showOnlyPermitted: true,
					sortModel: rowParams.sortModel, //not needed once we get rid of mocking the backend
					filterModel: rowParams.filterModel, //not needed once we get rid of mocking the backend
				};

				if (CodeUtility.hasValue(query)) {
					query = query.replace(/\//g, '%2F').replace(/%/g, '%25');
					restParams.query = query;
				}
				this.data = [];
				this.refsetService.getRefsets({ ...restParams, ...sort }).subscribe({
					next: (results) => {
						for (const refset of results.items) {
							this.data.push({
								name: `${refset?.project?.name}/${refset.name}`,
								refsetId: refset.refsetId,
								private: refset.privateRefset,
								workflowStatus: `${refset?.workflowStatus}`,
								modified: `${refset?.modified}`,
								versionStatus: `${refset.versionStatus}`,
								versionDate: `${refset.versionDate}`,
							});
						}

						const data = this.data;

						if (data?.length > 0) {
							this.refsetGridApi.hideOverlay();

							rowParams.successCallback(data, data.length);
						} else {
							this.refsetGridApi.showNoRowsOverlay();
							rowParams.successCallback([], 0);
						}
					},
					error: (error) => {
						this.refsetGridApi.showNoRowsOverlay();
						rowParams.successCallback([], 0);
					},
				});
			},
		};

		gridReadyParams.api.setDatasource(dataSource);

		// set placeholders on the grid floating filter fields
		UiUtility.applyGridPlaceholders('.ag-floating-filter-input .ag-input-field-input');
	};

	toTitleCase(str) {
		return str.replace(/\w\S*/g, function (txt) {
			return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
		});
	}

	onGridCellClick = (event) => {
		if (event.column.colId === 'name') {
			const refsetId = event.data.refsetId;
			const versionDate = RefsetUtility.getVersionDateForRefsetApiCall(event.data);

			this.goToDetailsPage(refsetId, versionDate);
		}
	};

	navigateToPage(path) {
		this.router.navigate([path], { replaceUrl: false, skipLocationChange: false });
	}

	goToDetailsPage(refsetId, versionDate) {
		this.router.navigate(['/details', refsetId, versionDate], { replaceUrl: false, skipLocationChange: false });
	}

	getOrganizations(): void {
		this.refsetService.getOrganizations().subscribe((results) => {
			this.organizationList = results.items;
		});
	}

	getProjects(): void {
		this.refsetService.getProjects('offset=0&sort=name&sortAscending=true').subscribe((results) => {
			if (results.items != null && results.items.length > 1) {
				const sortedJson = results.items.sort((a, b) => {
					const orgA = a.edition.organization.name;
					const orgB = b.edition.organization.name;
					if (orgA < orgB) return -1;
					if (orgA > orgB) return 1;
					const projectA = a.name;
					const projectB = b.name;
					if (projectA < projectB) return -1;
					if (projectA > projectB) return 1;
					return 0;
				});
				this.projectList = sortedJson;
			} else {
				this.projectList = results.items;
			}
		});
	}

	getTeams(): void {
		this.refsetService.getTeams('includeMembers=false&onlyUsersTeams=true&hideOrganizationTeams=true&offset=0&sort=name&sortAscending=true').subscribe((results) => {
			if (results.items != null && results.items.length > 1) {
				const sortedJson = results.items.sort((a, b) => {
					const orgA = a.organization.name;
					const orgB = b.organization.name;
					if (orgA < orgB) return -1;
					if (orgA > orgB) return 1;
					const teamA = a.name;
					const teamB = b.name;
					if (teamA < teamB) return -1;
					if (teamA > teamB) return 1;
					return 0;
				});
				this.teamList = sortedJson;
			} else {
				this.teamList = results.items;
			}
		});
	}
}
