import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';

@Component({
  selector: 'teams-configuration',
  templateUrl: './configuration.component.html'
})
export class TeamsConfigurationComponent implements OnInit {

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
