import { Component, Inject, TemplateRef, HostListener } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig } from '@angular/material/dialog';
import { FormBuilder, Validators, FormGroup } from "@angular/forms";

/**
 * @title Dialog
 */
@Component({
    selector: 'app-dialog',
    templateUrl: './dialog.component.html'
})
export class DialogComponent<T> {

    form: FormGroup;
    title: string;
    config: any;
    data: any;
    id: string;

    constructor(
        private dialogRef: MatDialogRef<DialogComponent<T>>,
        @Inject(MAT_DIALOG_DATA) private configData) {
        // make sure the data here doesn't leak changes back to the original object
        this.id = dialogRef.id;
        this.config = configData;
        this.data = JSON.parse(JSON.stringify(configData.data));
        delete this.config.data;
    }

    @HostListener("keydown.esc")
    public cancel() {
        this.dialogRef.close();
    }

    public confirm() {
        this.dialogRef.close(this.data);
    }

}