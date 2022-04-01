import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';

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
    { name: 'Steph Whalen', pic: 'assets/sampels/profile/1.svg', company: 'West Coast Informatics', email: 'swhalen@westcoastinformatics.com' },
    { name: 'Linda Bird', pic: 'assets/sampels/profile/2.svg', company: 'Snomed International', email: 'lbi@snomed.org' },
    { name: 'Toni Morrison', pic: 'assets/sampels/profile/3.svg', company: 'Snomed International', email: 'tmo@snomed.org'},
    { name: 'Monica Harry', pic: 'assets/sampels/profile/4.svg', company: 'Snomed International', email: 'mha@snomed.org' },
    { name: 'Farzaneh Ashrafi', pic: 'assets/sampels/profile/5.svg', company: 'Snomed International', email: 'fas@snomed.org' },
    { name: 'Andrew Atkinson', pic: 'assets/sampels/profile/6.svg', company: 'Snomed International', email: 'aat@snomed.org' },
    { name: 'Anna Nilsson', pic: 'assets/sampels/profile/7.svg', company: 'Swedish NRC', email: 'anilsson@swedishnrc.org' }
  ];
  }
  get dataCount() {
    return this.data.length;
  }

}
