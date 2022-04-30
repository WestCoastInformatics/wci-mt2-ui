import { Component, OnInit } from '@angular/core';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { NotificationService } from 'src/app/services/notification.service';
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
  iconUriValue: '';

  constructor(private readonly authService: AuthenticationService,private notificationService: NotificationService,
  private readonly userService: UsersService) { }

  ngOnInit(): void {
    this.currentUserId = this.authService.getUser().id;
    this.getUser();
  }

  getUser(): void {
    this.userService.getUser(this.currentUserId).subscribe((x) => {
      this.user = x;
      this.profileNameValue = this.user?.name;
      this.profileCompanyValue = this.user?.company;
      this.profileEmailValue = this.user?.email;
      this.iconUriValue = this.user?.iconUri;
    });
  }

  updateProfile(): void {
    this.user.name = this.profileNameValue;
    this.user.email = this.profileEmailValue;
    this.user.company = this.profileCompanyValue;
    this.userService.updateUser(this.currentUserId, this.user).subscribe((x) => {
      if(x){
        this.notificationService.show("Profile was successfully updated", "Success", 'success', { timeOut: 3000, extendedTimeOut: 0 });
      }
    });
  }

  onPhotoChange(event){
    const file:File = event.target.files[0];

    if (file) {
        const formData = new FormData();
        formData.append("file", file);
        this.userService.updateUserPhoto(this.currentUserId, formData).subscribe((result) => {
          this.notificationService.show("Profile photo was successfully updated", "Success", 'success', { timeOut: 3000, extendedTimeOut: 0 });
          this. getUser();
        });
    }
  }
}
