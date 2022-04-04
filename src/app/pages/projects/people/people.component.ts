import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { ProjectsService } from 'src/app/services/rest/projects.service';
import { RefsetService } from 'src/app/services/rest/refset.service';

@Component({
  selector: 'projects-people',
  templateUrl: './people.component.html'
})
export class ProjectsPeopleComponent implements OnInit {
  menu:SidebarMenuItem[] = [
    {name: 'Reference Sets', link: '/projects', icon: 'fa fa-copy'},
    {name: 'People', link: '/projects/people', icon: 'fa fa-user', isActive: true},
    {name: 'Configuration', link: '/projects/configuration', icon: 'fa fa-cogs'}
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
    { field: 'teams', headerName: 'Teams', filter: false, sortable: false, cellClass: 'text-primary font-weight-bold' }
  ];
  peopleList = [];
  selectedProject: any;
  id: any;
  projectList = [];

  constructor(private readonly breadcrumbService: BreadcrumbService,
    private readonly titleService: Title,
    private readonly refsetService: RefsetService,
    private readonly projectsService: ProjectsService,
    private readonly route: ActivatedRoute,
    private readonly router: Router) { }

  ngOnInit(): void {
    this.titleService.setTitle('Refset Tool - Projects');
    this.breadcrumbService.setBreadcrumbs([
      { path: '/projects/people', label: 'Projects' },
      { label: 'People' },
  ]);
  
  this.defaultColDef = {
    filter: true, suppressMenu: true, floatingFilter: true, unSortIcon: true, sortable: true, flex: 1
  };

  this.data = [
    { name: 'Steph Whalen', pic: 'assets/sampels/profile/1.svg', company: 'West Coast Informatics', email: 'swhalen@westcoastinformatics.com', teams: '2 Teams' },
    { name: 'Linda Bird', pic: 'assets/sampels/profile/2.svg', company: 'Snomed International', email: 'lbi@snomed.org', teams: '3 Teams' },
    { name: 'Toni Morrison', pic: 'assets/sampels/profile/3.svg', company: 'Snomed International', email: 'tmo@snomed.org', teams: '1 Team' },
    { name: 'Monica Harry', pic: 'assets/sampels/profile/4.svg', company: 'Snomed International', email: 'mha@snomed.org', teams: '1 Team' },
    { name: 'Farzaneh Ashrafi', pic: 'assets/sampels/profile/5.svg', company: 'Snomed International', email: 'fas@snomed.org', teams: '1 Team' },
    { name: 'Andrew Atkinson', pic: 'assets/sampels/profile/6.svg', company: 'Snomed International', email: 'aat@snomed.org', teams: '3 Teams' },
    { name: 'Anna Nilsson', pic: 'assets/sampels/profile/7.svg', company: 'Swedish NRC', email: 'anilsson@swedishnrc.org', teams: '1 Team' }
  ];
  this.route.params.subscribe(params => {
    this.id = params['id'];
  });
  // this.getPeople();
  this.getProject();
  this.getProjects();
  }
  get dataCount() {
    return this.data.length;
  }

    // getPeople(): void {
  //   this.refsetService.getPeople('limit=500&offset=0&sort=name&sortAscending=true').subscribe((results) => {
  //     this.peopleList = results.items;
  //   });
  // }

  getProjects(): void {
    this.refsetService.getProjects('limit=500&offset=0&sort=name&sortAscending=true').subscribe((results) => {
      this.projectList = results.items;
    });
  }

  getProject(): void {
    this.projectsService.getProject(this.id).subscribe((result) => {
      this.selectedProject = result;
    });
  }

  selectProject($event): void {
    this.router.navigate(['/projects/people', $event['value'].id]);
  }

}
