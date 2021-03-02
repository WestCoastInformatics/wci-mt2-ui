import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

// Components
import { DialogComponent } from './components/dialog.component';

@NgModule({
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule
  ],
  exports: [DialogComponent],
  declarations: [DialogComponent],
  entryComponents: [DialogComponent]
})

export class DialogModule { }