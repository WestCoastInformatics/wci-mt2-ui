import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html'
})
export class ProjectsComponent implements OnInit {
  data = [];
  defaultColDef = {};
  columnDefs = [
    {
      field: 'name', headerName: 'Project Name', flex: 1, minWidth: 550, cellRenderer: params => {

        return `${params.data.name}` + (params.data.locked ? '<i class="ml-3 text-muted fa fa-lock"></i>' : '');
      }
    },
    { field: 'description', headerName: 'Description' },
    { field: 'teams', headerName: 'Teams', filter: false, sortable: false, cellClass: 'text-primary font-weight-bold' }
  ];

  constructor(private readonly breadcrumbService: BreadcrumbService, private readonly titleService: Title) { }

  ngOnInit(): void {
    this.titleService.setTitle('Refset Tool - Organizations');
    this.breadcrumbService.setBreadcrumbs([
      { path: '/organizations/projects', label: 'Organizations' },
      { label: 'Projects' },
    ]);

    this.defaultColDef = {
      filter: true, suppressMenu: true, floatingFilter: true, unSortIcon: true, sortable: true
    };

    this.data = [
      { name: 'WCI Test MANAGED-SERVICE Project', locked: true, description: 'The WCI Test MANAGED-SERVICE Project is a testing project for WCI Developers & Managers', teams: '4 Teams' },
      { name: 'WCI Test AUTHORING-INTL Project', locked: false, description: 'WCI Test AUTHORING-INTL Project Description', teams: '6 Teams' },
      { name: 'WCI test BROWSER Project', locked: true, description: 'This project created to test WCI test BROWSWER Project', teams: '4 Teams' }
    ];
  }
  get dataCount() {
    return this.data.length;
  }
}
