import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { OrganizationsService } from 'src/app/services/rest/organizations.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { TeamsService } from 'src/app/services/rest/teams.service';

@Component({
  selector: 'organization-teams',
  templateUrl: './teams.component.html'
})
export class OrganizationTeamsComponent implements OnInit {
  menu:SidebarMenuItem[] = [
    {name: 'Projects', link: '/organizations/projects', icon: 'fa fa-folder-open'},
    {name: 'Teams', link: '/organizations/teams', icon: 'fa fa-users', isActive: true},
    {name: 'People', link: '/organizations/people', icon: 'fa fa-user'},
    {name: 'Configuration', link: '/organizations/configuration', icon: 'fa fa-cogs'}
  ];

  data = [];
  defaultColDef = {};
  columnDefs = [
    {
      field: 'name', headerName: 'Team Name', flex: 1, minWidth: 350},
    { field: 'description', headerName: 'Description' },
    { field: 'role', headerName: 'Role', minWidth: 350 },
    { field: 'email', headerName: 'Contact Email' },
    { field: 'members', headerName: 'Members', filter: false, sortable: false, cellClass: 'text-primary font-weight-bold' }
  ];
  teamList = [];
  selectedOrganization: any;
  id: any;
  organizationList: any;
  api: any;
  columnApi: any;
  gridParams: any;

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

  
  this.defaultColDef = {
    filter: true, suppressMenu: true, floatingFilter: true, unSortIcon: true, sortable: true
  };

  this.data = [];
    
  this.route.params.subscribe(params => {
    this.id = params['id'];
  });
  this.getTeams();
  this.getOrganization();
  this.getOrganizations();
  }
  get dataCount() {
    return this.data.length;
  }

  onGridReady = (params) => {
    this.gridParams = params;
    this.api = params.api;
    this.columnApi = params.columnApi;
    this.getTeams();
  }

  getTeams(): void {
    this.data = [];
    this.refsetService.getTeams('limit=500&offset=0&sort=name&sortAscending=true').subscribe((results) => {
      this.teamList = results.items;
      console.log(this.teamList)
      for (let team of this.teamList) {
        if (team?.organization?.id === this.selectedOrganization?.id) {
          this.data.push({ name: `${team?.name}`, description: `${team?.description}`, role: `${team?.roles.join(', ')}`, email: `${team?.primaryContactEmail}`, members: `${team.members ? team?.members.length : '0'} Members` });
        }
      }
      console.log(this.data);
      this.api.setRowData(this.data.slice(0, 10));
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
  }
}
