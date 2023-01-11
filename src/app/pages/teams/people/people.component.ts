import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryFilterComponent } from 'src/app/components/categoryFilter/category-filter.component';
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';
import { CustomTooltipComponent } from 'src/app/components/custom-tooltip/custom-tooltip.component';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { TeamsService } from 'src/app/services/rest/teams.service';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { Location } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OrganizationsService } from 'src/app/services/rest/organizations.service';

@Component({
  selector: 'teams-people',
  templateUrl: './people.component.html'
})
export class TeamsPeopleComponent implements OnInit {

  menu: SidebarMenuItem[] = [];
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
  showTable = false;
  organizationList = [];
  organizationId: string;
  selectedOrganization: any;
  showLoadingSpinner = true;
  uiUtility = UiUtility;
  openedConfirmModal: any;
  selectedUser: any;

  @ViewChild('peopleNameSection') peopleNameSection: TemplateRef<any>;
  @ViewChild('peopleTeamsSection') peopleTeamsSection: TemplateRef<any>;
  @ViewChild('confirmInactiveMemberModal') confirmInactiveMemberModal: NgbModal;

  constructor(private readonly breadcrumbService: BreadcrumbService,
    private readonly titleService: Title,
    private readonly refsetService: RefsetService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthenticationService,
    private readonly teamsService: TeamsService,
    private readonly modalService: NgbModal,
    private location: Location,
    private organizationsService: OrganizationsService) {
    document.body.scrollTop = 0;
  }

  ngOnInit(): void {

    this.titleService.setTitle('Reference Set Tool - Teams - People');
    this.currentUser = this.authService.getUser();
    this.route.params.subscribe(params => {

      this.organizationId = params['organizationId'];
      this.teamId = params['teamId'];
      this.setNavigation();
    });

    this.data = [];
    this.selectedOrganization = null;
    this.selectedTeam = null;

    this.getOrganizations();

  }

  ngAfterViewInit() {

    this.gridColumnDefs = [
      { field: 'name', tooltipField: 'name', headerName: 'User', minWidth: 65, flex: 2, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.peopleNameSection }, unSortIcon: true, resizable: true },
      { field: 'company', tooltipField: 'company', minWidth: 65, flex: 2, headerName: 'Company Name', unSortIcon: true, resizable: true },
      { field: 'email', tooltipField: 'email', minWidth: 65, flex: 2, headerName: 'Email', unSortIcon: true, resizable: true },
      { field: 'teams', flex: 1, headerName: 'Teams', filter: false, sortable: false, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.peopleTeamsSection }, minWidth: 65, resizable: false }
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
        customTooltipComponent: CustomTooltipComponent
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
    };
  }

  setNavigation() {

    const breadcrumbs: any = [{ path: '/dashboard', label: 'Dashboard' }];

    if (CodeUtility.hasValue(this.organizationId, true, true)) {
      breadcrumbs.push({ path: 'organizations/' + this.organizationId + '/teams', label: this.selectedOrganization?.name ? this.selectedOrganization?.name + ' / Teams' : '' });
    }

    breadcrumbs.push({ label: 'People' });
    this.breadcrumbService.setBreadcrumbs(breadcrumbs);

    this.menu = [
      { name: 'People', link: '/organization/' + this.organizationId + '/teams/' + this.teamId + '/people', icon: 'fa fa-user', isActive: true }
    ];

    const configShowing = this.menu[this.menu.length - 1].name == 'Configuration';

    if (!configShowing && this.selectedOrganization && this.selectedOrganization.roles.includes('ADMIN')) {
      this.menu.push({ name: 'Configuration', link: '/organization/' + this.organizationId + '/teams/' + this.teamId + '/configuration', icon: 'fa fa-cogs' });
    }

    this.location.replaceState('organization/' + this.organizationId + '/teams/' + this.teamId + '/people');
  }

  getOrganizations(): void {

    this.refsetService.getOrganizations().subscribe((results) => {

      this.organizationList = results.items;

      for (const organization of this.organizationList) {

        if (this.organizationId === organization.id) {

          this.selectedOrganization = organization;
          this.getTeams();
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

    this.showLoadingSpinner = true;
    this.organizationId = this.selectedOrganization.id;
    this.teamId = null;
    this.selectedTeam = null;
    this.teamList = [];
    this.data = [];
    this.setNavigation();
    this.getTeams();
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

  getTeams(): void {

    this.refsetService.getTeams('includeMembers=true&query=organizationId:' + this.selectedOrganization.id + '&sort=name&sortAscending=true').subscribe((results) => {

      this.showLoadingSpinner = false;
      this.showTable = true;
      this.teamList = results.items;

      for (const team of this.teamList) {

        if (this.teamId == team.id) {

          this.selectedTeam = team;
          this.showTeamMembers();
          return;
        }
      }

      if (this.teamList && this.teamList.length > 0) {

        this.selectedTeam = this.teamList[0];
        this.selectTeam();
      }
    });
  }

  selectTeam(): void {

    this.teamId = this.selectedTeam.id;
    this.showTeamMembers();
  }

  getAvailableOrganizationUsers(organizationId: string): void {
    this.organizationsService.getOrgUsers(organizationId, false).subscribe({
        next: (results) => {
            this.userList = results?.items.filter(teamMember => !this.data.filter(orgMember => teamMember.id === orgMember.id).length);
        }
    });
  }

  showTeamMembers() {

    this.data = this.selectedTeam.memberList;

    localStorage.setItem('selectedOrganizationId', JSON.stringify(this.selectedOrganization.id));

    this.setNavigation();
    this.getAvailableOrganizationUsers(this.organizationId);
  }

  onGridReady = (params) => {

    this.gridParams = params;
    this.gridApi = params.api;
  }

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

  }

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

      },
      complete: () => window.location.reload()
    });
  }

  getTeamsCount(data: any): number {
    return data.teams.length;
  }

  getTeamsTitle(data: any): string {
    if (data) {
      if (data.teams) {
        return 'User Teams:\n' + (data?.teams.map(t => t.name).join(', \n'));
      } else {
        return 'No User Teams'
      }
    }
  }

}
