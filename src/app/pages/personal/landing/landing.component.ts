import { Component, OnInit } from '@angular/core';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';

@Component({
  selector: 'personal-landing',
  templateUrl: './landing.component.html'
})
export class PersonalLandingComponent implements OnInit {
  menu:SidebarMenuItem[] = [
    {name: 'People', link: '/personal/landing', icon: 'fa fa-user', isActive: true},
    {name: 'Configuration', link: '/personal/configuration', icon: 'fa fa-cogs'}
  ];

  constructor() { }

  ngOnInit(): void {
  }

}
