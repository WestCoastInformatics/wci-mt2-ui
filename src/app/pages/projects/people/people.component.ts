import { ChangeDetectorRef, Component, OnInit, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CategoryFilterComponent } from 'src/app/components/categoryFilter/category-filter.component';
import { TemplateRendererComponent } from 'src/app/components/cellRenderers/template.renderer';
import { ProjectsComponentService } from 'src/app/pages/projects/projects-component.service';
import { UiUtility } from 'src/app/utilities/ui.utility';

@Component({
	standalone: false,
	selector: 'projects-people',
	templateUrl: './people.component.html',
	styleUrls: ['./people.component.scss'],
})
export class ProjectsPeopleComponent implements OnInit, OnDestroy {
	routerParamsSubscription: Subscription;
	routerEventSubscription: Subscription;
	data = [];
	organizationId: string;
	organizationList: any[] = [];
	selectedOrganization: any;
	organizationSubscription: Subscription;
	peopleList: any[] = [];
	selectedProject: any;
	projectId: any;
	projectList = [];
	projectSubscription: Subscription;
	gridOptions: any;
	gridPaging = { pageSize: 10, pageSizeOptions: [10, 25, 50, 100], totalKnown: false, totalRows: null, manualStateRefresh: true };
	gridParams: any;
	gridApi: any;
	gridColumnDefs = [];
	uiUtility = UiUtility;
	showLoadingSpinner = false;
	currentURL: string;
	gridInterval: any;

	@ViewChild('peopleNameSection') peopleNameSection: TemplateRef<any>;
	@ViewChild('peopleTeamsSection') peopleTeamsSection: TemplateRef<any>;

	constructor(
		private readonly titleService: Title,
		private readonly projectsComponentService: ProjectsComponentService,
		private readonly route: ActivatedRoute,
		private readonly changeDetectorRef: ChangeDetectorRef,
		private readonly router: Router
	) {
		document.body.scrollTop = 0;
	}

	get dataCount() {
		return this.data.length;
	}

	ngOnInit(): void {
		this.titleService.setTitle('Reference Set Tool - Projects - Users');

		this.routerParamsSubscription = this.route.params.subscribe((params) => {
			this.organizationId = params['organizationId'];
			this.projectId = params['projectId'];
			this.data = [];
			this.getOrganizations();
		});

		this.routerEventSubscription = this.router.events.subscribe((event) => {
			if (this.router.url.includes('organization') && this.router.url.includes('edition') && this.router.url.includes('projects') && this.router.url.includes('users')) {
				this.checkLocationPath(this.router.url);
			} else {
				this.ngOnDestroy();
			}
		});

		this.gridOptions = {
			context: { componentParent: this },
			pagination: false,
			suppressColumnVirtualisation: false, // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
			suppressPaginationPanel: true,
			paginationPageSize: this.gridPaging.pageSize,
			rowSelection: 'single',
			enableCellTextSelection: true,
			onCellClicked: this.onGridCellClick,
			onGridReady: this.onGridReady,
			frameworkComponents: {
				'templateRenderer': TemplateRendererComponent,
				'categoryFilterComponent': CategoryFilterComponent,
			},
			defaultColDef: {
				sortable: true,
				resizable: true,
				suppressMenu: true,
				filter: true,
				floatingFilter: true,
				floatingFilterComponentParams: { placeholder: '', suppressFilterButton: true },
				unSortIcon: true,
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

		this.gridInterval = setInterval(() => {
			this.loadGridColumns();
			clearInterval(this.gridInterval);
		}, 5);
	}

	loadGridColumns(): void {
		this.gridColumnDefs = [
			{
				field: 'name',
				tooltipField: 'name',
				headerName: 'User',
				minWidth: 65,
				flex: 2,
				cellRenderer: 'templateRenderer',
				cellRendererParams: { template: this.peopleNameSection },
				unSortIcon: true,
				resizable: true,
			},
			{ field: 'company', tooltipField: 'company', minWidth: 65, flex: 2, headerName: 'Company Name', unSortIcon: true, resizable: true },
			{ field: 'email', tooltipField: 'email', minWidth: 65, flex: 2, headerName: 'Email', unSortIcon: true, resizable: true },
			{
				field: 'teams',
				flex: 1,
				headerName: 'Teams',
				filter: false,
				sortable: false,
				cellRenderer: 'templateRenderer',
				cellRendererParams: { template: this.peopleTeamsSection },
				minWidth: 65,
				resizable: false,
			},
		];
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
				this.resetProjectData();
				this.getOrganizations();
			}
		}
	}

	resetProjectData(): void {
		if (this.gridApi) {
			this.gridApi.showLoadingOverlay();
		}
		this.selectedProject = null;
		this.projectList = [];
		this.data = [];
	}

	onGridReady = (params) => {
		this.gridParams = params;
		this.gridApi = params.api;
	};

	onGridCellClick = (event) => {
		const selectedRows = this.gridApi.getSelectedRows();
		const router = this.router;
		selectedRows.forEach(function (selectedRow, index) {
			router.navigate(['/personal/' + selectedRow.id + '/landing'], { replaceUrl: false, skipLocationChange: false });
			return;
		});
	};

	clickTeams = (event) => {
		//if (event.column.colId === 'name') {
		this.router.navigate(['organizations', this.organizationId, 'teams'], { replaceUrl: false, skipLocationChange: false });
		event.stopPropagation();
		//}
	};

	getOrganizations(): void {
		const organization_id = this.organizationId;
		this.organizationSubscription = this.projectsComponentService.getOrganizations().subscribe((results) => {
			this.organizationList = <any>results;

			for (const organization of this.organizationList) {
				if (organization_id == organization.id) {
					this.selectedOrganization = organization;
					if (this.projectId != '0') {
						this.getProjects();
					}
					return;
				}
			}
		});
	}

	getProjects(): void {
		const project_id = this.projectId;
		this.projectSubscription = this.projectsComponentService.getProjects().subscribe((results) => {
			this.projectList = <any>results;

			for (const project of this.projectList) {
				if (project_id == project.id) {
					this.selectedProject = project;
					this.showProjectData();
					return;
				}
			}
		});
	}

	showProjectData(): void {
		this.data = this.selectedProject.memberList;
	}

	getTeamCount(teams: any): number {
		return teams.length;
	}

	getTeamsTitle(data: any): string {
		if (data) {
			if (data.teams) {
				return 'User Teams:\n' + data?.teams.map((t) => t.name).join(', \n');
			} else {
				return 'No User Teams';
			}
		}
	}

	ngOnDestroy() {
		if (this.routerParamsSubscription) {
			this.routerParamsSubscription.unsubscribe();
		}
		if (this.routerEventSubscription) {
			this.routerEventSubscription.unsubscribe();
		}
		if (this.organizationSubscription) {
			this.organizationSubscription.unsubscribe();
		}
		if (this.projectSubscription) {
			this.projectSubscription.unsubscribe();
		}
	}
}
