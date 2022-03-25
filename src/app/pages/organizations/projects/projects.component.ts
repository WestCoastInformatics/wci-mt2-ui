import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html'
})
export class ProjectsComponent implements OnInit {

  constructor(private readonly breadcrumbService: BreadcrumbService, private readonly titleService: Title) { }

  ngOnInit(): void {
    this.titleService.setTitle('Refset Tool - Organizations');
    this.breadcrumbService.setBreadcrumbs([
      { path: '/organizations/projects', label: 'Organizations' },
      { label: 'Projects' },
  ]);
  }

}
