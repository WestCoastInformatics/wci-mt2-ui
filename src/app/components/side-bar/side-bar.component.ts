import { Component, OnInit } from '@angular/core';
import { ToggleService } from 'src/app/services/toggle-service/toggle.service';

@Component({
  selector: 'app-side-bar',
  templateUrl: './side-bar.component.html'
})
export class SideBarComponent implements OnInit {

  constructor(readonly toggleService: ToggleService) { }

  ngOnInit(): void {
  }

}
