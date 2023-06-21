import { Component, OnDestroy, OnInit, AfterViewInit, TemplateRef, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';
import { CategoryFilterComponent } from 'src/app/components/categoryFilter/category-filter.component';
import { OrganizationsService } from 'src/app/services/rest/organizations.service';
import { OrganizationsComponentService } from 'src/app/pages/organizations/organizations-component.service';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
	selector: 'organization-people',
	templateUrl: './people.component.html',
})
export class OrganizationPeopleComponent implements OnInit, OnDestroy {
	routerParamsSubscription: Subscription;
	routerEventSubscription: Subscription;
	frameworkComponents: any;
	data = [];
	defaultColDef = {};
	peopleList = [];
	selectedOrganization: any;
	organizationId: any;
	organizationList = [];
	organizationSubscription: Subscription;
	gridOptions: any;
	gridPaging = { pageSize: 10, pageSizeOptions: [10, 25, 50, 100], totalKnown: false, totalRows: null, manualStateRefresh: new Boolean(true) };
	gridParams: any;
	gridApi: any;
	gridColumnDefs = [];
	showLoadingSpinner = true;
	uiUtility = UiUtility;
	openedConfirmModal: any;
	selectedUser: any;
	currentURL: string;
	previouslyLoadedId: string;
	gridInterval: any;

	@ViewChild('peopleNameSection') peopleNameSection: TemplateRef<any>;
	@ViewChild('peopleTeamsSection') peopleTeamsSection: TemplateRef<any>;
	@ViewChild('confirmInactiveMemberModal') confirmInactiveMemberModal: NgbModal;

	constructor(
		private readonly titleService: Title,
		private readonly organizationsService: OrganizationsService,
		private readonly route: ActivatedRoute,
		private readonly router: Router,
		private readonly organizationsComponentService: OrganizationsComponentService,
		private readonly modalService: NgbModal
	) {
		document.body.scrollTop = 0;
	}

	ngOnInit(): void {
		this.titleService.setTitle('Reference Set Tool - Organizations - Users');

		this.routerParamsSubscription = this.route.params.subscribe((params) => {
			this.organizationId = params['organizationId'];
		});

		this.routerEventSubscription = this.router.events.subscribe((event) => {
			if (this.router.url.includes('users')) {
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
				'templateRenderer': TemplateRenderer,
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

		this.gridInterval = setInterval(() => {
			this.loadGridColumns();
			clearInterval(this.gridInterval);
		}, 5);
	}

	loadGridColumns() {
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

		this.data = [];
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
				this.peopleList = [];
				this.data = [];
				if (this.gridParams?.api) {
					this.onGridReady(this.gridParams);
				}
			}
		}
	}

	onGridReady = (params) => {
		this.gridParams = params;
		if (params?.api) {
			this.gridApi = params.api;
			this.gridApi.showLoadingOverlay();
			this.gridApi.setRowData(this.data);
		}
		this.getOrganizations();
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
		if (this.organizationId != this.previouslyLoadedId) {
			this.previouslyLoadedId = this.organizationId;

			this.showLoadingSpinner = true;
			this.organizationsService.getOrgUsers(this.organizationId, true).subscribe((results) => {
				this.data = results.items;
				this.showLoadingSpinner = false;
			});
		}
	}

	getOrganizations(): void {
		this.organizationSubscription = this.organizationsComponentService.getOrganizations().subscribe((results) => {
			this.organizationList = <any>results;

			for (const organization of this.organizationList) {
				if (this.organizationId === organization.id) {
					this.selectedOrganization = organization;
					this.selectOrganization();
					return;
				}
			}

			if (!this.organizationId) {
				this.getStoredOrganizationId();
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
