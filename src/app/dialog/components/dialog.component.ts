import { Component, Inject, TemplateRef, HostListener } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig } from '@angular/material/dialog';
import { FormBuilder, Validators, FormGroup } from "@angular/forms";
import { CodeUtility } from 'src/app/utilities/code.utility';

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
    confirmIcon: string;
    cancelIcon: string;
    isDisabled = true;
    disableChannel = new BroadcastChannel('disable-button-channel');

    constructor(
        private dialogRef: MatDialogRef<DialogComponent<T>>,
        @Inject(MAT_DIALOG_DATA) private configData) {
        // make sure the data here doesn't leak changes back to the original object
        this.id = dialogRef.id;
        this.config = configData;
        this.data = JSON.parse(JSON.stringify(configData.data));
        delete this.config.data;

        if (CodeUtility.hasValue(this.config.confirmIcon)) {
            this.confirmIcon = this.data.confirmIcon;
        }

        if (CodeUtility.hasValue(this.config.cancelIcon)) {
            this.cancelIcon = this.data.cancelIcon;
        }
        this.disableChannel.onmessage = (message) => {
            this.isDisabled = message.data;
            console.log(this.isDisabled);
        };
    }

    @HostListener("keydown.esc")
    public cancel() {
        this.dialogRef.close();
    }

    public confirm() {
        this.dialogRef.close(this.data);
    }

}