import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CategoryFilterComponent } from 'src/app/components/categoryFilter/category-filter.component';
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { TeamsService } from 'src/app/services/rest/teams.service';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OrganizationsService } from 'src/app/services/rest/organizations.service';
import { TeamsComponentService } from 'src/app/pages/teams/teams-component.service';

@Component({
	selector: 'teams-people',
	templateUrl: './people.component.html',
})
export class TeamsPeopleComponent implements OnInit, OnDestroy {
	routerParamsSubscription: Subscription;
	routerEventSubscription: Subscription;
	data = [];
	defaultColDef = {};
	selectedTeam: any;
	teamId: any;
	teamList = [];
	userList: any;
	currentUser: any;
	gridOptions: any;
	gridPaging = { pageSize: 10, pageSizeOptions: [10, 25, 50, 100], totalKnown: false, totalRows: null, manualStateRefresh: true };
	gridParams: any;
	gridApi: any;
	gridColumnDefs = [];
	peopleList = [];
	teamsSubscription: Subscription;
	showTable = false;
	organizationId: string;
	selectedOrganization: any;
	showLoadingSpinner = false;
	uiUtility = UiUtility;
	openedConfirmModal: any;
	selectedUser: any;
	currentURL: string;
	gridInterval: any;

	@ViewChild('peopleNameSection') peopleNameSection: TemplateRef<any>;
	@ViewChild('peopleTeamsSection') peopleTeamsSection: TemplateRef<any>;
	@ViewChild('confirmInactiveMemberModal') confirmInactiveMemberModal: NgbModal;

	constructor(
		private readonly titleService: Title,
		private readonly route: ActivatedRoute,
		private readonly router: Router,
		private readonly authService: AuthenticationService,
		private readonly teamsService: TeamsService,
		private readonly modalService: NgbModal,
		private readonly organizationsService: OrganizationsService,
		private readonly teamsComponentService: TeamsComponentService
	) {
		document.body.scrollTop = 0;
	}

	ngOnInit(): void {
		this.titleService.setTitle('Reference Set Tool - Teams - Users');
		this.currentUser = this.authService.getUser();

		this.routerParamsSubscription = this.route.params.subscribe((params) => {
			this.organizationId = params['organizationId'];
			this.teamId = params['teamId'];
		});

		this.routerEventSubscription = this.router.events.subscribe((event) => {
			if (this.router.url.includes('organization') && this.router.url.includes('teams') && this.router.url.includes('users')) {
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
				templateRenderer: TemplateRenderer,
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
		this.selectedTeam = null;
		this.getOrganizations();
		this.getTeams();
		this.getAvailableOrganizationUsers(this.organizationId);
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
				if (parts[p].includes('teams')) {
					if (parts[p + 1] != undefined) {
						this.teamId = parts[p + 1];
					}
				}
			}
			if (this.organizationId) {
				if (this.gridApi) {
					this.gridApi.showLoadingOverlay();
				}
				this.data = [];
				this.selectedTeam = null;

				this.getTeams();
			}
		}
	}

	getOrganizations(): void {
		let organizationList = [];
		this.teamsSubscription = this.teamsComponentService.getOrganizations().subscribe((results) => {
			organizationList = <any>results;
			for (const organization of organizationList) {
				if (this.organizationId === organization.id) {
					this.selectedOrganization = organization;
					return;
				}
			}
		});
	}

	getTeams(): void {
		this.teamsSubscription = this.teamsComponentService.getTeams().subscribe((results) => {
			this.teamList = <any>results;
			this.showLoadingSpinner = false;
			this.showTable = true;

			for (const team of this.teamList) {
				if (this.teamId == team.id) {
					this.selectedTeam = team;
					this.showTeamMembers();
					return;
				}
			}
			if (!this.selectedTeam) {
				if (this.teamList && this.teamList.length > 0) {
					this.selectedTeam = this.teamList[0];
					this.showTeamMembers();
				}
			}
		});
	}

	getAvailableOrganizationUsers(organizationId: string): void {
		this.userList = [];
		this.organizationsService.getOrgUsers(organizationId, false).subscribe({
			next: (results) => {
				this.userList = results?.items.filter((teamMember) => !this.data.filter((orgMember) => teamMember.id === orgMember.id).length);
				this.userList.sort((a, b) => (a.email > b.email ? 1 : -1));
			},
		});
	}

	showTeamMembers() {
		this.data = this.selectedTeam.memberList;
	}

	onGridReady = (params) => {
		this.gridParams = params;
		this.gridApi = params.api;
	};

	onGridCellClick = (event) => {
		// Skip clicks on action column
		if (event.column.colId == 'id') {
			return;
		}

		const selectedRows = this.gridApi.getSelectedRows();
		const router = this.router;
		selectedRows.forEach(function (selectedRow) {
			router.navigate(['/personal/' + selectedRow.id + '/landing']);
			return;
		});
	};

	get dataCount() {
		if (this.data) {
			return this.data.length;
		} else {
			return 0;
		}
	}

	confirmRemoveUser(user, event) {
		this.selectedUser = user;
		this.openedConfirmModal = this.modalService.open(this.confirmInactiveMemberModal, { centered: true });
		event.stopPropagation();
	}

	removeUser() {
		this.teamsService.removeUser(this.teamId, this.selectedUser.id).subscribe({
			next: (data) => {
				console.log(data);
			},
			complete: () => window.location.reload(),
		});
	}

	getTeamsCount(data: any): number {
		return data.teams.length;
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

		if (this.teamsSubscription) {
			this.teamsSubscription.unsubscribe();
		}
	}
}
