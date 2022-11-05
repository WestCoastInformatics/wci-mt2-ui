import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { NotificationService } from 'src/app/services/notification.service';
import { ProjectsService } from 'src/app/services/rest/projects.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { Location } from '@angular/common';
import { Content } from '@angular/compiler/src/render3/r3_ast';

@Component({
  selector: 'projects-configuration',
  templateUrl: './configuration.component.html'
})
export class ProjectsConfigurationComponent implements OnInit {

  menu: SidebarMenuItem[] = [];
  profileNameValue = '';
  organizationList: any[] = [];
  selectedOrganization: any;
  editionId: any;
  selectedEdition: any;
  editionList: any[] = [];
  profileEmailValue = '';
  profileDescriptionValue = '';
  isPrivate = false;
  selectedProject: any;
  projectId: any;
  projectList: any[] = [];
  selectedTeamIds = [];
  selectedTeams = [];
  teamList = [];
  currentUser: any;
  containsRole = false;
  emailError = '';
  organizationId: any;
  showLoadingSpinner = false;

  constructor(private readonly breadcrumbService: BreadcrumbService,
    private readonly titleService: Title,
    private readonly refsetService: RefsetService,
    private readonly projectsService: ProjectsService,
    private readonly route: ActivatedRoute,
    private readonly authService: AuthenticationService,
    private readonly notificationService: NotificationService,
    private location: Location) {
    document.body.scrollTop = 0;
  }

  ngOnInit(): void {

    this.titleService.setTitle('Reference Set Tool - Projects');

    this.route.params.subscribe(params => {

      this.organizationId = params['organizationId'];
      this.editionId = params['editionId'];
      this.projectId = params['projectId'];
      this.setNavigation();
    });

    this.showLoadingSpinner = true;

    this.currentUser = this.authService.getUser();
    this.getOrganizations();
  }

  setNavigation() {

    const breadcrumbs: any = [{ path: '/dashboard', label: 'Dashboard' }];

    if (CodeUtility.hasValue(this.organizationId, true, true)) {
      breadcrumbs.push({ path: 'organizations/' + this.organizationId + '/edition/' + this.editionId + '/projects', label: 'Organization Edition Projects' });
    }

    breadcrumbs.push({ label: 'Configuration' });
    this.breadcrumbService.setBreadcrumbs(breadcrumbs);

    this.menu = [
      { name: 'Reference Sets', link: '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/refsets', icon: 'fa fa-copy' },
      { name: 'People', link: '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/people/', icon: 'fa fa-user' },
      {
        name: 'Configuration',
        link: '/organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/configuration',
        icon: 'fa fa-cogs',
        isActive: true
      }
    ];

    this.location.replaceState('organization/' + this.organizationId + '/edition/' + this.editionId + '/projects/' + this.projectId + '/configuration');
  }

  getOrganizations(): void {

    // get list of organizations
    this.refsetService.getOrganizations().subscribe({
      next: (results) => {

        this.organizationList = results?.items;

        for (const organization of this.organizationList) {

          if (this.organizationId == organization.id) {

            this.selectedOrganization = organization;
            this.getEditions();
            this.getTeams();
            return;
          }
        }

        this.getStoredOrganizationId();

        if (!this.selectedOrganization) {
          this.showLoadingSpinner = false;
        }
      },
      error: (error) => {
        this.showLoadingSpinner = false;
      }
    });
  }

  selectOrganization(): void {

    this.showLoadingSpinner = true;
    this.organizationId = this.selectedOrganization.id;
    this.selectedEdition = null;
    this.editionList = [];
    this.clearProjectData();
    this.getEditions();
    this.getTeams();
  }

  getEditions(): void {

    this.refsetService.getEditions('&query=organizationId:' + this.selectedOrganization.id + '&limit=500&offset=0&sort=name&sortAscending=true').subscribe({
      next: (results) => {

        this.editionList = results?.items;

        for (const edition of this.editionList) {

          if (this.editionId == edition.id) {

            this.selectedEdition = edition;
            this.getProjects();
            return;
          }
        }

        this.getStoredEditionId();

        if (!this.selectedEdition) {
          this.showLoadingSpinner = false;
        }
      },
      error: (error) => {
        this.showLoadingSpinner = false;
      }
    });
  }

  selectEdition(): void {

    this.showLoadingSpinner = true;
    this.editionId = this.selectedEdition.id;
    this.clearProjectData();
    this.setNavigation();
    this.getProjects();
  }

  getProjects(): void {

    this.refsetService.getProjects('query=editionId:' + this.selectedEdition.id + '&limit=500&offset=0&sort=name&sortAscending=true').subscribe({
      next: (results) => {

        this.projectList = results.items;

        for (const project of this.projectList) {

          if (this.projectId == project.id) {

            this.selectedProject = project;
            this.showProjectData();
            return;
          }
        }

        this.getStoredProjectId();

        if (!this.selectedProject) {
          this.showLoadingSpinner = false;
        }
      },
      error: (error) => {
        this.showLoadingSpinner = false;
      }
    });
  }

  selectProject(): void {

    this.showLoadingSpinner = true;
    this.projectId = this.selectedProject.id;
    this.showProjectData();
  }

