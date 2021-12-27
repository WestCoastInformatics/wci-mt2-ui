import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import {ICellRendererParams} from "ag-grid-community";
import { DialogFactoryService } from 'src/app/dialog/services/dialog-factory.service';
import { DialogService } from 'src/app/dialog/services/dialog.service';
import { CodeUtility } from 'src/app/utilities/code.utility';

/**
 * @title Tree with nested nodes
 */
@Component({
    selector: 'app-column-chooser',
    templateUrl: './column-chooser.component.html',
    encapsulation: ViewEncapsulation.None
})

export class ColumnChooserComponent {

    dialog: DialogService;
    
    columns = [];
    selectedColumns = [];
    @Input() gridColumnApi;
    @Input() disabled: boolean = false;
    @Input() useDialog: boolean = true;
    @Input() manualStateRefresh = false;
    @ViewChild('columnChooserSection') columnChooserDialog: TemplateRef<any>;
 
    constructor(
        private dialogFactoryService: DialogFactoryService,
        private changeDetectorRef: ChangeDetectorRef
    ) {
    }

    ngOnChanges() {

        if (this.gridColumnApi?.columnController?.columnDefs){

            // make sure not to lose previous column selections
            let previousColumns = this.columns;
            this.columns = [];

            if (this.columns.length > 0) {
                this.selectedColumns = [];
            }
            
            let detectChanges = false;

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

                let previousColumn = previousColumns.find(element => element.colId == columnData.colId);
    
                // apply previous column selections if there were any
                if (previousColumn) {

                    columnData.show = previousColumn.show;

                    if (columnData.show) {
                        this.selectedColumns.push(columnData);
                    }

                } else if (!column.hasOwnProperty('hide') || column.hide === false){
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
            confirmText: 'Okay',
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
                this.applyColumns();
            }
        });
    }

    valueCompare(column1, column2) {
        return column1 && column2 ? column1.colId === column2.colId : column1 === column2;
    }

    applyColumns() {

        let state: any = [];
        this.selectedColumns;
        this.columns;

        for (let column of this.columns){

            if (!this.useDialog){

                let found = false;

                for (let selectedColumn of this.selectedColumns) {
                    
                    if (column.colId === selectedColumn.colId) {

                        found = true;
                        break;
                    }
                }

                column.show = found;
            }

            state.push({colId: column.colId, hide: !column.show});
        }

        this.gridColumnApi.applyColumnState({state: state});
    }
 }