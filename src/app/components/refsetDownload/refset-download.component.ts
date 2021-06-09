import { ChangeDetectorRef, Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { DialogService } from 'src/app/dialog/services/dialog.service';
import { DialogFactoryService } from 'src/app/dialog/services/dialog-factory.service';
import { Observable } from 'rxjs';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { Refset } from 'src/app/models/refset';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { data } from 'jquery';
import { RefsetUtility } from 'src/app/utilities/refset.utility';


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
    selectedVersionDate = '';
    
    dialog: DialogService;


    @ViewChild('refsetDownloadDialog') downloadDialog: TemplateRef<any>;

    constructor(
        private dialogFactoryService: DialogFactoryService,
        private changeDetectorRef: ChangeDetectorRef,
        private refsetService: RefsetService,
    ) {
    }

    //***** Framework Functions *****/
    ngOnInit() {
    }

    ngAfterViewInit() {
    }

    //***** General Functions *****/
    openDownload(refsetId: string) {

        this.formatOptions = [{ value: 'rf2', display: 'RF2' }, { value: 'rf2_with_names', display: 'RF2 With Names' }, { value: 'free_set', display: 'Free Set' }, { value: 'sctids', display: 'List Of Sct IDs' }];
        this.contentOptions = [{ value: 'snapshot', display: 'Snapshot' }];
        this.languageOptions = [{ value: '900000000000509007PT', display: 'EN (PT)' }];
        let languageRefsetOptions = [];
        let selectedLanguage = "";
        this.versionOptions = RefsetUtility.getVersionOptions(this.refset, 'date');
        this.comparisonFromOptions = this.versionOptions;
        this.comparisonToOptions = this.versionOptions;
        let versionDate = RefsetUtility.getVersionDate(this.refset);

        for (let language of this.refset?.edition?.fullyQualifiedLanguageRefsets) {

            let optionDetails: any = { value: language.qualifiedLanguageRefset, display: language.qualifiedLanguageCode };

            if (CodeUtility.testBoolean(language.default)){
                selectedLanguage = language.qualifiedLanguageRefset;
            }

            languageRefsetOptions.push(optionDetails);
        }

        if (languageRefsetOptions.length > 0){
            this.languageOptions = languageRefsetOptions
        }

        if (this.versionOptions.length > 1) {

            this.contentOptions.push(...[{ value: 'delta', display: 'Delta' }, { value: 'snapshot_delta', display: 'Snapshot And Delta' }]);
            this.comparisonFromOptions = this.versionOptions.slice(1);
            this.comparisonToOptions = this.versionOptions.slice(0, -1);
        }

        this.selectedVersionDate = CodeUtility.formatJsonDate(versionDate, CodeUtility.DATE_FORMAT_REVERSE);

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
                refsetId: this.refset.refsetId,
                selectedContent: 'snapshot',
                selectedVersion: this.selectedVersionDate,
                selectedLanguage: selectedLanguage,
                selectedComparisonTo: this.selectedVersionDate,
                exportMetadata: false
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

                console.log("Download Form Data: ", data);

                let fileNameDate: any = this.selectedVersionDate;

                if (fileNameDate == '') {
                    fileNameDate = CodeUtility.getCurrentDate();
                }

                fileNameDate = fileNameDate.replaceAll('-', '');

                let params = {
                    format: data.selectedFormat,
                    exportType: data.selectedContent.toUpperCase(),
                    languageId: data.selectedLanguage,
                    fileNameDate: fileNameDate, 
                    //startEffectiveTime: null,
                    transientEffectiveTime: fileNameDate,
                    exportMetadata: data.exportMetadata
                };

                this.refsetService.downloadRefset(this.refset.id, params).subscribe(results => {
                    console.log("Export Call Results: ", results);

                    if (results?.url) {
                        window.open(results.url);
                    }
                    
                });
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
        }
    }

    showComparisonSection(formData){

        if (CodeUtility.hasValue(formData.selectedContent) && (formData.selectedContent == 'delta' || formData.selectedContent == 'snapshot_delta')){
            this.showComparison = true;
        } else {

            this.showComparison = false;
            formData.selectedComparisonFrom = '';
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