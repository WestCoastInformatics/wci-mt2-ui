import { Component, Inject, TemplateRef, HostListener } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig } from '@angular/material/dialog';
import { FormBuilder, Validators, FormGroup } from "@angular/forms";

/**
 * @title Dialog
 */
@Component({
    selector: 'app-dialog',
    template: `
        <h1 mat-dialog-title>{{config.headerText}}</h1>
        <div mat-dialog-content>
            <ng-container [ngTemplateOutlet]="config.template" [ngTemplateOutletContext]="{$implicit: data}"></ng-container> 
        </div>
        
        <div mat-dialog-actions>
            <button mat-button (click)="cancel()">{{config.cancelText}}</button>
            <button mat-button (click)="confirm()">{{config.confirmText}}</button>
        </div>
    `
})
export class DialogComponent<T> {

    form: FormGroup;
    title: string;
    config: any;
    data: any;

    constructor(
        private dialogRef: MatDialogRef<DialogComponent<T>>,
        @Inject(MAT_DIALOG_DATA) private configData: any) 
    {
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