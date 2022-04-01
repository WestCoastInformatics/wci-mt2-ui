import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';

@Component({
  selector: 'projects-configuration',
  templateUrl: './configuration.component.html'
})
export class ProjectsConfigurationComponent implements OnInit {

  profileNameValue = '';
  profileEmailValue = '';
  profileDescriptionValue = '';
  isPrivate = false;

  constructor(private readonly breadcrumbService: BreadcrumbService, private readonly titleService: Title) { }

  ngOnInit(): void {
    this.titleService.setTitle('Refset Tool - Projects');
    this.breadcrumbService.setBreadcrumbs([
      { path: '/projects/configuration', label: 'Projects' },
      { label: 'Configurations' },
  ]);
  }

}
