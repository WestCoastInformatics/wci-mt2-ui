import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';

@Component({
  selector: 'organization-configuration',
  templateUrl: './configuration.component.html'
})
export class OrganizationConfigurationComponent implements OnInit {

  constructor(private readonly breadcrumbService: BreadcrumbService, private readonly titleService: Title) { }

  ngOnInit(): void {
    this.titleService.setTitle('Refset Tool - Organizations');
    this.breadcrumbService.setBreadcrumbs([
      { path: '/organizations/configuration', label: 'Organizations' },
      { label: 'Configurations' },
  ]);
  }

}
