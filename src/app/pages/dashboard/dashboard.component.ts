import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { UiUtility } from 'src/app/utilities/ui.utility';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  searchText = '';
  organizationList = [];
  projectList = [];
  teamList = [];
  currentUser: any;

  columnDefs = [
    { field: 'refsetId', headerName: 'Reference Set', flex: 1, minWidth: 550, unSortIcon: true, sortable: true},
    { field: 'workflowStatus', headerName: 'Workflow Status', unSortIcon: true, sortable: true},
    { field: 'modified', tooltipField: 'modified', headerName: 'Last Modified', unSortIcon: true, sortable: true, valueGetter:
    UiUtility.gridDateValueGetter,}
  ];

  data = [];
  api: any;
  columnApi: any;

  constructor(private readonly breadcrumbService: BreadcrumbService,
    private readonly titleService: Title,
    private readonly refsetService: RefsetService,
    private readonly authService: AuthenticationService) { }

  ngOnInit(): void {
    this.titleService.setTitle('Refset Tool - Dashboard');
    this.breadcrumbService.setBreadcrumbs([
      { path: '/dashboard', label: 'Dashboard' }
    ]);
    this.currentUser = this.authService.getUser();
    this.getOrganizations();
    this.getProjects();
    this.getTeams();
  }


  getOrganizations(): void {
    this.refsetService.getOrganizations().subscribe((results) => {
      this.organizationList = results.items;
    });
  }

  onGridReady = (params) => {
    this.api = params.api;
    this.columnApi = params.columnApi;
    this.getRefSets();
  }

  getRefSets(): void {
    this.refsetService.getRefsets('limit=10&offset=0&sort=name&sortAscending=true').subscribe((x) => {
      console.log(x.items);
      for (let refset of x.items) {
        if (refset.assignedUser === this.currentUser.userName) {
          this.data.push({ refsetId: `${refset?.organizationName}/${refset?.project[0]?.name}/${refset.name}`, workflowStatus: `${refset?.workflowStatus}`, modified: `${refset?.modified}` })
        }
      }
      console.log(this.data)
      this.api.setRowData(this.data.slice(0, 10));
      this.api.redrawRows();
    });
  }

  getProjects(): void {
    this.refsetService.getProjects('limit=500&offset=0&sort=name&sortAscending=true').subscribe((results) => {
      this.projectList = results.items;
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
