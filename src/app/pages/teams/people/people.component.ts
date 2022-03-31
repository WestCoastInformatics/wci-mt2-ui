import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';

@Component({
  selector: 'teams-people',
  templateUrl: './people.component.html'
})
export class TeamsPeopleComponent implements OnInit {
  data = [];
  defaultColDef = {};
  columnDefs = [
    {
      field: 'name', headerName: 'Participant', minWidth: 300, cellRenderer: params => {
        return `<img class='profile-pic' src='${params.data.pic}' /> ${params.data.name}`;
      }},
    { field: 'company', headerName: 'Company Name' },
    { field: 'email', headerName: 'Email' },
    { field: 'teams', headerName: 'Teams', filter: false, sortable: false, cellClass: 'text-primary font-weight-bold' }
  ];

  constructor(private readonly breadcrumbService: BreadcrumbService, private readonly titleService: Title) { }

  ngOnInit(): void {
    this.titleService.setTitle('Refset Tool - Organizations');
    this.breadcrumbService.setBreadcrumbs([
      { path: '/organizations/people', label: 'Organizations' },
      { label: 'People' },
  ]);
  
  this.defaultColDef = {
    filter: true, suppressMenu: true, floatingFilter: true, unSortIcon: true, sortable: true, flex: 1
  };

  this.data = [
    { name: 'Steph Whalen', pic: 'assets/sampels/profile/1.svg', company: 'UX Designer', email: 'swhalen@westcoastinformatics.com', teams: '2 Teams' },
    { name: 'Linda Bird', pic: 'assets/sampels/profile/2.svg', company: 'Head of Implementation Support', email: 'lbi@snomed.org', teams: '3 Teams' },
    { name: 'Toni Morrison', pic: 'assets/sampels/profile/3.svg', company: 'Senior Terminologist', email: 'tmo@snomed.org', teams: '1 Team' },
    { name: 'Monica Harry', pic: 'assets/sampels/profile/4.svg', company: 'Director of Content and Mapping', email: 'mha@snomed.org', teams: '1 Team' },
    { name: 'Farzaneh Ashrafi', pic: 'assets/sampels/profile/5.svg', company: 'Senior Terminologist', email: 'fas@snomed.org', teams: '1 Team' },
    { name: 'Andrew Atkinson', pic: 'assets/sampels/profile/6.svg', company: 'Release Manager', email: 'aat@snomed.org', teams: '3 Teams' }
  ];
  }
  get dataCount() {
    return this.data.length;
  }

}
