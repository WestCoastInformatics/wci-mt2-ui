import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { NotificationService } from 'src/app/services/notification.service';
import { UsersService } from 'src/app/services/rest/users.service';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { Location } from '@angular/common';

@Component({
  selector: 'personal-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['configuration.component.scss']
})
export class PersonalConfigurationComponent implements OnInit {

  menu: SidebarMenuItem[] = [];
  userId: any;
  profileNameValue = '';
  profileCompanyValue = '';
  profileEmailValue = '';
  selectedTeam: any;
  emailError = '';
  currentUserId: any;
  user: any;
  uiUtility = UiUtility;

  constructor(private authService: AuthenticationService,
    private notificationService: NotificationService,
    private userService: UsersService,
    private readonly route: ActivatedRoute,
    private location: Location) {
  }

  ngOnInit(): void {

    this.currentUserId = this.authService.getUser().id;

    this.route.params.subscribe(params => {

      if (params['userId']) {
        this.userId = params['userId'];
      } else {
        this.userId = this.authService.getUser().id;
      }

      this.setNavigation();
    });

    this.getUser();
  }

  setNavigation() {

    this.menu = [
      { name: 'About', link: '/personal/' + this.userId + '/landing', icon: 'fa fa-user' },
      { name: 'Configuration', link: '/personal/' + this.userId + '/configuration', icon: 'fa fa-cogs', isActive: true }
    ];

    this.location.replaceState('personal/' + this.userId + '/configuration');
  }

  getUser(): void {

    this.userService.getUser(this.currentUserId).subscribe((x) => {

      this.user = x;
      this.profileNameValue = this.user?.name;
      this.profileCompanyValue = this.user?.company;
      this.profileEmailValue = this.user?.email;
    });
  }

  updateProfile(): void {

    this.user.name = this.profileNameValue;
    this.user.email = this.profileEmailValue;
    this.user.company = this.profileCompanyValue;
    this.userService.updateUser(this.currentUserId, this.user).subscribe((user) => {

      if (user) {

        this.authService.updateUser(user);
        this.notificationService.show('Profile was successfully updated', 'Success', 'success', { timeOut: 3000, extendedTimeOut: 0 });
      }
    });
  }

  onPhotoChange(event) {

    const file: File = event.target.files[0];

    if (file) {

      const formData = new FormData();
      formData.append('file', file);

      this.userService.updateUserPhoto(this.currentUserId, formData).subscribe((iconUri) => {

        this.notificationService.show('Profile photo was successfully updated', 'Success', 'success', { timeOut: 3000, extendedTimeOut: 0 });
        this.user.iconUri = iconUri;
        this.authService.updateUser(this.user);
      });
    }
  }

  onPhotoDelete() {

    if (confirm('Are you sure you want to delete this profile photo?')) {
      this.userService.deleteUserPhoto(this.currentUserId).subscribe(() => {
        try {
          this.notificationService.show('Profile photo was successfully deleted', 'Success', 'success', { timeOut: 3000, extendedTimeOut: 0 });
          this.user.iconUri = null;
          this.authService.updateUser(this.user);
        } catch {
          this.notificationService.show('Failed to delete Profile photo', 'Error', 'error', { timeOut: 3000, extendedTimeOut: 0 });
          return;
        }

      });
    }
  }

  isValidEmail(): boolean {

    const lower = this.profileEmailValue?.toLowerCase() ?? '';
    const flag = lower.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);

    if (flag == null) {
      this.emailError = 'Email is invalid.';
    } else {
      this.emailError = '';
    }

    return flag != null;
  }

  onKeyDownEvent(event: any) {
    this.isValidEmail();
  }
}
