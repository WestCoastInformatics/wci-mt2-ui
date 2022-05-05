import { Component, OnInit } from '@angular/core';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { UsersService } from 'src/app/services/rest/users.service';

@Component({
  selector: 'personal-landing',
  templateUrl: './landing.component.html'
})
export class PersonalLandingComponent implements OnInit {
  menu:SidebarMenuItem[] = [
    {name: 'About', link: '/personal/landing', icon: 'fa fa-user', isActive: true},
    {name: 'Configuration', link: '/personal/configuration', icon: 'fa fa-cogs'}
  ];

  selectedTeam: any;
  currentUserId: any;
  user: any;
  todayDate: Date = new Date();
  organizationList = [];
  teamList = [];

  constructor(private readonly authService: AuthenticationService,
    private readonly userService: UsersService,
    private readonly refsetService: RefsetService) { }

  ngOnInit(): void {
    this.currentUserId = this.authService.getUser().id;
    this.getUser();
    this.getOrganizations();
    this.getTeams();
  }

  getUser(): void {
    this.userService.getUser(this.currentUserId).subscribe((x) => {
      this.user = x;
    });
  }

  getOrganizations(): void {
    this.refsetService.getOrganizations().subscribe((results) => {
      this.organizationList = results.items;
    });
  }


  getTeams(): void {
    this.refsetService.getTeams('limit=500&offset=0&sort=name&sortAscending=true').subscribe((results) => {
      this.teamList = results.items.filter((x) => {
        return x.members.some((member) => {
          return member.includes(this.currentUserId);
        });
      });
    });
  }

}
