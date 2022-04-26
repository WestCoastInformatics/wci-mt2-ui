import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'teams-people',
  templateUrl: './people.component.html'
})
export class TeamsPeopleComponent implements OnInit {
  menu:SidebarMenuItem[] = [
    {name: 'People', link: '/teams/people', icon: 'fa fa-user', isActive: true},
    {name: 'Configuration', link: '/teams/configuration', icon: 'fa fa-cogs'}
  ];
  
  data = [];
  defaultColDef = {};
  columnDefs = [
    {
      field: 'name', headerName: 'Participant', minWidth: 300, cellRenderer: params => {
        return `<img class='profile-pic' src='${params.data.pic}' /> ${params.data.name}`;
      }},
    { field: 'company', headerName: 'Company Name' },
    { field: 'email', headerName: 'Email' },
    { field: null, headerName: 'Edit Member', filter: false, sortable: false, cellClass: 'text-primary font-weight-bold', cellRenderer: params => {
      return `<a class='action-btn'>Remove Member</a>`;
    } }
  ];
  selectedTeam: any;
  id: any;
  teamList = [];
  currentUser: any;
  gridOptions: any;
  gridPaging = { pageSize: 10, pageSizeOptions: [10, 25, 50, 100], totalKnown: false, totalRows: null, manualStateRefresh: new Boolean(true)};
  gridParams: any;
  gridApi: any;
  gridColumnDefs = [];
  peopleList = [];

  constructor(private readonly breadcrumbService: BreadcrumbService,
    private readonly titleService: Title,
    private readonly refsetService: RefsetService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthenticationService,
    private readonly teamsService: TeamsService) { }

  ngOnInit(): void {
    this.titleService.setTitle('Refset Tool - Teams');
    this.breadcrumbService.setBreadcrumbs([
      { path: '/teams/people', label: 'Teams' },
      { label: 'People' },
  ]);
  this.gridColumnDefs = [
    {
      field: 'name', headerName: 'Participant', minWidth: 300, flex: 1, cellRenderer: params => {
        return `<img class='profile-pic' src='${params.data.pic}' /> ${params.data.name}`;
      }},
    { field: 'company', flex: 1, headerName: 'Company Name' },
    { field: 'email', flex: 1, headerName: 'Email' },
    { field: 'teams', tooltipComponentFramework: CustomTooltipComponent, tooltipField: 'teams', tooltipComponentParams: { color: '#ececec' }, flex: 1, headerName: 'Teams', filter: false, sortable: false, cellClass: 'text-primary font-weight-bold' }
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

  this.route.params.subscribe(params => {
    this.id = params['id'];
  });
  this.currentUser = this.authService.getUser();
  this.getTeam();
  this.getTeams();
  this.getPeople();
  }

  onGridReady = (params) => {
		this.gridParams = params;
		this.gridApi = params.api;
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
    // this.teamsService.getTeamUsers(this.id).subscribe((results) => {
    //   this.peopleList = results.items;
    //   console.log(this.peopleList);
    // });
  }

  selectTeam($event): void {
    this.router.navigate(['/teams/people', $event['value'].id]);
  }

  getTeam(): void {
    this.teamsService.getTeam(this.id).subscribe((result) => {
      this.selectedTeam = result;
    });
  }

  getTeams(): void {
    this.refsetService.getTeams('limit=500&offset=0&sort=name&sortAscending=true').subscribe((results) => {
      this.teamList = results.items.filter((x) => {
        return x.members.some((member) => {
          return member.includes(this.currentUser.id);
        });
      });
    });
  }
}
