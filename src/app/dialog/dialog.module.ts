import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

// Components
import { DialogComponent } from './components/dialog.component';

@NgModule({
	imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
	exports: [DialogComponent],
	declarations: [DialogComponent],
})
export class DialogModule {}
