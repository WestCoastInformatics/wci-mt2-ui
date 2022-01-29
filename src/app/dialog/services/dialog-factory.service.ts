import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { first } from 'rxjs/operators';

// Components
import { DialogComponent } from '../components/dialog.component';

// Models
import { DialogData, DialogDataDefaults } from '../models/dialog-data.model';
import { DialogOptions, DialogOptionDefaults } from '../models/dialog-options.model';

// Services
import { DialogService } from './dialog.service';

@Injectable({
    providedIn: 'root'
})

export class DialogFactoryService<T = undefined> {

    constructor(private dialog: MatDialog) { }

    open(dialogData: DialogData, options: DialogOptions = {}): DialogService<T> {

        const configData = {
            ...DialogOptionDefaults,
            ...options,
            data: {
                ...DialogDataDefaults,
                ...dialogData
            }
        };

        // only items in configData.data get passed into the dialog constructor
        const dialogRef = this.dialog.open<DialogComponent<T>, DialogData>(DialogComponent, configData);

        dialogRef.afterClosed().pipe(first());

        return new DialogService(dialogRef);
    }
}