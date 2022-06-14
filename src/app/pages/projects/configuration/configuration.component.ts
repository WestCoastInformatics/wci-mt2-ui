import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { NotificationService } from 'src/app/services/notification.service';
import { ProjectsService } from 'src/app/services/rest/projects.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { TeamsService } from 'src/app/services/rest/teams.service';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { UiUtility } from 'src/app/utilities/ui.utility';

@Component({
  selector: 'projects-configuration',
  templateUrl: './configuration.component.html'
})
export class ProjectsConfigurationComponent implements OnInit {

  menu: SidebarMenuItem[] = [];
  profileNameValue = '';
  organizations: any;
  selectedOrganization: any;
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
  emailError = '';
  organizationId: any;

  constructor(private readonly breadcrumbService: BreadcrumbService,
    private readonly titleService: Title,
    private readonly refsetService: RefsetService,
    private readonly projectsService: ProjectsService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthenticationService,
    private readonly notificationService: NotificationService) { }

  ngOnInit(): void {
    this.titleService.setTitle('Refset Tool - Projects');

    this.route.params.subscribe(params => {

      this.organizationId = params['organizationId'];
      if (!params['id']?.includes('configuration') && !params['id']?.includes('people')) {
        this.id = params['id'];
        this.getProject();
      }
			this.setNavigation();
		});
    this.currentUser = this.authService.getUser();
    this.getOrganizations();
    this.getProjects();
    this.getTeams();
  }

  setNavigation() {

		let breadcrumbs: any = [{ path: '/dashboard', label: 'Dashboard' }];

		if (CodeUtility.hasValue(this.organizationId), true, true) {
			breadcrumbs.push({ path: 'organizations/projects/' + this.organizationId, label: 'Organization Projects' });
		}

		breadcrumbs.push({ label: 'Configuration' });
		this.breadcrumbService.setBreadcrumbs(breadcrumbs);

        this.menu = [
            {name: 'Reference Sets', link: '/organization/' + this.organizationId + '/projects', icon: 'fa fa-copy'},
			    { name: 'People', link: '/organization/' + this.organizationId + '/projects/people', icon: 'fa fa-user' },
			    { name: 'Configuration', link: '/organization/' + this.organizationId + '/projects/configuration', icon: 'fa fa-cogs', isActive: true }
		    ];
  }
  
  getOrganizations(): void {
    // get list of organizations
    this.refsetService.getOrganizations().subscribe((organizationResults) => {
      this.organizations = organizationResults?.items;
    })
  }
  getProjects(): void {
    this.refsetService.getProjects('limit=500&offset=0&sort=name&sortAscending=true').subscribe((results) => {
      this.projectList = results.items.filter((items) => {
        return this.organizationId === items.organizationId;
    });
    });
  }

  getProject(): void {
    this.projectsService.getProject(this.id).subscribe((result) => {
      this.selectedProject = result;
      this.profileNameValue = this.selectedProject?.name;
      // this.profileEmailValue = this.selectedProject?.primaryContactEmail;
      this.profileDescriptionValue = this.selectedProject?.description;
      this.selectedOrganization = this.selectedProject?.organization;
      this.isPrivate = this.selectedProject?.privateProject;

      if (!this.selectedProject?.teams) {
        this.selectedProject = { ...this.selectedProject, teams: [] }
      }
      this.selectedTeamIds = this.selectedProject?.teams;
    });
  }

  isValidEmail(): boolean {
    var lower = this.profileEmailValue.toLowerCase();
    var flag = lower.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
    if (flag == null) {
      this.emailError = "Email is invalid.";
    } else {
      this.emailError = "";
    }
    return flag == null ? false : true;
  }

  onKeyDownEvent(event: any) {
    console.log(event.target.value);
    this.isValidEmail();
  }

  updateProject(): void {
    this.selectedProject.name = this.profileNameValue;
    // this.selectedProject.primaryContactEmail = this.profileEmailValue;
    this.selectedProject.description = this.profileDescriptionValue;
    this.selectedProject.privateProject = this.isPrivate;
    this.projectsService.updateProject(this.id, this.selectedProject).subscribe(() => {
      this.notificationService.show("Update process complete.", null, "success", { timeOut: 0, extendedTimeOut: 0 });
    });
  }

  updateProjectTeams(): void {
    this.selectedProject = { ...this.selectedProject, teams: this.selectedTeamIds };
    this.projectsService.updateProject(this.id, this.selectedProject).subscribe();
  }

  selectProject($event): void {
		this.router.navigate(['organization/' + this.organizationId + '/projects/configuration', $event['value'].id]);
    this.route.params.subscribe(params => {
      this.id = params['id'];
      this.getProject();
    });
  }

  selectOrganization($event): void {
    this.organizationId = $event.value.id;
    this.selectedProject = null;
    this.getProjects();
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

  getSelectedProjectName(): string {
    return this.selectedProject?.name;
  }

  getSelectedProjectId(): string {
    return this.selectedProject?.id;
  }
}
