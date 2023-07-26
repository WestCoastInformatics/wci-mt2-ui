import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { NotificationService } from 'src/app/services/notification.service';
import { UsersService } from 'src/app/services/rest/users.service';
import { PersonalComponentService } from 'src/app/pages/personal/personal-component.service';
import { UiUtility } from 'src/app/utilities/ui.utility';

@Component({
	selector: 'personal-configuration',
	templateUrl: './configuration.component.html',
	styleUrls: ['configuration.component.scss'],
})
export class PersonalConfigurationComponent implements OnInit, OnDestroy {
	routerParamsSubscription: Subscription;
	routerEventSubscription: Subscription;
	userId: any;
	profileNameValue = '';
	profileCompanyValue = '';
	profileEmailValue = '';
	selectedTeam: any;
	emailError = '';
	currentUserId: any;
	user: any;
	uiUtility = UiUtility;
	currentURL: string;
	personalSubscription: Subscription;

	constructor(
		private authService: AuthenticationService,
		private notificationService: NotificationService,
		private userService: UsersService,
		private readonly personalComponentService: PersonalComponentService,
		private readonly route: ActivatedRoute,
		private readonly router: Router
	) {}

	ngOnInit(): void {
		this.currentUserId = this.authService.getUser().id;

		this.routerParamsSubscription = this.route.params.subscribe((params) => {
			if (params['userId']) {
				this.userId = params['userId'];
			} else {
				this.userId = this.authService.getUser().id;
			}
		});

		this.routerEventSubscription = this.router.events.subscribe((event) => {
			if (this.router.url.includes('personal')) {
				this.checkLocationPath(this.router.url);
			} else {
				this.ngOnDestroy();
			}
		});

		this.getUser();
	}

	checkLocationPath(url) {
		if (this.currentURL != url) {
			this.currentURL = url;
			const parts = url.split('/');
			for (let p = 0; p < parts.length; p++) {
				if (parts[p].includes('personal')) {
					if (parts[p + 1] != undefined) {
						this.userId = parts[p + 1];
					}
				}
			}

			if (this.userId) {
				this.user = '';
				this.profileNameValue = '';
				this.profileCompanyValue = '';
				this.profileEmailValue = '';
				this.getUser();
			}
		}
	}

	getUser(): void {
		this.personalSubscription = this.personalComponentService.getUser().subscribe({
			next: (result) => {
				this.user = result;
				this.profileNameValue = this.user?.name;
				this.profileCompanyValue = this.user?.company;
				this.profileEmailValue = this.user?.email;
			},
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

	ngOnDestroy() {
		if (this.routerParamsSubscription) {
			this.routerParamsSubscription.unsubscribe();
		}
		if (this.routerEventSubscription) {
			this.routerEventSubscription.unsubscribe();
		}
		if (this.personalSubscription) {
			this.personalSubscription.unsubscribe();
		}
	}
}
