import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
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
  columnDefs = [
    {
      field: 'name', headerName: 'Members', minWidth: 300, cellRenderer: params => {
        return `<img class='profile-pic' src='${params.data.pic}' /> ${params.data.name}`;
      }},
    { field: 'company', headerName: 'Company Name' },
    { field: 'email', headerName: 'Email' },
    { field: 'teams', headerName: 'Teams', filter: false, sortable: false, cellClass: 'text-primary font-weight-bold' }
  ];
  peopleList = [];
  selectedOrganization: any;
  id: any;
  organizationList = [];

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
    
  this.route.params.subscribe(params => {
    this.id = params['id'];
  });
  // this.getPeople();
  this.getOrganization();
    this.getOrganizations();
  }
  get dataCount() {
    return this.data.length;
  }

  // getPeople(): void {
  //   this.refsetService.getPeople('limit=500&offset=0&sort=name&sortAscending=true').subscribe((results) => {
  //     this.peopleList = results.items;
  //   });
  // }

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
