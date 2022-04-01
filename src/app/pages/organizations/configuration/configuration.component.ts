import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';

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
  constructor(private readonly breadcrumbService: BreadcrumbService, private readonly titleService: Title) { }

  ngOnInit(): void {
    this.titleService.setTitle('Refset Tool - Organizations');
    this.breadcrumbService.setBreadcrumbs([
      { path: '/organizations/configuration', label: 'Organizations' },
      { label: 'Configurations' },
  ]);
  }

}
