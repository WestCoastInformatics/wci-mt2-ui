import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { ProjectsService } from 'src/app/services/rest/projects.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { TeamsService } from 'src/app/services/rest/teams.service';

@Component({
  selector: 'projects-configuration',
  templateUrl: './configuration.component.html'
})
export class ProjectsConfigurationComponent implements OnInit {
  menu: SidebarMenuItem[] = [
    {name: 'Reference Sets', link: '/projects', icon: 'fa fa-copy'},
    {name: 'People', link: '/projects/people', icon: 'fa fa-user'},
    {name: 'Configuration', link: '/projects/configuration', icon: 'fa fa-cogs', isActive: true}
  ];

  profileNameValue = '';
  profileEmailValue = '';
  profileDescriptionValue = '';
  isPrivate = false;
  selectedProject: any;
  id: any;
  projectList = [];
  selectedTeamIds = [];
  selectedTeams = [];
  teamList = [];
  currentUser: any;
  containsRole = false;

  constructor(private readonly breadcrumbService: BreadcrumbService,
    private readonly titleService: Title,
    private readonly refsetService: RefsetService,
    private readonly projectsService: ProjectsService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthenticationService,
    private readonly teamsService: TeamsService) { }

  ngOnInit(): void {
    this.titleService.setTitle('Refset Tool - Projects');
    this.breadcrumbService.setBreadcrumbs([
      { path: '/projects/configuration', label: 'Projects' },
      { label: 'Configuration' },
    ]);
    
    this.route.params.subscribe(params => {
      this.id = params['id'];
    });
    this.currentUser = this.authService.getUser();
    this.getProject();
    this.getProjects();
    this.getTeams();
  }

  getProjects(): void {
    this.refsetService.getProjects('limit=500&offset=0&sort=name&sortAscending=true').subscribe((results) => {
      this.projectList = results.items;
    });
  }

  getProject(): void {
    this.projectsService.getProject(this.id).subscribe((result) => {
      this.selectedProject = result;
      this.profileNameValue = this.selectedProject?.name;
      this.profileEmailValue = this.selectedProject?.primaryContactEmail;
      this.profileDescriptionValue = this.selectedProject?.description;
      this.isPrivate = this.selectedProject?.privateProject;

      console.log(this.selectedProject)
      if (!this.selectedProject?.teams) {
        this.selectedProject = {...this.selectedProject, teams: []}
      }
      this.selectedTeamIds = this.selectedProject?.teams;
    });
  }

  updateProject(): void {
    this.selectedProject.name = this.profileNameValue;
    this.selectedProject.primaryContactEmail = this.profileEmailValue;
    this.selectedProject.description = this.profileDescriptionValue;
    this.selectedProject.privateProject = this.isPrivate;
    this.projectsService.updateProject(this.id, this.selectedProject).subscribe();
  }

  updateProjectTeams(): void {
    this.selectedProject = {...this.selectedProject, teams: this.selectedTeamIds};
    this.projectsService.updateProject(this.id, this.selectedProject).subscribe();
  }

  selectProject($event): void {
    this.router.navigate(['/projects/configuration', $event['value'].id]);
    this.route.params.subscribe(params => {
      this.id = params['id'];
      this.getProject();
    });
  }

  getTeams(): void {
    this.refsetService.getTeams('limit=500&offset=0&sort=name&sortAscending=true').subscribe((results) => {
      this.teamList = results.items.filter((x) => {
        return x.members.some((member) => {
          return member.includes(this.currentUser.id);
        });
      });
      console.log(this.teamList);
    });
  }

  setTeamName(team: any): string {
    const roleString = team.roles.map((role) => {
      const lowercaseRole = role.toLowerCase();
      return lowercaseRole[0].toUpperCase() + lowercaseRole.substring(1);
    });

    return `${team.name} (${roleString.join(', ')})`;
  }

  hideAddButton(team: any): boolean {
    return this.selectedTeamIds?.includes(team.id);
  }

  addBold(team: any): boolean {
    return (this.selectedProject?.teams?.some((containedTeam) => {
      return containedTeam === team.id;
    }));
  }

  addToTeamList(team: any): void {
    this.selectedTeams.push(team);
    this.selectedTeamIds?.push(team.id);
    this.checkIfTeamContainsRoles();
  }

  removeFromTeamList(team): void {
    const idIndex = this.selectedTeamIds?.indexOf(team.id);
    if (idIndex > -1) {
      this.selectedTeamIds.splice(idIndex, 1);
    }
    const index = this.selectedTeams.indexOf(team);
    if (index > -1) {
      this.selectedTeams.splice(index, 1);
    }
    this.checkIfTeamContainsRoles();
  }

  checkIfTeamContainsRoles(): void {

    this.containsRole = this.selectedTeams.some((team) => {
      return team['roles']?.includes('ADMIN') &&
        team['roles']?.includes('REVIEWER') &&
        team['roles']?.includes('AUTHOR');
    });

  }

  getSelectedProjectName(): string{
    return this.selectedProject?.name;
  }

  getSelectedProjectId(): string{
    return this.selectedProject?.id;
  }
}
