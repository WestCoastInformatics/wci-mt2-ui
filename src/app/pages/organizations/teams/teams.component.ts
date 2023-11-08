import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { TemplateRendererComponent } from 'src/app/components/cellRenderers/template.renderer';
import { CategoryFilterComponent } from 'src/app/components/categoryFilter/category-filter.component';
import { OrganizationsComponentService } from 'src/app/pages/organizations/organizations-component.service';

@Component({
	selector: 'organization-teams',
	templateUrl: './teams.component.html',
})
export class OrganizationTeamsComponent implements OnInit, OnDestroy {
	routerParamsSubscription: Subscription;
	routerEventSubscription: Subscription;
	data = [];
	defaultColDef = {};
	teamList = [];
	selectedOrganization: any;
	organizationId: string;
	organizationList: any;
	organizationSubscription: Subscription;
	editionId: string;
	showLoadingSpinner = false;
	gridParams: any;
	gridApi: any;
	gridColumnDefs = [];
	gridOptions: any;
	gridPaging = { pageSize: 10, pageSizeOptions: [10, 25, 50, 100], totalKnown: false, totalRows: null, manualStateRefresh: new Boolean(true) };
	currentURL: string;
	previouslyLoadedId: string;

	@ViewChild('descriptionSection') descriptionSection: TemplateRef<any>;
	@ViewChild('peopleSection') peopleSection: TemplateRef<any>;

	constructor(
		private readonly titleService: Title,
		private readonly refsetService: RefsetService,
		private readonly route: ActivatedRoute,
		private readonly router: Router,
		private readonly organizationsComponentService: OrganizationsComponentService
	) {
		document.body.scrollTop = 0;
	}

	ngOnInit(): void {
		this.titleService.setTitle('Reference Set Tool - Organizations');

		this.routerParamsSubscription = this.route.params.subscribe((params) => {
			this.organizationId = params['organizationId'];
		});

		this.routerEventSubscription = this.router.events.subscribe((event) => {
			if (this.router.url.includes('organizations') && this.router.url.includes('teams') && !this.router.url.includes('users')) {
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

		this.data = [];
		this.getOrganizations();
	}

	checkLocationPath(url) {
		if (this.currentURL != url) {
			this.currentURL = url;
			if (url.includes('organizations') || url.includes('organization')) {
				const parts = url.split('/');
				for (let p = 0; p < parts.length; p++) {
					if (parts[p].includes('organizations') || parts[p].includes('organization')) {
						if (parts[p + 1] != undefined) {
							this.organizationId = parts[p + 1];
						}
					}
				}
			}
			if (this.organizationId) {
				this.teamList = [];
				this.data = [];
				this.onGridReady(this.gridParams);
				this.getOrganizations();
			}
		}
	}

	get dataCount() {
		return this.data.length;
	}

	onGridReady = (params) => {
		this.gridParams = params;
		if (params?.api) {
			this.gridApi = params.api;
			this.gridApi.showLoadingOverlay();

			// BAC: are these here because the view children arn't ready yet in ngOnInit?
			this.gridColumnDefs[2].cellRendererParams = { template: this.descriptionSection };
			this.gridColumnDefs[5].cellRendererParams = { template: this.peopleSection };
			this.gridApi.setColumnDefs(this.gridColumnDefs);
		}
	};

	getTeams(): void {
		if (this.organizationId != this.previouslyLoadedId) {
			this.previouslyLoadedId = this.organizationId;
			let roles = [];
			if (this.organizationId) {
				let queryString = 'sort=name&sortAscending=true&includeMembers=true';
				if (this.selectedOrganization?.id) {
					queryString = queryString + '&query=organizationId:' + this.selectedOrganization.id;
				}
				this.refsetService.getTeams(queryString).subscribe((results) => {
					this.data = [];
					this.teamList = results.items?.filter((team) => team.organizationId === this.selectedOrganization?.id);

					for (const team of this.teamList) {
						roles = roles.concat(team.roles);
						this.data.push({
							id: team.id,
							name: team.name,
							description: team.description,
							role: team.roles.sort().join(', ').toLowerCase(),
							email: team.primaryContactEmail,
							members: team.members ? team.memberList.length : '0',
							memberList: team.memberList,
						});
					}

					roles = [...new Set(roles)].sort();
					this.gridApi.setRowData(this.data);
				});
			} else {
				this.data = [];
				this.gridApi.setRowData(this.data);
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
		this.organizationSubscription = this.organizationsComponentService.getOrganizations().subscribe((results) => {
			this.organizationList = <any>results;

			for (const organization of this.organizationList) {
				if (organization_id === organization.id) {
					this.selectedOrganization = organization;
					this.selectOrganization();
					return;
				}
			}
		});
	}

	selectOrganization(): void {
		this.setOrganizationData(this.selectedOrganization);
		this.organizationId = this.selectedOrganization.id;
	}

	setOrganizationData(organization: any) {
		this.organizationId = organization.id;
		this.selectedOrganization = organization;

		localStorage.setItem('selectedOrganizationId', JSON.stringify(this.selectedOrganization.id));

		this.getTeams();
	}

	getTeamsCount(data: any): number {
		if (data) {
			return data.teams.length;
		}
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

	getStoredOrganizationId(): void {
		if (localStorage.getItem('selectedOrganizationId')) {
			const storedOrganizationId = JSON.parse(localStorage.getItem('selectedOrganizationId'));

			for (const organization of this.organizationList) {
				if (organization.id == storedOrganizationId) {
					this.selectedOrganization = organization;
					this.selectOrganization();
					return;
				}
			}

			// if the stored organization ID doesn't match anything remove it
			localStorage.removeItem('selectedOrganizationId');
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
	}
}
