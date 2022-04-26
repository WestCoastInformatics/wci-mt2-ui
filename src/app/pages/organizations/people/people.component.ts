import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'organization-people',
  templateUrl: './people.component.html'
})
export class OrganizationPeopleComponent implements OnInit {
  menu:SidebarMenuItem[] = [
    {name: 'Projects', link: '/organizations/projects', icon: 'fa fa-folder-open'},
    {name: 'Teams', link: '/organizations/teams', icon: 'fa fa-users'},
    {name: 'People', link: '/organizations/people', icon: 'fa fa-user', isActive: true},
    {name: 'Configuration', link: '/organizations/configuration', icon: 'fa fa-cogs'}
  ];

  data = [];
  defaultColDef = {};

  peopleList = [];
  selectedOrganization: any;
  id: any;
  organizationList = [];
  gridOptions: any;
  gridPaging = { pageSize: 10, pageSizeOptions: [10, 25, 50, 100], totalKnown: false, totalRows: null, manualStateRefresh: new Boolean(true)};
  gridParams: any;
  gridApi: any;
  gridColumnDefs = [];

  constructor(private readonly breadcrumbService: BreadcrumbService,
    private readonly titleService: Title,
    private readonly refsetService: RefsetService,
    private readonly organizationsService: OrganizationsService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly teamService: TeamsService) { }

	ngOnInit(): void {
    this.titleService.setTitle('Refset Tool - Organizations');
    this.breadcrumbService.setBreadcrumbs([
      { path: '/organizations/people', label: 'Organizations' },
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
		this.getOrganization();
    this.getOrganizations();
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
    this.organizationsService.getOrgUsers(this.id).subscribe((results) => {
      this.peopleList = results.items;
      console.log(this.peopleList);
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
    this.router.navigate(['/organizations/people', $event['value'].id]);
  }

  async getTeams(teams: any): Promise<any> {
    console.log(teams)
    const teamObject = { teams: []};
    if (teams === 'undefined' || teams === undefined) {
      return JSON.stringify(teamObject);
    } else {
      for (let team of teams) {
        teamObject.teams.push(await lastValueFrom(this.teamService.getTeam(team)));
      }
      return JSON.stringify(teamObject);
    }
  }
  
  getTeamCount(data: any): number {

    return data.teams.length;
  }
}
