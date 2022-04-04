import { Component, OnInit } from '@angular/core';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { UsersService } from 'src/app/services/rest/users.service';

@Component({
  selector: 'personal-configuration',
  templateUrl: './configuration.component.html'
})
export class PersonalConfigurationComponent implements OnInit {
  menu:SidebarMenuItem[] = [
    {name: 'About', link: '/personal/landing', icon: 'fa fa-user'},
    {name: 'Configuration', link: '/personal/configuration', icon: 'fa fa-cogs', isActive: true}
  ];

  profileNameValue = '';
  profileCompanyValue = '';
  profileEmailValue = '';
  selectedTeam: any;
  currentUserId: any;
  user: any;

  constructor(private readonly authService: AuthenticationService,
  private readonly userService: UsersService) { }

  ngOnInit(): void {
    this.currentUserId = this.authService.getUser().id;
    this.getUser();
  }

  getUser(): void {
    this.userService.getUser(this.currentUserId).subscribe((x) => {
      this.user = x;
    });
  }

  updateProfile(): void {
    this.user.name = this.profileNameValue;
    this.user.email = this.profileEmailValue;
    this.userService.updateUser(this.currentUserId, this.user).subscribe((x) => {
      console.log(x);
    });
  }
}
