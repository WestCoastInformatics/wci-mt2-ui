import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';

@Component({
  selector: 'app-people',
  templateUrl: './people.component.html'
})
export class PeopleComponent implements OnInit {

  constructor(private readonly breadcrumbService: BreadcrumbService, private readonly titleService: Title) { }

  ngOnInit(): void {
    this.titleService.setTitle('Refset Tool - Organizations');
    this.breadcrumbService.setBreadcrumbs([
      { path: '/organizations/people', label: 'Organizations' },
      { label: 'People' },
  ]);
  }

}
