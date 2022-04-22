import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
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
  
  this.defaultColDef = {
    filter: true, suppressMenu: true, floatingFilter: true, unSortIcon: true, sortable: true, flex: 1, resizable: true
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
    
  this.route.params.subscribe(params => {
    this.id = params['id'];
  });
  this.currentUser = this.authService.getUser();
  this.getTeam();
  this.getTeams();
  }
  get dataCount() {
    return this.data.length;
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
