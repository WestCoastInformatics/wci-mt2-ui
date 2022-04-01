import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';

@Component({
  selector: 'teams-configuration',
  templateUrl: './configuration.component.html'
})
export class TeamsConfigurationComponent implements OnInit {
  menu:SidebarMenuItem[] = [
    {name: 'People', link: '/teams/people', icon: 'fa fa-user', isActive: true},
    {name: 'Configuration', link: '/teams/configuration', icon: 'fa fa-cogs'}
  ];

  profileNameValue = '';
  profileEmailValue = '';
  profileDescriptionValue = '';

  constructor(private readonly breadcrumbService: BreadcrumbService, private readonly titleService: Title) { }

  ngOnInit(): void {
    this.titleService.setTitle('Refset Tool - Teams');
    this.breadcrumbService.setBreadcrumbs([
      { path: '/teams/configuration', label: 'Teams' },
      { label: 'Configurations' },
  ]);
  }

}
