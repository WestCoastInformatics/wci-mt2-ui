import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { TeamsService } from 'src/app/services/rest/teams.service';

@Component({
  selector: 'teams-configuration',
  templateUrl: './configuration.component.html'
})
export class TeamsConfigurationComponent implements OnInit {
  menu:SidebarMenuItem[] = [
    {name: 'People', link: '/teams/people', icon: 'fa fa-user'},
    {name: 'Configuration', link: '/teams/configuration', icon: 'fa fa-cogs', isActive: true}
  ];

  profileNameValue = '';
  profileEmailValue = '';
  profileDescriptionValue = '';
  selectedTeam: any;
  id: any;
  teamList = [];
  currentUser: any;
  roleOptions: any;
  selectedRoles: any;
  selectedForRemove = [];
  selectedForAdd = [];

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
      { path: '/teams/configuration', label: 'Teams' },
      { label: 'Configuration' },
    ]);

    this.roleOptions = [{ value: 'AUTHOR', display: 'Author' }, { value: 'REVIEWER', display: 'Reviewer' },
      { value: 'ADMIN', display: 'Admin' }, { value: 'VIEWER', display: 'Viewer' }];

    this.route.params.subscribe(params => {
      this.id = params['id'];
    });
    this.currentUser = this.authService.getUser();
    this.getTeam();
    this.getTeams();
  }

  selectTeam($event): void {
    this.router.navigate(['/teams/configuration', $event['value'].id]);
    this.route.params.subscribe(params => {
      this.id = params['id'];
      this.getTeam();
    });
  }

  getTeam(): void {
    this.teamsService.getTeam(this.id).subscribe((result) => {
      this.selectedTeam = result;
      this.selectedRoles = this.selectedTeam?.roles;
      this.profileNameValue = this.selectedTeam?.name;
      this.profileEmailValue = this.selectedTeam?.primaryContactEmail;
      this.profileDescriptionValue = this.selectedTeam?.description;
    });
  }

  getTeams(): void {
    this.refsetService.getTeams('limit=500&offset=0&sort=name&sortAscending=true').subscribe((results) => {
      this.teamList = results.items.filter((x) => {
        return x.members.some((member) => {
          return member.includes(this.currentUser.id);
        });
      });
      console.log(this.teamList)
    });
  }

  updateTeam(): void {
    this.selectedTeam.name = this.profileNameValue;
    this.selectedTeam.primaryContactEmail = this.profileEmailValue;
    this.selectedTeam.description = this.profileDescriptionValue;
    this.teamsService.updateTeam(this.id, this.selectedTeam).subscribe();
  }

  updateTeamRoles(): void {

    if (this.selectedTeam['roles']) {
      for (let role of this.selectedTeam['roles']) {
        if (!this.selectedRoles.includes(role)) {
          this.selectedForRemove.push(role);
        }
      }

      this.selectedForRemove.forEach((x) => {
        this.teamsService.removeRole(this.selectedTeam.id, x).subscribe();
      });
    }

    for (let role of this.selectedRoles) {
      if (!this.selectedTeam['roles'].includes(role)) {
        this.teamsService.addRole(this.selectedTeam.id, role).subscribe();
        }
      }



    console.log(this.selectedTeam.roles);
  }

  setRoles(): void {
    console.log(this.selectedRoles);
  }
}