  getStoredOrganizationId(): void {

    if (localStorage.getItem('selectedOrganizationId')) {

      const storedOrganizationId = JSON.parse(localStorage.getItem('selectedOrganizationId'));

      for (const organization of this.organizationList) {

        if (organization.id == storedOrganizationId) {

          this.selectedOrganization = organization;
          this.selectOrganization();
          return;
        }
      }

      // if the stored organization ID doesn't match anything remove it
      localStorage.removeItem('selectedOrganizationId');
    }
  }

  getStoredEditionId(): void {

    if (localStorage.getItem('selectedEditionId')) {

      const storedEditionId = JSON.parse(localStorage.getItem('selectedEditionId'));

      for (const edition of this.editionList) {

        if (edition.id == storedEditionId) {

          this.selectedEdition = edition;
          this.selectEdition();
          return;
        }
      }

      // if the stored edition ID doesn't match anything remove it
      localStorage.removeItem('selectedEditionId');

      if (this.editionList && this.editionList.length > 0) {

        this.selectedEdition = this.editionList[0];
        this.selectEdition();
      }
    } else if (this.editionList && this.editionList.length > 0) {

      this.selectedEdition = this.editionList[0];
      this.selectEdition();
    }
  }

  getStoredProjectId(): void {

    if (localStorage.getItem('selectedProjectId')) {

      const storedProjectId = JSON.parse(localStorage.getItem('selectedProjectId'));

      for (const project of this.projectList) {

        if (project.id == storedProjectId) {

          this.selectedProject = project;
          this.selectProject();
          return;
        }
      }

      // if the stored project ID doesn't match anything remove it
      localStorage.removeItem('selectedProjectId');

      if (this.projectList && this.projectList.length > 0) {

        this.selectedProject = this.projectList[0];
        this.selectProject();
      }
    } else if (this.projectList && this.projectList.length > 0) {

      this.selectedProject = this.projectList[0];
      this.selectProject();
    }
  }

  showProjectData(): void {

    this.setNavigation();
    this.profileNameValue = this.selectedProject.name;
    // this.profileEmailValue = this.selectedProject.primaryContactEmail;
    this.profileDescriptionValue = this.selectedProject.description;
    this.isPrivate = this.selectedProject.privateProject;
    this.selectedTeamIds = this.selectedProject?.teams;

    // set the selected teams
    for (let team of this.teamList) {

      if (this.selectedTeamIds.includes(team.id)) {
        this.selectedTeams.push(team);
      }
    }

    this.showLoadingSpinner = false;

    localStorage.setItem('selectedOrganizationId', JSON.stringify(this.selectedOrganization.id));
    localStorage.setItem('selectedEditionId', JSON.stringify(this.selectedEdition.id));
    localStorage.setItem('selectedProjectId', JSON.stringify(this.selectedProject.id));

    this.setNavigation();
  }

  clearProjectData(): void {

    this.selectedProject = null;
    this.projectList = [];
    this.profileNameValue = null;
    this.profileDescriptionValue = null;
    this.isPrivate = null;
    this.selectedTeamIds = [];
    this.selectedTeams = [];
    this.teamList = [];
  }

  isValidEmail(): boolean {

    const lower = this.profileEmailValue.toLowerCase();
    const flag = lower.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
    if (flag == null) {
      this.emailError = 'Email is invalid.';
    } else {
      this.emailError = '';
    }
    return flag == null ? false : true;
  }

  onKeyDownEvent(event: any) {

    console.log(event.target.value);
    this.isValidEmail();
  }

  updateProject(): void {

    this.selectedProject.name = this.profileNameValue;
    this.selectedProject.description = this.profileDescriptionValue;
    this.selectedProject.privateProject = this.isPrivate;
    this.saveProject();
  }

  updateProjectTeams(): void {

    this.selectedProject = { ...this.selectedProject, teams: this.selectedTeamIds };
    this.saveProject();
  }

  saveProject() {

    this.showLoadingSpinner = true;

    this.projectsService.updateProject(this.projectId, this.selectedProject).subscribe({
      next: (results) => {

        this.showLoadingSpinner = false;
        this.notificationService.show('Update process complete.', null, 'success', { timeOut: 0, extendedTimeOut: 0 });
      },
      error: (error) => {
        this.showLoadingSpinner = false;
      }
    });
  }

  getTeams(): void {

    const query = 'organizationId:' + this.organizationId;

    this.refsetService.getTeams('hideOrganizationTeams=true&limit=500&offset=0&sort=name&sortAscending=true&query=' + query).subscribe((results) => {
      this.teamList = results.items;
    });
  }

  setTeamName(team: any): string {
    const roleString = team?.roles?.map((role) => {
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

    let hasAdmin = false;
    let hasAuthor = false;
    let hasReviewer = false;

    for (const team of this.selectedTeams) {

      if (team['roles']?.includes('ADMIN')) {
        hasAdmin = true;
      }

      if (team['roles']?.includes('AUTHOR')) {
        hasAuthor = true;
      }

      if (team['roles']?.includes('REVIEWER')) {
        hasReviewer = true;
      }

      if (hasAdmin && hasAuthor && hasReviewer) {
        break;
      }
    }

    if (hasAdmin && hasAuthor && hasReviewer) {
      this.containsRole = true;
      document.getElementById("save-teams-btn").title = "Save Teams";
    } else {
      this.containsRole = false;
      document.getElementById("save-teams-btn").title = "A project must have one or more teams supporting all three roles (author, reviewer, and admin) to save.";
    }
  }

  getSelectedProjectName(): string {
    return this.selectedProject?.name;
  }

  getSelectedProjectId(): string {
    return this.selectedProject?.id;
  }
}
