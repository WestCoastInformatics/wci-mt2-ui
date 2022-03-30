import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';

@Component({
  selector: 'app-teams',
  templateUrl: './teams.component.html'
})
export class TeamsComponent implements OnInit {
  data = [];
  defaultColDef = {};
  columnDefs = [
    {
      field: 'name', headerName: 'Team Name', flex: 1, minWidth: 550},
    { field: 'description', headerName: 'Description' },
    { field: 'role', headerName: 'Role' },
    { field: 'email', headerName: 'Contact Email' },
    { field: 'members', headerName: 'Members', filter: false, sortable: false, cellClass: 'text-primary font-weight-bold' }
  ];

  constructor(private readonly breadcrumbService: BreadcrumbService, private readonly titleService: Title) { }

  ngOnInit(): void {
    this.titleService.setTitle('Refset Tool - Organizations');
    this.breadcrumbService.setBreadcrumbs([
      { path: '/organizations/teams', label: 'Organizations' },
      { label: 'Teams' },
  ]);

  
  this.defaultColDef = {
    filter: true, suppressMenu: true, floatingFilter: true, unSortIcon: true, sortable: true
  };

  this.data = [
    { name: 'Content Team', description: 'Authors and Reviewers', role: 'Author, Reviewer', email: 'mha@snomed.org', members: '6 Members' },
    { name: 'Review Team', description: 'Reviewers', role: 'Reviewer', email: 'swhalen@westcoastinformatics.com', members: '2 Members' },
    { name: 'Collaboration Team', description: 'External Collaborators (Refset Owner, SMEs) External Collaborators (Refset Owner, SMEs)External Collaborators (Refset Owner, SMEs)External Collaborators (Refset Owner…', role: 'Viewer', email: 'lbi@snomed.org', members: '2 Members' },
    { name: 'The Fantastic Five', description: 'Another Descriptive Description', role: 'Admin', email: 'mha@snomed.org', members: '5 Members' }
  ];
  }
  get dataCount() {
    return this.data.length;
  }

}
