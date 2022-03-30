import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-organizations-sidebar',
  templateUrl: './sidebar.component.html'
})
export class OrganizationsSidebarComponent implements OnInit {

  @Input('activeRoute') activeRoute;

  constructor() { }

  ngOnInit() {
  }

  activeClass(name){
    name = name.toLowerCase()
    if(this.activeRoute && name === this.activeRoute.toLowerCase()){
      return "active"
    }
    return "";
  }

}
