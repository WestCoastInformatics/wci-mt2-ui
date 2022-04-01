import { Component, OnInit } from '@angular/core';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';

@Component({
  selector: 'personal-configuration',
  templateUrl: './configuration.component.html'
})
export class PersonalConfigurationComponent implements OnInit {
  menu:SidebarMenuItem[] = [
    {name: 'People', link: '/personal/landing', icon: 'fa fa-user'},
    {name: 'Configuration', link: '/personal/configuration', icon: 'fa fa-cogs', isActive: true}
  ];

  profileNameValue = '';
  profileCompanyValue = '';
  profileEmailValue = '';

  constructor() { }

  ngOnInit(): void {
  }

}
