import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';

@Component({
  selector: 'projects-configuration',
  templateUrl: './configuration.component.html'
})
export class ProjectsConfigurationComponent implements OnInit {
  menu:SidebarMenuItem[] = [
    {name: 'Reference Sets', link: '/projects', icon: 'fa fa-copy'},
    {name: 'People', link: '/projects/people', icon: 'fa fa-user'},
    {name: 'Configuration', link: '/projects/configuration', icon: 'fa fa-cogs', isActive: true}
  ];

  constructor(private readonly breadcrumbService: BreadcrumbService, private readonly titleService: Title) { }

  ngOnInit(): void {
    this.titleService.setTitle('Refset Tool - Organizations');
    this.breadcrumbService.setBreadcrumbs([
      { path: '/organizations/configuration', label: 'Organizations' },
      { label: 'Configurations' },
  ]);
  }

}
