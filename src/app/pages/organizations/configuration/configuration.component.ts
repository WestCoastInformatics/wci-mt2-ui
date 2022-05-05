import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { NotificationService } from 'src/app/services/notification.service';
import { OrganizationsService } from 'src/app/services/rest/organizations.service';
import { RefsetService } from 'src/app/services/rest/refset.service';

@Component({
  selector: 'organization-configuration',
  templateUrl: './configuration.component.html'
})
export class OrganizationConfigurationComponent implements OnInit {
  menu:SidebarMenuItem[] = [
    {name: 'Projects', link: '/organizations/projects', icon: 'fa fa-folder-open'},
    {name: 'Teams', link: '/organizations/teams', icon: 'fa fa-users'},
    {name: 'People', link: '/organizations/people', icon: 'fa fa-user'},
    {name: 'Configuration', link: '/organizations/configuration', icon: 'fa fa-cogs', isActive: true}
  ];

  profileNameValue = '';
  profileEmailValue = '';
  profileDescriptionValue = '';
  selectedOrganization: any;
  id: any;
  organizationList = [];
  iconUriValue: '';
  emailError = '';

  constructor(private readonly breadcrumbService: BreadcrumbService,
    private readonly notificationService: NotificationService,
    private readonly titleService: Title,
    private readonly refsetService: RefsetService,
    private readonly organizationsService: OrganizationsService,
    private readonly route: ActivatedRoute,
    private readonly router: Router) { }

  ngOnInit(): void {
    this.titleService.setTitle('Refset Tool - Organizations');
    this.breadcrumbService.setBreadcrumbs([
      { path: '/organizations/configuration', label: 'Organizations' },
      { label: 'Configurations' },
    ]);

    this.route.params.subscribe(params => {
      this.id = params['id'];
    });
    // this.getPeople();
    this.getOrganization();
    this.getOrganizations();
  }

  getOrganizations(): void {
    this.refsetService.getOrganizations().subscribe((results) => {
      this.organizationList = results.items;

    });
  }

  getOrganization(): void {
    this.organizationsService.getOrganization(this.id).subscribe((result) => {
      this.selectedOrganization = result;
      this.profileNameValue = this.selectedOrganization?.name;
      this.profileEmailValue = this.selectedOrganization?.primaryContactEmail;
      this.profileDescriptionValue = this.selectedOrganization?.description;
      this.iconUriValue = this.selectedOrganization?.iconUri;
    });
  }

  updateOrganization(): void {
    this.selectedOrganization.name = this.profileNameValue;
    this.selectedOrganization.primaryContactEmail = this.profileEmailValue;
    this.selectedOrganization.description = this.profileDescriptionValue;

    this.organizationsService.updateOrganization(this.id, this.selectedOrganization).subscribe((result) => {
      if(result){
        this.notificationService.show("Profile was successfully updated", "Success", 'success', { timeOut: 3000, extendedTimeOut: 0 });
      }
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

onKeyDownEvent(event: any){
    this.isValidEmail();
}

  selectOrg($event): void {
    this.router.navigate(['/organizations/configuration', $event['value'].id]);
    this.route.params.subscribe(params => {
      this.id = params['id'];
      this.getOrganization();
    });
  }

  getSelectedOrganizationName(): string{
    return this.selectedOrganization?.name;
  }

  getSelectedOrganizationId(): string{
    return this.selectedOrganization?.id;
  }

  onPhotoChange(event){
    const file:File = event.target.files[0];

    if (file) {
        const formData = new FormData();
        formData.append("file", file);
        this.organizationsService.updateOrganizationPhoto(this.id, formData).subscribe((result) => {
          this.notificationService.show("Profile photo was successfully updated", "Success", 'success', { timeOut: 3000, extendedTimeOut: 0 });
          this.getOrganization();
        });
    }
  }
}
