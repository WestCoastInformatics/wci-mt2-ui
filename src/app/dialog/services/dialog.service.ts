import { TemplateRef } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { first, map, take } from 'rxjs/operators';

// Components
import { DialogComponent } from '../components/dialog.component';

type DialogRef<T> = MatDialogRef<DialogComponent<T>>;

export class DialogService<T = undefined> {

	opened$ = this.dialogRef.afterOpened().pipe(first());

	constructor(private dialogRef: DialogRef<T>) {}

	get context() {
		return this.dialogRef.componentInstance.config.context;
	}
	
	public cancel() {
		this.dialogRef.close();
	}

	public confirmed(): Observable<any> {

		return this.dialogRef.afterClosed().pipe(take(1), map(data => {
			return data;
		}
		));
	}

	setHeaderText(headerText: string): void {
		this.dialogRef.componentInstance.config.headerText = headerText;
	}

	setTemplate(template: TemplateRef<any>): void {
		this.dialogRef.componentInstance.config.template = template;
	}
}