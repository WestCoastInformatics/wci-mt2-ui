import { ChangeDetectorRef, Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { DialogService } from 'src/app/dialog/services/dialog.service';
import { DialogFactoryService } from 'src/app/dialog/services/dialog-factory.service';
import { Observable } from 'rxjs';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { Refset } from 'src/app/models/refset';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { data } from 'jquery';


/**
 * @title Tree with nested nodes
 */
@Component({
    selector: 'app-refset-download',
    templateUrl: 'refset-download.component.html'
})

export class RefsetDownloadComponent {

    @Input() refset;
    @Input() buttonClasses: String = '';
    
    formatOptions: any[];
    contentOptions: any[];
    languageOptions: any[];
    versionOptions: any[];
    comparisonFromOptions: any[];
    comparisonToOptions: any[];
    showContent = false;
    showLanguages = false;
    showVersions = false;
    showComparison = false;
    
    dialog: DialogService;


    @ViewChild('refsetDownloadDialog') downloadDialog: TemplateRef<any>;

    constructor(
        private dialogFactoryService: DialogFactoryService,
        private changeDetectorRef: ChangeDetectorRef,
    ) {
    }

    //***** Framework Functions *****/
    ngOnInit() {

        this.formatOptions = [{ value: 'rf2', display: 'RF2' }, { value: 'rf2_with_names', display: 'RF2 With Names' }, { value: 'free_set', display: 'Free Set' }, { value: 'sctids', display: 'List Of Sct IDs' }];
        this.contentOptions = [{ value: 'snapshot', display: 'Snapshot' }, { value: 'delta', display: 'Delta' }, { value: 'snapshot_delta', display: 'Snapshot And Delta' }];
        this.languageOptions = [{ value: '1', display: 'US English (PT)' }, { value: '2', display: 'Belgian French (PT)' }, { value: '3', display: 'Flemish (PT)' }];
        this.versionOptions = [{ value: '1', display: 'Latest (In Development)' }, { value: '2', display: '2020-08-23 (Published)' }, { value: '3', display: '2020-01-15 (Beta)' }];
        this.comparisonFromOptions = this.versionOptions.slice(1);
        this.comparisonToOptions = this.versionOptions.slice(0, -1);
    }

    ngAfterViewInit() {
    }

    //***** General Functions *****/
    openDownload(refsetId: string) {

        const dialogId = 'downloadDialog';

        const dialogData = {
            dialogId: dialogId,
            headerText: `Download Refset ${this.refset.name} (${this.refset.refsetId})`,
            showCancel: true,
            confirmText: 'Download',
            confirmIcon: 'download',
            template: this.downloadDialog,
            data: {
                formatOptions: this.formatOptions,
                contentOptions: this.contentOptions,
                languageOptions: this.languageOptions,
                versionOptions: this.versionOptions,
                comparisonFromOptions: this.comparisonFromOptions,
                comparisonToOptions: this.comparisonToOptions,
                refsetName: this.refset.name,
                refsetId: this.refset.refsetId
            }
        }

        const dialogOptions = {
            id: dialogId,
            disableClose: false,
            width: '1000px'
        }

        this.dialog = this.dialogFactoryService.open(dialogData, dialogOptions);

        this.dialog.confirmed().subscribe(data => {

            if (data) {
                console.log("Download Data: ", data);
            }
        });
    }

    showSections(formData){
        this.showContentSection(formData);
        this.showLanguageSection(formData);
        this.showVersionSection(formData);
        this.showComparisonSection(formData);
    }

    showContentSection(formData){

        if (CodeUtility.hasValue(formData.selectedFormat) && (formData.selectedFormat == 'rf2' || formData.selectedFormat == 'rf2_with_names')){
            this.showContent = true;
        } else {

            this.showContent = false;
            formData.selectedContent = '';
        }
    }

    showLanguageSection(formData){

        if (CodeUtility.hasValue(formData.selectedFormat) && formData.selectedFormat == 'rf2_with_names'){
            this.showLanguages = true;
        } else {
            this.showLanguages = false;
        }
    }

    showVersionSection(formData){

        if (!CodeUtility.hasValue(formData.selectedContent) || (formData.selectedContent == 'snapshot' || formData.selectedContent == 'snapshot_delta')){
            this.showVersions = true;
        } else {

            this.showVersions = false;
            formData.selectedVersion = '';
        }
    }

    showComparisonSection(formData){

        if (CodeUtility.hasValue(formData.selectedContent) && (formData.selectedContent == 'delta' || formData.selectedContent == 'snapshot_delta')){
            this.showComparison = true;
        } else {

            this.showComparison = false;
            formData.selectedComparisonFrom = '';
            formData.selectedComparisonTo = '';
        }
    }

    changeFormat(formData) {

        this.showSections(formData);
    }

    changeContent(formData) {

        this.showSections(formData);
    }

    changeComparisonFrom(formData) {

        let selectedFrom = formData.selectedComparisonFrom;
        let toOptions = this.versionOptions.slice(0, selectedFrom - 1);

        if (formData.selectedComparisonTo >= selectedFrom){
            formData.selectedComparisonTo = '';
        }

        formData.comparisonToOptions = toOptions;
    }
}