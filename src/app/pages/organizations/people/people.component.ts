import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryFilterComponent } from 'src/app/components/categoryFilter/category-filter.component';
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { OrganizationsService } from 'src/app/services/rest/organizations.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { TeamsService } from 'src/app/services/rest/teams.service';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
	selector: 'organization-people',
	templateUrl: './people.component.html',
})
export class OrganizationPeopleComponent implements OnInit {
	menu: SidebarMenuItem[] = [];
	data = [];
	showTable = false;
	defaultColDef = {};
	peopleList = [];
	selectedOrganization: any;
	organizationId: any;
	organizationList = [];
	gridOptions: any;
	gridPaging = { pageSize: 10, pageSizeOptions: [10, 25, 50, 100], totalKnown: false, totalRows: null, manualStateRefresh: new Boolean(true) };
	gridParams: any;
	gridApi: any;
	gridColumnDefs = [];
	showLoadingSpinner = true;
	uiUtility = UiUtility;
	openedConfirmModal: any;
	selectedUser: any;

	@ViewChild('peopleNameSection') peopleNameSection: TemplateRef<any>;
	@ViewChild('peopleTeamsSection') peopleTeamsSection: TemplateRef<any>;
	@ViewChild('confirmInactiveMemberModal') confirmInactiveMemberModal: NgbModal;

	constructor(
		private readonly breadcrumbService: BreadcrumbService,
		private readonly titleService: Title,
		private readonly refsetService: RefsetService,
		private readonly organizationsService: OrganizationsService,
		private readonly route: ActivatedRoute,
		private readonly router: Router,
		private readonly teamService: TeamsService,
		private readonly modalService: NgbModal,
		private location: Location
	) {
		document.body.scrollTop = 0;
	}

	ngOnInit(): void {
		this.titleService.setTitle('Reference Set Tool - Organizations - Users');

		this.route.params.subscribe((params) => {
			this.organizationId = params['organizationId'];
			this.setNavigation();
		});

		this.getOrganizations();
	}

	ngAfterViewInit() {
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
		};

		this.data = [];
	}

	setNavigation() {
		this.breadcrumbService.setBreadcrumbs([{ path: '/dashboard', label: 'Dashboard' }, { label: this.selectedOrganization?.name ? this.selectedOrganization?.name + ' / Users' : '' }]);

		this.menu = [
			{ name: 'Projects', link: '/organizations/' + this.organizationId + '/edition/0/projects', icon: 'fa fa-folder-open' },
			{ name: 'Teams', link: '/organizations/' + this.organizationId + '/teams', icon: 'fa fa-users' },
			{ name: 'Users', link: '/organizations/' + this.organizationId + '/people', icon: 'fa fa-user', isActive: true },
		];

		const configShowing = this.menu[this.menu.length - 1].name == 'Configuration';

		if (!configShowing && this.selectedOrganization && this.selectedOrganization.roles.includes('ADMIN')) {
			this.menu.push({ name: 'Configuration', link: '/organizations/' + this.organizationId + '/configuration', icon: 'fa fa-cogs' });
		}

		this.location.replaceState('organizations/' + this.organizationId + '/people');
	}

	onGridReady = (params) => {
		this.gridParams = params;
		this.gridApi = params.api;
		this.gridApi.setRowData(this.data);
	};

	onGridCellClick = (event) => {
		// Skip clicks on action column
		if (event.column.colId == 'id') {
			return;
		}

		const selectedRows = this.gridApi.getSelectedRows();
		const router = this.router;
		selectedRows.forEach(function (selectedRow, index) {
			router.navigate(['/personal/' + selectedRow.id + '/landing']);
			return;
		});
	};

	get dataCount() {
		return this.data.length;
	}

	getPeople(): void {
		this.showLoadingSpinner = true;
		this.organizationsService.getOrgUsers(this.organizationId, true).subscribe((results) => {
			this.data = results.items;
			this.showTable = true;
			this.showLoadingSpinner = false;
		});
	}

	getOrganizations(): void {
		this.refsetService.getOrganizations().subscribe((results) => {
			this.organizationList = results.items;

			for (const organization of this.organizationList) {
				if (this.organizationId === organization.id) {
					this.setOrganizationData(organization);
					return;
				}
			}

			this.getStoredOrganizationId();

			if (!this.selectedOrganization) {
				this.showLoadingSpinner = false;
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

		this.setNavigation();
		this.getPeople();
	}

	confirmRemoveUser(user, event) {
		this.selectedUser = user;
		this.openedConfirmModal = this.modalService.open(this.confirmInactiveMemberModal, { centered: true });
		event.stopPropagation();
	}

	removeUser() {
		this.organizationsService.removeUser(this.organizationId, this.selectedUser.id).subscribe({
			next: (data) => {
				const datum = data;
			},
			complete: () => window.location.reload(),
		});
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
}
