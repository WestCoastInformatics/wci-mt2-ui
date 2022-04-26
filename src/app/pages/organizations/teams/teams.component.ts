import { AfterViewInit, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { OrganizationsService } from 'src/app/services/rest/organizations.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';
import { CategoryFilterComponent } from 'src/app/components/categoryFilter/category-filter.component';

@Component({
	selector: 'organization-teams',
	templateUrl: './teams.component.html'
})
export class OrganizationTeamsComponent implements OnInit, AfterViewInit {
	menu: SidebarMenuItem[] = [
		{ name: 'Projects', link: '/organizations/projects', icon: 'fa fa-folder-open' },
		{ name: 'Teams', link: '/organizations/teams', icon: 'fa fa-users', isActive: true },
		{ name: 'People', link: '/organizations/people', icon: 'fa fa-user' },
		{ name: 'Configuration', link: '/organizations/configuration', icon: 'fa fa-cogs' }
	];

	data = [];
	defaultColDef = {};
	teamList = [];
	selectedOrganization: any;
	id: any;
	organizationList: any;
	gridParams: any;
	gridApi: any;
	gridColumnDefs = [];
	gridOptions: any;
	gridPaging = { pageSize: 10, pageSizeOptions: [10, 25, 50, 100], totalKnown: false, totalRows: null, manualStateRefresh: new Boolean(true) };

	@ViewChild('descriptionSection') descriptionSection: TemplateRef<any>;

	constructor(private readonly breadcrumbService: BreadcrumbService,
		private readonly titleService: Title,
		private readonly refsetService: RefsetService,
		private readonly organizationsService: OrganizationsService,
		private readonly route: ActivatedRoute,
		private readonly router: Router) { }

	ngOnInit(): void {
		this.titleService.setTitle('Refset Tool - Organizations');
		this.breadcrumbService.setBreadcrumbs([
			{ path: '/organizations/teams', label: 'Organizations' },
			{ label: 'Teams' },
		]);

		this.gridColumnDefs = [
			{ field: 'id', hide: true },
			{ field: 'name', headerName: 'Team Name', flex: 1, minWidth: 200, maxWidth: 500 },
			{ field: 'description', headerName: 'Description', flex: 1, minWidth: 200, maxWidth: 500, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.descriptionSection } },
			{
				field: 'role', headerName: 'Role', flex: 1, minWidth: 250, maxWidth: 350, cellClass: 'text-camel',
				filter: 'agTextColumnFilter',
				filterParams: {
					textCustomComparator: (filter, value, filterText) => {
						if(!value && filterText) return false;
						if(!filterText) return true;
						const filterTextLowerCase = filterText.toLowerCase();
						return value.split(',').map((role) => role.trim().toLowerCase()).filter((role) => role === filterTextLowerCase).length > 0;
					}
				},
				floatingFilterComponent: 'categoryFilterComponent', floatingFilterComponentParams: {
					suppressMenu: true, suppressFilterButton: true, names: [
						{
							"type": "role",
							"name": "Admin",
							"value": "Admin"
						},
						{
							"type": "role",
							"name": "Author",
							"value": "Author"
						},
						{
							"type": "role",
							"name": "Reviewer",
							"value": "Reviewer"
						},
						{
							"type": "role",
							"name": "Viewer",
							"value": "Viewer"
						}
					],
				}
			},
			{ field: 'email', headerName: 'Contact Email', minWidth: 250, resizable: false },
			{ field: 'members', headerName: 'Members', minWidth: 100, filter: false ,resizable: false, sortable: false, cellClass: 'text-primary font-weight-bold' }
		];

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
				'templateRenderer': TemplateRenderer,
				'categoryFilterComponent': CategoryFilterComponent,
			},
			defaultColDef: {
				sortable: true,
				resizable: true,
				suppressMenu: true,
				filter: true,
				floatingFilter: true,
				floatingFilterComponentParams: { placeholder: '', suppressFilterButton: true },
				unSortIcon: true
			},
			enableBrowserTooltips: true,
			rowClassRules: {
				refset_tool_grid_inactive_row: function (params) {

					var inactivatedRow = false;

					if (params.data) {
						inactivatedRow = params.data.active == false;
					}

					return inactivatedRow;
				},
			},
		};

		this.data = [];

		this.route.params.subscribe(params => {
			this.id = params['id'];
		});
		this.getOrganization();
		this.getOrganizations();
		this.getTeams();
	}

	ngAfterViewInit() {
	}

	get dataCount() {
		return this.data.length;
	}

	onGridReady = (params) => {
		this.gridParams = params;
		this.gridApi = params.api;
		this.gridColumnDefs[2].cellRendererParams = { template: this.descriptionSection };
		this.gridApi.setColumnDefs(this.gridColumnDefs);
	}

	getTeams(): void {
		this.data = [];
		let roles = [];
		this.refsetService.getTeams('limit=500&offset=0&sort=name&sortAscending=true').subscribe((results) => {
			this.teamList = results.items;
			for (let team of this.teamList) {
				if (team?.organization?.id === this.selectedOrganization?.id) {
					roles = roles.concat(team.roles);
					this.data.push({ id: team.id, name: team.name, description: team.description, role: team.roles.sort().join(', ').toLowerCase(), email: team.primaryContactEmail, members: team.members ? team.members.length : '0' + 'Members' });
				}
			}
			roles = [...new Set(roles)].sort();
			this.gridApi.setRowData(this.data.slice(0, 10));
		});
	}

	getOrganizations(): void {
		this.refsetService.getOrganizations().subscribe((results) => {
			this.organizationList = results.items;
		});
	}

	getOrganization(): void {
		this.organizationsService.getOrganization(this.id).subscribe((result) => {
			this.selectedOrganization = result;
		});
	}

	selectOrg($event): void {
		this.router.navigate(['/organizations/teams', $event['value'].id]);
		this.onGridReady(this.gridParams);
	}

	onGridCellClick = (event) => {
		if (event.column.colId !== 'description') {
			let selectedRows = this.gridApi.getSelectedRows();
			let selectedId: string;

			selectedRows.forEach(function (selectedRow, index) {

				selectedId = selectedRow.id;
			});

			this.router.navigate(['/teams/people', selectedId]);
		}
	};
}
