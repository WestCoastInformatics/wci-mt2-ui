import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { NotificationService } from 'src/app/services/notification.service';
import { OrganizationsService } from 'src/app/services/rest/organizations.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';

@Component({
    selector: 'organization-configuration',
    templateUrl: './configuration.component.html',
    styleUrls: ['configuration.component.scss']
})
export class OrganizationConfigurationComponent implements OnInit {

    menu: SidebarMenuItem[] = [];
    organization:any = {};
    profileNameValue = '';
    profileEmailValue = '';
    profileDescriptionValue = '';
    selectedOrganization: any;
    organizationId: any;
    organizationList = [];
    emailError = '';
    showLoadingSpinner = false;
    uiUtility = UiUtility;

    constructor(private readonly breadcrumbService: BreadcrumbService,
        private readonly notificationService: NotificationService,
        private readonly titleService: Title,
        private readonly refsetService: RefsetService,
        private readonly organizationsService: OrganizationsService,
        private authenticationService: AuthenticationService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private location: Location) {
        document.body.scrollTop = 0;
    }

    ngOnInit(): void {

        this.titleService.setTitle('Reference Set Tool - Organizations');

        this.route.params.subscribe(params => {

            this.organizationId = params['organizationId'];
            this.setNavigation();
        });

        this.getOrganizations();
    }

    ngAfterViewInit(): void {
        if (document.getElementById("audit-button")) {
            document.getElementById("audit-button").className = "rt2-btn rt2-action-btn";
        }
    }

    setNavigation() {

        this.breadcrumbService.setBreadcrumbs([
            { path: '/dashboard', label: 'Dashboard' },
            { label: this.selectedOrganization?.name ? this.selectedOrganization?.name + ' / Configuration' : '' },
        ]);

        this.menu = [
            { name: 'Projects', link: '/organizations/' + this.organizationId + '/edition/0/projects', icon: 'fa fa-folder-open' },
            { name: 'Teams', link: '/organizations/' + this.organizationId + '/teams', icon: 'fa fa-users' },
            { name: 'Users', link: '/organizations/' + this.organizationId + '/people', icon: 'fa fa-user' },
            { name: 'Configuration', link: '/organizations/' + this.organizationId + '/configuration', icon: 'fa fa-cogs', isActive: true }
        ];

        this.location.replaceState('/organizations/' + this.organizationId + '/configuration');
    }

    getOrganizations(): void {

        this.refsetService.getOrganizations().subscribe((results) => {

            this.organizationList = results.items;

            for (const organization of this.organizationList) {

                if (this.organizationId === organization.id) {

                    this.setOrganizationData(organization);
                    return;
                }
            }

            this.getStoredOrganizationId();

            if (!this.selectedOrganization) {
                this.showLoadingSpinner = false;
            }
        });
    }

    selectOrganization(): void {

        this.setOrganizationData(this.selectedOrganization);
        this.organizationId = this.selectedOrganization.id;

    }

    setOrganizationData(organization: any) {
        this.organization = organization
        this.organizationId = organization.id;
        this.selectedOrganization = organization;
        this.profileNameValue = organization.name;
        this.profileEmailValue = organization.primaryContactEmail;
        this.profileDescriptionValue = organization.description;

        localStorage.setItem('selectedOrganizationId', JSON.stringify(this.selectedOrganization.id));

        this.setNavigation();
    }

    isEmailOrOrganizationChange() {
        if (this.profileEmailValue !== this.organization.primaryContactEmail || this.profileDescriptionValue !== this.organization.description) {
            return true
        }

        return false
    }

    updateOrganization(): void {

        this.selectedOrganization.name = this.profileNameValue;
        this.selectedOrganization.primaryContactEmail = this.profileEmailValue;
        this.selectedOrganization.description = this.profileDescriptionValue;

        this.organizationsService.updateOrganization(this.organizationId, this.selectedOrganization).subscribe((result) => {

            if (result) {
                this.notificationService.show('Profile was successfully updated', 'Success', 'success', {
                    timeOut: 3000,
                    extendedTimeOut: 0
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
                    extendedTimeOut: 0
                });
                this.selectedOrganization.iconUri = iconUri;
            });
        }
    }

    onPhotoDelete() {

        if (confirm("Are you sure you want to delete this profile photo?")) {
            try {
                this.organizationsService.deleteOrganizationPhoto(this.organizationId).subscribe(() => {
                    this.notificationService.show("Profile photo was successfully deleted", "Success", 'success', { timeOut: 3000, extendedTimeOut: 0 });
                    this.selectedOrganization.iconUri = null;
                });
            }
            catch {
                this.notificationService.show("Failed to delete Profile photo", "Error", 'error', { timeOut: 3000, extendedTimeOut: 0 });
                return;
            }

        }
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
}
