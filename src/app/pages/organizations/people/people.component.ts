import { Component, ElementRef, OnInit, QueryList, TemplateRef, ViewChild, ViewChildren } from '@angular/core';
import { Location } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { CategoryFilterComponent } from 'src/app/components/categoryFilter/category-filter.component';
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';
import { CustomTooltipComponent } from 'src/app/components/custom-tooltip/custom-tooltip.component';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { OrganizationsService } from 'src/app/services/rest/organizations.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { TeamsService } from 'src/app/services/rest/teams.service';
import { UiUtility } from 'src/app/utilities/ui.utility';

@Component({
	selector: 'organization-people',
	templateUrl: './people.component.html'
})
export class OrganizationPeopleComponent implements OnInit {

	menu: SidebarMenuItem[] = [
		{ name: 'Projects', link: '/organizations/projects', icon: 'fa fa-folder-open' },
		{ name: 'Teams', link: '/organizations/teams', icon: 'fa fa-users' },
		{ name: 'People', link: '/organizations/people', icon: 'fa fa-user', isActive: true },
		{ name: 'Configuration', link: '/organizations/configuration', icon: 'fa fa-cogs' }
	];
	data = [];
	defaultColDef = {};
	peopleList = [];
	selectedOrganization: any;
	id: any;
	organizationList = [];
	gridOptions: any;
	gridPaging = { pageSize: 10, pageSizeOptions: [10, 25, 50, 100], totalKnown: false, totalRows: null, manualStateRefresh: new Boolean(true) };
	gridParams: any;
	gridApi: any;
	gridColumnDefs = [];
	showLoadingSpinner = true;
	uiUtility = UiUtility;

	@ViewChild('peopleNameSection') peopleNameSection: TemplateRef<any>;

	constructor(private readonly breadcrumbService: BreadcrumbService,
		private readonly titleService: Title,
		private readonly refsetService: RefsetService,
		private readonly organizationsService: OrganizationsService,
		private readonly route: ActivatedRoute,
		private readonly router: Router,
		private readonly teamService: TeamsService,
		private location: Location) { }

	ngOnInit(): void {

		this.titleService.setTitle('Refset Tool - Organizations');
		this.breadcrumbService.setBreadcrumbs([
			{ path: '/organizations/people', label: 'Organizations' },
			{ label: 'People' },
		]);

		this.route.params.subscribe(params => {
			this.id = params['id'];
		});

		this.gridColumnDefs = [
			{ field: 'name', headerName: 'Members', minWidth: 300, flex: 1, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.peopleNameSection } },
			{ field: 'company', flex: 1, headerName: 'Company Name' },
			{ field: 'email', flex: 1, headerName: 'Email' },
			{ field: 'teams', tooltipComponentFramework: CustomTooltipComponent, tooltipField: 'teams', tooltipComponentParams: { color: '#ececec' }, flex: 1, headerName: 'Teams', filter: false, sortable: false, cellRenderer: params => {
				return `<span class="text-primary font-weight-bold">${this.getTeamCount(params.data.teams)} teams</span>`;
			  } }
		];

		this.getOrganizations();

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
				templateRenderer: TemplateRenderer,
				'categoryFilterComponent': CategoryFilterComponent
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

	onGridReady = (params) => {

		this.gridParams = params;
		this.gridApi = params.api;
		this.getPeople();
	}

	onGridCellClick = (event) => {

		let selectedRows = this.gridApi.getSelectedRows();
		let selectedId: string;

		selectedRows.forEach(function (selectedRow, index) {

			selectedId = selectedRow.id;
		});

		this.router.navigate(['/teams/people', selectedId]);
	};

	get dataCount() {
		return this.data.length;
	}

	getPeople(): void {

		this.showLoadingSpinner = true;
		this.organizationsService.getOrgUsers(this.id, true).subscribe((results) => {

			this.data = results.items;
			this.gridApi.setRowData(results.items);
			this.showLoadingSpinner = false;
		});
	}

	getOrganizations(): void {

		this.refsetService.getOrganizations().subscribe((results) => {

			this.organizationList = results.items;

			for (let organization of this.organizationList) {

				if (this.id == organization.id) {
					this.setOrganizationData(organization);
				}
			}
		});
	}

	selectOrg($event): void {

		this.setOrganizationData(this.selectedOrganization);
		this.location.replaceState("/organizations/people/" + this.selectedOrganization.id);
	}

	setOrganizationData(organization: any) { 

		this.id = organization.id;
		this.selectedOrganization = organization;
		
		this.onGridReady(this.gridParams);
	}

	async getTeams(teams: any): Promise<any> {
		console.log(teams)
		const teamObject = { teams: [] };
		if (teams === 'undefined' || teams === undefined) {
			return JSON.stringify(teamObject);
		} else {
			for (let team of teams) {
				teamObject.teams.push(await lastValueFrom(this.teamService.getTeam(team)));
			}
			return JSON.stringify(teamObject);
		}
	}

	getTeamCount(teams: any): number {

		return teams.length;
	}
}
