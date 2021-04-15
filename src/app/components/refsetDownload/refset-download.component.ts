import { ChangeDetectorRef, Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { DialogService } from 'src/app/dialog/services/dialog.service';
import { DialogFactoryService } from 'src/app/dialog/services/dialog-factory.service';
import { Observable } from 'rxjs';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { Refset } from 'src/app/models/refset';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { UiUtility } from 'src/app/utilities/ui.utility';


/**
 * @title Tree with nested nodes
 */
@Component({
    selector: 'app-refset-download',
    templateUrl: 'refset-download.component.html'
})

export class RefsetDownloadComponent {

    @Input() refset;
    
    formatOptions: any[];
    contentOptions: any[];
    languageOptions: any[];
    comparisonOptions: any[];
    
    dialog: DialogService;


    @ViewChild('refsetDownloadDialog') downloadDialog: TemplateRef<any>;

    constructor(
        private dialogFactoryService: DialogFactoryService,
    ) {
    }

    //***** Framework Functions *****/
    ngOnInit() {

        this.formatOptions = [{ value: 'rf2', display: 'RF2' }, { value: 'rf2_with_names', display: 'RF2 With Names' }, { value: 'free_set', display: 'Free Set' }, { value: 'sctids', display: 'List Of Sct IDs' }];
        this.contentOptions = [{ value: 'snapshot', display: 'Snapshot' }, { value: 'delta', display: 'Delta' }, { value: 'snapshot_delta', display: 'Snapshot And Delta' }];
        this.languageOptions = [{ value: '1', display: 'US English (PT)' }, { value: '2', display: 'Belgian French (PT)' }, { value: '3', display: 'Flemish (PT)' }];
        this.comparisonOptions = [{ value: '1', display: '2020-01-15 (Beta)' }, { value: '2', display: '2020-08-23 (Published)' }, { value: '3', display: 'Latest (In Development)' }];
    }

    ngAfterViewInit() {
    }

    //***** General Functions *****/
    openDownload(refsetId: string) {

        const dialogId = 'downloadDialog';

        const dialogData = {
            dialogId: dialogId,
            headerText: `Download Refset ${this.refset.name} (${this.refset.refsetId})`,
            showCancel: false,
            template: this.downloadDialog,
            data: {
                formatOptions: this.formatOptions,
                contentOptions: this.contentOptions,
                languageOptions: this.languageOptions,
                comparisonOptions: this.comparisonOptions,
                refsetName: this.refset.name,
                refsetId: this.refset.refsetId
            }
        }

        const dialogOptions = {
            id: dialogId,
            disableClose: false
        }

        this.dialog = this.dialogFactoryService.open(dialogData, dialogOptions);

        this.dialog.confirmed().subscribe(data => {

            if (data) {
                console.log("Download Data: ", data);
            }
        });
    }
}