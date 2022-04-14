import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { OrganizationsService } from 'src/app/services/rest/organizations.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { RefsetUtility } from 'src/app/utilities/refset.utility';

@Component({
  selector: 'organization-projects',
  templateUrl: './projects.component.html'
})
export class OrganizationProjectsComponent implements OnInit {
  menu:SidebarMenuItem[] = [
    {name: 'Projects', link: '/organizations/projects', icon: 'fa fa-folder-open', isActive: true},
    {name: 'Teams', link: '/organizations/teams', icon: 'fa fa-users'},
    {name: 'People', link: '/organizations/people', icon: 'fa fa-user'},
    {name: 'Configuration', link: '/organizations/configuration', icon: 'fa fa-cogs'}
  ];
  
  data = [];
  defaultColDef = {};
  columnDefs = [
    {
      field: 'name', headerName: 'Project Name', flex: 1, minWidth: 450, cellRenderer: params => {
        return `${params.data.name}` + (params.data.locked ? '<i class="ml-3 text-muted fa fa-lock"></i>' : '');
      }, cellClass: 'pointer'
    },
    { field: 'description', headerName: 'Description', minWidth: 550 },
    { field: 'teams', headerName: 'Teams', filter: false, sortable: false, cellClass: 'text-primary font-weight-bold' }
  ];
  projectList = []
  organizationList = [];
  selectedOrganization: any;
  id: any;
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
      { path: '/organizations/projects', label: 'Organizations' },
      { label: 'Projects' },
    ]);

    this.defaultColDef = {
      filter: true, suppressMenu: true, floatingFilter: true, unSortIcon: true, sortable: true, resizable: true
    };

    this.data = [];
    this.route.params.subscribe(params => {
      this.id = params['id'];
    });
    this.getOrganization();
    this.getOrganizations();
  }

  onGridReady = (params) => {
    this.gridParams = params;
    this.api = params.api;
    this.columnApi = params.columnApi;
    this.getProjects();
  }

  onGridCellClick = (event) => {
    if (event.column.colId === 'name') {
        this.router.navigate(['/projects', event.data.id]);
    } 
}

  get dataCount() {
    return this.data.length;
  }

  getProjects(): void {
    this.data = [];
    this.refsetService.getProjects('limit=500&offset=0&sort=name&sortAscending=true').subscribe((results) => {
      this.projectList = results.items;
      for (let project of this.projectList) {
        if (project?.organization?.id === this.selectedOrganization?.id) {
          this.data.push({ name: `${project?.name}`, locked: project?.privateProject, description: `${project?.description}`
          , teams: `${project?.teams ? project?.teams?.length : '0'} Teams`, id: project.id })
        }
      }
      this.api.setRowData(this.data.slice(0, 10));
      this.api.redrawRows();
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
    this.router.navigate(['/organizations/projects', $event['value'].id]);
    this.onGridReady(this.gridParams);
  }
}
