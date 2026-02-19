import { Component, OnInit, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CategoryFilterComponent } from 'src/app/components/categoryFilter/category-filter.component';
import { TemplateRendererComponent } from 'src/app/components/cellRenderers/template.renderer';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { ProjectsService } from 'src/app/services/rest/projects.service';
import { ProjectsComponentService } from 'src/app/pages/projects/projects-component.service';
import { User } from 'src/app/models/user';

@Component({
	standalone: false,
	selector: 'projects-teams',
	templateUrl: './teams.component.html',
	styleUrls: ['./teams.component.css'],
})
export class ProjectsTeamsComponent implements OnInit, OnDestroy {
	routerParamsSubscription: Subscription;
	routerEventSubscription: Subscription;
	user: User;
	projectId: any;
	selectedProject: any;
	editionId: string;
	organizationId: string;
	organizationList: any[] = [];
	selectedOrganization: any;
	organizationSubscription: Subscription;
	gridApi: any;
	gridColumnDefs = [];
	gridOptions: any;
	gridPaging = {
		pageSize: 10,
		pageSizeOptions: [10, 25, 50, 100],
		totalKnown: false,
		totalRows: null,
		manualStateRefresh: new Boolean(true),
	};
	teamData: any;
	showLoadingSpinner = false;
	currentURL: string;
	originalGridParams: any;
	numberOfTeams = 0;
	uiUtility = UiUtility;

	@ViewChild('descriptionSection') descriptionSection: TemplateRef<any>;
	@ViewChild('peopleSection') peopleSection: TemplateRef<any>;

	constructor(
		protected readonly router: Router,
		protected readonly titleService: Title,
		protected readonly refsetService: RefsetService,
		protected readonly authService: AuthenticationService,
		protected readonly projectsComponentService: ProjectsComponentService,
		protected readonly route: ActivatedRoute,
		protected readonly projectsService: ProjectsService
	) {
		document.body.scrollTop = 0;
		refsetService.getTaxonomyRoot();
	}

