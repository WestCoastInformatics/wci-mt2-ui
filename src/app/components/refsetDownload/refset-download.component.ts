import { Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { DialogService } from 'src/app/dialog/services/dialog.service';
import { DialogFactoryService } from 'src/app/dialog/services/dialog-factory.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { RefsetUtility } from 'src/app/utilities/refset.utility';
import { NotificationService } from 'src/app/services/notification.service';
import { environment } from 'src/environments/environment';


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
    showMetadata = false;
    selectedVersionDate = '';
    refsetsExportableAsFreeset: string[];
    dialog: DialogService;
    @Input()
    isDetailPage: boolean;

    @ViewChild('refsetDownloadDialog') downloadDialog: TemplateRef<any>;

    constructor(
        private dialogFactoryService: DialogFactoryService,
        private refsetService: RefsetService,
        private notificationService: NotificationService
    ) {

        this.refsetsExportableAsFreeset = environment.refsetsExportableAsFreeset.split(',');
    }

    //***** General Functions *****/
    openDownload(refsetId: string) {
        this.hideSections();

        this.formatOptions = [{ value: 'rf2', display: 'RF2' }, { value: 'rf2_with_names', display: 'RF2 With Names' }, { value: 'sctids', display: 'List Of Sct IDs' }];

        if (this.refsetsExportableAsFreeset.includes(refsetId)) {
            this.formatOptions.splice(2, 0, { value: 'free_set', display: 'Free Set' });
        }

        this.contentOptions = [{ value: 'snapshot', display: 'Snapshot' }];
        this.languageOptions = [{ value: '900000000000509007PT', display: 'EN (PT)' }];
        let languageRefsetOptions = [];
        let selectedLanguage = "";
        this.versionOptions = RefsetUtility.getVersionOptions(this.refset, 'date');
        this.comparisonFromOptions = this.versionOptions;
        this.comparisonToOptions = this.versionOptions;
        let versionDate = RefsetUtility.getVersionDate(this.refset);
        this.selectedVersionDate = CodeUtility.formatJsonDate(versionDate, CodeUtility.DATE_FORMAT_REVERSE);
        let selectedVersionDateIndex = this.versionOptions.findIndex((element) => { element.value == this.selectedVersionDate });

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
            this.comparisonFromOptions =  this.versionOptions.slice(0, selectedVersionDateIndex);
            this.comparisonToOptions = this.versionOptions;
        }

        if (this.shouldShowDeltaContentLabel()) {
            this.contentOptions.push(...[{ value: 'delta', display: 'Delta' }]);
        }

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

                // if this is a free set just open the link to the GPS site
                if (data.selectedFormat == 'free_set') {

                    window.open(environment.freesetUrl);
                    return;
                }

                console.log("Download Form Data: ", data);

                let description = 'Refset ' +  this.refset.refsetId + ' download';
                let notification = this.notificationService.show('Your ' + description + ' is being generated. Do not leave this window or you will need to start again', null, 'info', {timeOut: 0, extendedTimeOut: 0});
                let fileNameDate: any = this.selectedVersionDate;

                if (fileNameDate == '') {
                    fileNameDate = CodeUtility.getCurrentDate();
                }

                fileNameDate = fileNameDate.replaceAll('-', '');

                let params: any = {
                    format: data.selectedFormat,
                    exportType: data.selectedContent.toUpperCase(),
                    languageId: data.selectedLanguage,
                    fileNameDate: fileNameDate, 
                    //startEffectiveTime: null,
                    transientEffectiveTime: fileNameDate,
                    exportMetadata: data.exportMetadata
                };

                if (data.selectedContent == 'delta') {
                    params.startEffectiveTime =data.selectedComparisonFrom.replaceAll('-', '');
                }

                this.refsetService.downloadRefset(this.refset.id, params).subscribe(results => {
                    console.log("Export Call Results: ", results);

                    if (results?.url) {

                        this.notificationService.close(notification);

                        if (results.redirect) {
                            window.open(results.url);
                        } else {

                            this.notificationService.close(notification);
                            //UiUtility.startFileDownload(this.notificationService, this.refsetService.restUrl + this.refsetService.contextPath + results.url, null, description);
                            window.open(this.refsetService.restUrl + this.refsetService.contextPath + results.url);
                        }
                    }
                    
                });
            }
        });
    }

    showSections(formData) {
        this.showContentSection(formData);
        this.showLanguageSection(formData);
        this.showVersionSection(formData);
        this.showComparisonSection(formData);
        this.showMetadataSection(formData);
    }

    private hideSections(): void {
        this.showContent = false;
        this.showLanguages = false;
        this.showComparison = false;
        this.showVersions = false;
    }

    showDeltaOption(formData): boolean {
        return (formData.selectedFormat === 'rf2' || formData.selectedFormat === 'rf2_with_names')
    }

    showContentSection(formData) {

        if (CodeUtility.hasValue(formData.selectedFormat) && (formData.selectedFormat == 'rf2' || formData.selectedFormat == 'rf2_with_names')){
            this.showContent = true;
        } else {

            this.showContent = false;
            formData.selectedContent = '';
        }
    }

    showLanguageSection(formData) {

        if (CodeUtility.hasValue(formData.selectedFormat) && formData.selectedFormat == 'rf2_with_names'){
            this.showLanguages = true;
        } else {
            this.showLanguages = false;
        }
    }

    showVersionSection(formData) {

        if (CodeUtility.hasValue(formData.selectedFormat) && formData.selectedFormat == 'free_set'){
            this.showVersions = false;

        } else if (!CodeUtility.hasValue(formData.selectedContent) || (formData.selectedContent == 'snapshot' || formData.selectedContent == 'snapshot_delta')){
            this.showVersions = true;
        } else {
            this.showVersions = false;
        }
    }

    showComparisonSection(formData) {

        if (CodeUtility.hasValue(formData.selectedContent) && (formData.selectedContent == 'delta' || formData.selectedContent == 'snapshot_delta')){
            this.showComparison = true;
        } else {

            this.showComparison = false;
            formData.selectedComparisonFrom = '';
        }
    }

    showMetadataSection(formData) {

        if (CodeUtility.hasValue(formData.selectedFormat) && formData.selectedFormat == 'free_set'){
            this.showMetadata = false;
        } else {
            this.showMetadata = true;
        }
    }

    changeFormat(formData) {

        this.showSections(formData);
    }

    changeContent(formData) {

        this.showSections(formData);
    }

    changeComparisonFrom(formData) {

        // let selectedFrom = formData.selectedComparisonFrom;
        // let toOptions = this.versionOptions.slice(0, selectedFrom - 1);

        // if (formData.selectedComparisonTo >= selectedFrom){
        //     formData.selectedComparisonTo = '';
        // }

        // formData.comparisonToOptions = toOptions;
    }

    addSpaceAfterVersionDate(stringValue: string): string {
        if (stringValue?.includes('(')) {
            return stringValue.split('(').join(' (');
        }

        return stringValue;
    }

    shouldShowDeltaContentLabel(): boolean {
        if (this.comparisonToOptions.length === 1 && this.comparisonFromOptions.length === 1) {

            return false;
        } else {
            return this.checkRefsetDates();
        }
    }

    private checkRefsetDates(): boolean {

    	const jeComparisonToDate = new Date(this.selectedVersionDate);
    	var keysToDelete = new Array();

       	for (let entry of this.comparisonFromOptions.entries()) {
	        var date;
			if (entry[1].display?.includes('(')) {
                date = new Date(entry[1].display?.split('(')[0]);
            } else {
                date = new Date(entry[1].display);

            }
               
            if (date >= jeComparisonToDate) {
		    	keysToDelete.push(entry[0]);
		    }
 		}

    	var idx = 0;
   	 	for (let key of keysToDelete) {
			this.comparisonFromOptions.splice((key - idx++), 1);
    	}

        const mappedComparisonFromOptionsArray = this.comparisonFromOptions.map((version) => {
            if (version.display?.includes('(')) {
                // tslint:disable-next-line: no-shadowed-variable
                const comparisonFromDate = new Date(version.display?.split('(')[0]);
                return comparisonFromDate?.getTime();
            } else {
                const comparisonFromDate = new Date(version.display);
                return comparisonFromDate?.getTime();
            }
        });

        const sortedComparisonFromOptionsArray = mappedComparisonFromOptionsArray.sort((a, b) => a - b);

        const comparisonToDate = new Date(this.selectedVersionDate)?.getTime();
            if (sortedComparisonFromOptionsArray[0] >= comparisonToDate) {

                return false;
            }
        return true;
    }
}
