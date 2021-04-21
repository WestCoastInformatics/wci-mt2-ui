import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import {ICellRendererParams} from "ag-grid-community";
import { DialogFactoryService } from 'src/app/dialog/services/dialog-factory.service';
import { DialogService } from 'src/app/dialog/services/dialog.service';
import { CodeUtility } from 'src/app/utilities/code.utility';

/**
 * @title Tree with nested nodes
 */
@Component({
    selector: 'app-column-chooser',
    templateUrl: './column-chooser.component.html'
})

export class ColumnChooserComponent {

    dialog: DialogService;
    
    columns = [];
    @Input() gridColumnApi;
    @ViewChild('columnChooserSection') columnChooserDialog: TemplateRef<any>;
 
    constructor(
        private dialogFactoryService: DialogFactoryService,
        private changeDetectorRef: ChangeDetectorRef
    ) {
    }

    ngOnChanges() {

        if (this.gridColumnApi?.columnController?.columnDefs){

            for (let column of this.gridColumnApi?.columnController?.columnDefs){

                let columnData: any = {};
    
                if (!column.colId){
                    columnData.colId = column.field;
                } else {
                    columnData.colId = column.colId;
                }
    
                if (CodeUtility.hasValue(column.headerName)){
                    columnData.name = column.headerName;
                } else {
                    columnData.name = columnData.colId;
                }
    
                if (!column.hasOwnProperty('hide') || column.hide === false){
                    columnData.show = true;
                } else {
                    columnData.show = false;
                }
    
                this.columns.push(columnData);
            }
        }
    }

    openColumnChooser(){

        const dialogId = 'columnChooserDialog';

        const dialogData = {
            dialogId: dialogId,
            showCancel: false,
            confirmText: 'Save',
            headerText: 'Select which columns to display:',
            template: this.columnChooserDialog,
            data: this.columns,
            showCloseIcon: false
        }

        const dialogOptions = {
            id: dialogId,
            width: '500px',
            disableClose: false
        }

        this.dialog = this.dialogFactoryService.open(dialogData, dialogOptions);

        this.dialog.confirmed().subscribe(data => {

            this.columns = data;

            if (data) {

                let state: any = [];

                for (let column of data){
                    state.push({colId: column.colId, hide: !column.show});
                }

                this.gridColumnApi.applyColumnState({state: state});
                //this.changeDetectorRef.detectChanges();
            }
        });
    }
 }