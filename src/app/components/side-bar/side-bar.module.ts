import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SideBarComponent } from './side-bar.component';
import { RouterModule } from '@angular/router';



@NgModule({
  declarations: [
    SideBarComponent
  ],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [
    SideBarComponent
  ]
})
export class SideBarModule { }