	// ***** Framework Functions *****/
	ngOnInit() {
		this.titleService.setTitle('Reference Set Tool - Projects - Teams');
		this.user = this.authService.getUser();

		this.routerParamsSubscription = this.route.params.subscribe((params) => {
			this.organizationId = params['organizationId'];
			this.editionId = params['editionId'];
			this.projectId = params['projectId'];
		});

		this.routerEventSubscription = this.router.events.subscribe((event) => {
			if (this.router.url.includes('organization') && this.router.url.includes('edition') && this.router.url.includes('projects') && this.router.url.includes('teams')) {
				this.checkLocationPath(this.router.url);
			} else {
				this.ngOnDestroy();
			}
		});

		this.gridColumnDefs = [
			{ field: 'id', hide: true },
			{ field: 'name', tooltipField: 'name', headerName: 'Team Name', flex: 2, minWidth: 65, maxWidth: 500, unSortIcon: true, resizable: true },
			{
				field: 'description',
				tooltipField: 'description',
				headerName: 'Description',
				flex: 2,
				minWidth: 65,
				cellRenderer: 'templateRenderer',
				cellRendererParams: { template: this.descriptionSection },
				unSortIcon: true,
				resizable: true,
			},
			{
				field: 'role',
				tooltipField: 'role',
				headerName: 'Role',
				flex: 1,
				minWidth: 65,
				resizable: true,
				cellClass: 'text-capitalize',
				unSortIcon: true,
				filter: 'agTextColumnFilter',
				filterParams: {
					textCustomComparator: (filter, value, filterText) => {
						if (!value && filterText) {
							return false;
						}
						if (!filterText) {
							return true;
						}
						const filterTextLowerCase = filterText.toLowerCase();
						return (
							value
								.split(',')
								.map((role) => role.trim().toLowerCase())
								.filter((role) => role === filterTextLowerCase).length > 0
						);
					},
				},
				floatingFilterComponent: 'categoryFilterComponent',
				floatingFilterComponentParams: {
					suppressMenu: true,
					suppressFilterButton: true,
					names: [
						{
							'type': 'role',
							'name': 'Admin',
							'value': 'Admin',
						},
						{
							'type': 'role',
							'name': 'Author',
							'value': 'Author',
						},
						{
							'type': 'role',
							'name': 'Reviewer',
							'value': 'Reviewer',
						},
						{
							'type': 'role',
							'name': 'Viewer',
							'value': 'Viewer',
						},
					],
				},
			},
			{ field: 'email', tooltipField: 'email', headerName: 'Contact Email', flex: 2, minWidth: 65, resizable: true, unSortIcon: true },
			{
				field: 'members',
				headerName: 'Users',
				minWidth: 65,
				filter: false,
				resizable: false,
				sortable: false,
				cellRenderer: 'templateRenderer',
				cellRendererParams: { template: this.peopleSection },
				tooltipValueGetter: (params) => {
					return params?.data?.memberList ? 'Team Users:\n' + params.data.memberList.map((member) => member.name).join(', \n') : 'No Team Users';
				},
			},
		];

		this.gridOptions = {
			context: { componentParent: this },
			pagination: false,
			suppressColumnVirtualisation: false, // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
			suppressPaginationPanel: true,
			paginationPageSize: this.gridPaging.pageSize,
			rowSelection: 'single',
			enableCellTextSelection: true,
			onGridReady: this.onGridReady,
			onCellClicked: this.onGridCellClick,
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
				floatingFilterComponentParams: { placeholder: '', suppressFilterButton: false, suppressAndOrCondition: true },
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

		this.teamData = [];
		this.getOrganizations();
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
				if (parts[p].includes('edition')) {
					if (parts[p + 1] != undefined) {
						this.editionId = parts[p + 1];
					}
				}
				if (parts[p].includes('projects')) {
					if (parts[p + 1] != undefined) {
						this.projectId = parts[p + 1];
					}
				}
			}
			if (this.organizationId) {
				this.getOrganizations();
			}
		}
	}

	onGridCellClick = (event) => {
		const selectedRows = this.gridApi.getSelectedRows();
		let selectedId: string;

		selectedRows.forEach(function (selectedRow, index) {
			selectedId = selectedRow.id;
		});

		this.router.navigate(['/organization/' + this.organizationId + '/teams/' + selectedId + '/users'], { replaceUrl: false, skipLocationChange: false });
	};

	getOrganizations(): void {
		const organization_id = this.organizationId;
		this.organizationSubscription = this.projectsComponentService.getOrganizations().subscribe((results) => {
			this.organizationList = <any>results;

			for (const organization of this.organizationList) {
				if (organization_id == organization.id) {
					this.selectedOrganization = organization;
					this.showTeamsData();
					return;
				}
			}
		});
	}

	showTeamsData() {
		if (this.originalGridParams) {
			this.onGridReady(this.originalGridParams);
		}
	}

	onGridReady = (gridReadyParams) => {
		if (!this.projectId || this.projectId == '0') {
			return;
		}
		this.originalGridParams = gridReadyParams;
		this.gridApi = gridReadyParams.api;

		this.projectsService.getProjectTeams(this.projectId).subscribe(
			(results) => {
				this.teamData = [];
				this.numberOfTeams = 0;

				for (const team of results.items) {
					this.teamData.push({
						id: team.id,
						name: team.name,
						description: team.description,
						role: team.roles.sort().join(', ').toLowerCase(),
						email: team.primaryContactEmail,
						members: team.members ? team.members.length : '0',
						memberList: team.memberList,
					});
				}

				this.numberOfTeams = this.teamData.length;
				this.gridApi.setGridOption('rowData', this.teamData);
			},
			(err) => {
				console.error(err);
				this.teamData = [];
				this.numberOfTeams = 0;
				this.gridApi.setGridOption('rowData', this.teamData);
			}
		);

		this.gridColumnDefs[2].cellRendererParams = { template: this.descriptionSection };
		this.gridColumnDefs[5].cellRendererParams = { template: this.peopleSection };
		this.gridApi.setColumnDefs(this.gridColumnDefs);
	};

	ngOnDestroy() {
		if (this.routerParamsSubscription) {
			this.routerParamsSubscription.unsubscribe();
		}
		if (this.routerEventSubscription) {
			this.routerEventSubscription.unsubscribe();
		}
	}
}
