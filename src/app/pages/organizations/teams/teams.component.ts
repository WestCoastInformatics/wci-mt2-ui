import { AfterViewInit, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { OrganizationsService } from 'src/app/services/rest/organizations.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';
import { CategoryFilterComponent } from 'src/app/components/categoryFilter/category-filter.component';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';

@Component({
	selector: 'organization-teams',
	templateUrl: './teams.component.html'
})
export class OrganizationTeamsComponent implements OnInit, AfterViewInit {
	menu: SidebarMenuItem[] = [
		{ name: 'Projects', link: '/organizations/projects', icon: 'fa fa-folder-open' },
		{ name: 'Teams', link: '/organizations/teams', icon: 'fa fa-users', isActive: true },
		{ name: 'People', link: '/organizations/people', icon: 'fa fa-user' },
	];

	data = [];
	defaultColDef = {};
	teamList = [];
	selectedOrganization: any;
	organizationId: string;
	organizationList: any;
	showLoadingSpinner = true;
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
		private readonly router: Router,
		private authenticationService: AuthenticationService,
		private location: Location) { 
			if(authenticationService.isAdmin()){
				this.menu.push({ name: 'Configuration', link: '/organizations/configuration', icon: 'fa fa-cogs' });
			}
		}

	ngOnInit(): void {
		this.titleService.setTitle('Refset Tool - Organizations');

		this.breadcrumbService.setBreadcrumbs([
			{ path: '/organizations/teams', label: 'Organizations' },
			{ label: 'Teams' },
		]);

		this.route.params.subscribe(params => {
			this.organizationId = params['id'];
		});

		this.getOrganizations();

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
		this.getTeams();
	}

	getTeams(): void {
		let roles = [];
		if(this.selectedOrganization?.id){
			this.showLoadingSpinner = true;
			this.refsetService.getTeams('limit=500&offset=0&sort=name&sortAscending=true').subscribe((results) => {
				this.data = [];
				this.teamList = results.items;
				for (let team of this.teamList) {
					if (team?.organization?.id === this.selectedOrganization?.id) {
						roles = roles.concat(team.roles);
						this.data.push({ id: team.id, name: team.name, description: team.description, role: team.roles.sort().join(', ').toLowerCase(), email: team.primaryContactEmail, members: team.members ? team.members.length : '0' + 'Members' });
					}
				}
				roles = [...new Set(roles)].sort();
				this.gridApi.setRowData(this.data);
				this.showLoadingSpinner = false;
			});
		}else{
			this.data = [];
			this.gridApi.setRowData(this.data);
			this.showLoadingSpinner = false;
		}
	}

	getOrganizations(): void {

		this.refsetService.getOrganizations().subscribe((results) => {

			this.organizationList = results.items;

			for (let organization of this.organizationList) {

				if (this.organizationId == organization.id) {
					this.setOrganizationData(organization);
				}
			}
		});
	}

	selectOrg($event): void {

		this.setOrganizationData(this.selectedOrganization);
		this.location.replaceState("/organizations/teams/" + this.selectedOrganization.id);
	}

	setOrganizationData(organization: any) { 

		this.organizationId = organization.id;
		this.selectedOrganization = organization;
		
		this.onGridReady(this.gridParams);
	}

	onGridCellClick = (event) => {
		if (event.column.colId !== 'description') {
			let selectedRows = this.gridApi.getSelectedRows();
			let selectedId: string;

			selectedRows.forEach(function (selectedRow, index) {

				selectedId = selectedRow.id;
			});

			this.router.navigate(['/organization/' + this.organizationId + '/teams/people', selectedId]);
		}
	};
}
