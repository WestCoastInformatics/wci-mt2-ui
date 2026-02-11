import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService } from 'src/app/services/notification.service';
import { OrganizationsService } from 'src/app/services/rest/organizations.service';
import { OrganizationsComponentService } from 'src/app/pages/organizations/organizations-component.service';
import { UiUtility } from 'src/app/utilities/ui.utility';

@Component({
	standalone: false,
	selector: 'organization-configuration',
	templateUrl: './configuration.component.html',
	styleUrls: ['configuration.component.scss'],
})
export class OrganizationConfigurationComponent implements OnInit, AfterViewInit, OnDestroy {
	routerParamsSubscription: Subscription;
	routerEventSubscription: Subscription;
	organization: any = {};
	profileNameValue = '';
	profileEmailValue = '';
	profileDescriptionValue = '';
	selectedOrganization: any;
	organizationId: any;
	organizationList = [];
	organizationSubscription: Subscription;
	emailError = '';
	showLoadingSpinner = false;
	uiUtility = UiUtility;
	currentURL: string;
	previouslyLoadedId: string;

	constructor(
		private readonly notificationService: NotificationService,
		private readonly titleService: Title,
		private readonly organizationsService: OrganizationsService,
		private readonly organizationsComponentService: OrganizationsComponentService,
		private readonly route: ActivatedRoute,
		private readonly router: Router
	) {
		document.body.scrollTop = 0;
	}

	ngOnInit(): void {
		this.titleService.setTitle('Reference Set Tool - Organizations');

		this.routerParamsSubscription = this.route.params.subscribe((params) => {
			this.organizationId = params['organizationId'];
		});

		this.routerEventSubscription = this.router.events.subscribe((event) => {
			if (this.router.url.includes('organizations') && this.router.url.includes('configuration')) {
				this.checkLocationPath(this.router.url);
			} else {
				this.ngOnDestroy();
			}
		});

		this.profileNameValue = '';
		this.profileEmailValue = '';
		this.profileDescriptionValue = '';
		this.selectedOrganization = {};
		this.getOrganizations();
	}

	ngAfterViewInit(): void {
		if (document.getElementById('audit-button')) {
			document.getElementById('audit-button').className = 'rt2-btn rt2-action-btn';
		}
	}

	checkLocationPath(url) {
		if (this.currentURL != url) {
			this.currentURL = url;
			if (url.includes('organizations') || url.includes('organization')) {
				const parts = url.split('/');
				for (let p = 0; p < parts.length; p++) {
					if (parts[p].includes('organizations') || parts[p].includes('organization')) {
						if (parts[p + 1] != undefined) {
							this.organizationId = parts[p + 1];
						}
					}
				}
			}
			if (this.organizationId) {
				this.profileNameValue = '';
				this.profileEmailValue = '';
				this.profileDescriptionValue = '';
				this.selectedOrganization = {};
				this.getOrganizations();
			}
		}
	}

	getOrganizations(): void {
		const organization_id = this.organizationId;
		this.organizationSubscription = this.organizationsComponentService.getOrganizations().subscribe((results) => {
			this.organizationList = <any>results;

			for (const organization of this.organizationList) {
				if (organization_id === organization.id) {
					this.selectedOrganization = organization;
					this.selectOrganization();
					return;
				}
			}
		});
	}

	selectOrganization(): void {
		this.setOrganizationData(this.selectedOrganization);
		this.organizationId = this.selectedOrganization.id;
	}

	setOrganizationData(organization: any) {
		this.organization = organization;
		this.organizationId = organization.id;
		this.selectedOrganization = organization;
		this.profileNameValue = organization.name;
		this.profileEmailValue = organization.primaryContactEmail;
		this.profileDescriptionValue = organization.description;

		localStorage.setItem('selectedOrganizationId', JSON.stringify(this.selectedOrganization.id));
	}

	isEmailOrOrganizationChange() {
		if (this.profileEmailValue !== this.organization.primaryContactEmail || this.profileDescriptionValue !== this.organization.description) {
			return true;
		}

		return false;
	}

	updateOrganization(): void {
		this.selectedOrganization.name = this.profileNameValue;
		this.selectedOrganization.primaryContactEmail = this.profileEmailValue;
		this.selectedOrganization.description = this.profileDescriptionValue;

		this.organizationsService.updateOrganization(this.organizationId, this.selectedOrganization).subscribe((result) => {
			if (result) {
				this.notificationService.show('Profile was successfully updated', 'Success', 'success', {
					timeOut: 3000,
					extendedTimeOut: 0,
				});
			}
		});
	}

	isValidEmail(): boolean {
		const lower = this.profileEmailValue.toLowerCase();
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

	getSelectedOrganizationName(): string {
		return this.selectedOrganization?.name;
	}

	getSelectedOrganizationId(): string {
		return this.selectedOrganization?.id;
	}

	onPhotoChange(event) {
		const file: File = event.target.files[0];

		if (file) {
			const formData = new FormData();
			formData.append('file', file);

			this.organizationsService.updateOrganizationPhoto(this.organizationId, formData).subscribe((iconUri) => {
				this.notificationService.show('Profile photo was successfully updated', 'Success', 'success', {
					timeOut: 3000,
					extendedTimeOut: 0,
				});
				this.selectedOrganization.iconUri = iconUri;
			});
		}
	}

	onPhotoDelete() {
		if (confirm('Are you sure you want to delete this profile photo?')) {
			try {
				this.organizationsService.deleteOrganizationPhoto(this.organizationId).subscribe(() => {
					this.notificationService.show('Profile photo was successfully deleted', 'Success', 'success', { timeOut: 3000, extendedTimeOut: 0 });
					this.selectedOrganization.iconUri = null;
				});
			} catch {
				this.notificationService.show('Failed to delete Profile photo', 'Error', 'error', { timeOut: 3000, extendedTimeOut: 0 });
				return;
			}
		}
	}

	ngOnDestroy() {
		if (this.routerParamsSubscription) {
			this.routerParamsSubscription.unsubscribe();
		}
		if (this.routerEventSubscription) {
			this.routerEventSubscription.unsubscribe();
		}
		if (this.organizationSubscription) {
			this.organizationSubscription.unsubscribe();
		}
	}
}
