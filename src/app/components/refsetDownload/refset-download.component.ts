import { Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { DialogService } from 'src/app/dialog/services/dialog.service';
import { DialogFactoryService } from 'src/app/dialog/services/dialog-factory.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { RefsetUtility } from 'src/app/utilities/refset.utility';
import { NotificationService } from 'src/app/services/notification.service';
import { environment } from 'src/environments/environment';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { data } from 'jquery';

/**
 * @title Tree with nested nodes
 */
@Component({
    selector: 'app-refset-download',
    templateUrl: 'refset-download.component.html'
})

export class RefsetDownloadComponent {

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
    disableChannel = new BroadcastChannel('disable-button-channel');

    @Input() refset;
    @Input() buttonClasses = '';
    @Input() isDetailPage: boolean;
    @Input() disabled = false;

    @ViewChild('refsetDownloadDialog') downloadDialog: TemplateRef<any>;

    constructor(
        private dialogFactoryService: DialogFactoryService,
        private refsetService: RefsetService,
        private notificationService: NotificationService,
        private authenticationService: AuthenticationService
    ) {
        this.refsetsExportableAsFreeset = environment.refsetsExportableAsFreeset.split(',');
    }

    // ***** General Functions *****/
    openDownload(refsetId: string) {

        const versionDate = RefsetUtility.getVersionDateForRefsetApiCall(this.refset);
        this.refsetService.getRefset(this.refset.refsetId, versionDate).subscribe({
            next: (results) => {
                this.refset = results;
                this.formatOptions = [];
                this.contentOptions = [];
                this.languageOptions = [];
                this.versionOptions = [];
                this.comparisonFromOptions = [];
                this.comparisonToOptions = [];

                this.hideSections();

                this.formatOptions = [{ value: 'rf2', display: 'RF2' }, { value: 'sctids', display: 'List Of SCTIDs' }];

                if (this.authenticationService.getUser().userName != this.authenticationService.GUEST_USER) {

                    this.formatOptions.splice(1, 0, { value: 'rf2_with_names', display: 'RF2 With Names' });
                }

                if (this.refsetsExportableAsFreeset.includes(refsetId)) {
                    this.formatOptions.splice(-1, 0, { value: 'free_set', display: 'Free Set' });
                }

                this.contentOptions = [{ value: 'snapshot', display: 'Snapshot' }];
                this.languageOptions = [{ value: '900000000000509007PT', display: 'EN (PT)' }];
                const languageRefsetOptions = [];
                let selectedLanguage = '';
                this.versionOptions = RefsetUtility.getVersionOptions(this.refset, 'date');
                if (this.versionOptions.length > 1) {
                    this.versionOptions = this.versionOptions.sort((a, b) => (a.value > b.value) ? 1 : -1);
                }
                this.comparisonFromOptions = this.versionOptions;
                this.comparisonToOptions = this.versionOptions;
                this.selectedVersionDate = CodeUtility.formatJsonDate(versionDate, CodeUtility.DATE_FORMAT_REVERSE);
                const selectedVersionDateIndex = this.versionOptions.findIndex((element) => element.value == this.selectedVersionDate);

                for (const language of (this.refset.edition.fullyQualifiedLanguageRefsets || [])) {

                    const optionDetails: any = { value: language.qualifiedLanguageRefset, display: language.qualifiedLanguageCode };

                    if (CodeUtility.testBoolean(language.default)) {
                        selectedLanguage = language.qualifiedLanguageRefset;
                    }

                    languageRefsetOptions.push(optionDetails);
                }

                if (languageRefsetOptions.length > 0) {
                    this.languageOptions = languageRefsetOptions;
                }

                if (this.versionOptions.length > 0) {
                    this.comparisonFromOptions = this.versionOptions.slice(0, selectedVersionDateIndex);
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
                    cancelText: 'Cancel',
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
                };

                const dialogOptions = {
                    id: dialogId,
                    disableClose: true,
                    width: '1000px',
                    autoFocus: false,
                    restoreFocus: false
                };

                this.dialog = this.dialogFactoryService.open(dialogData, dialogOptions);
                this.disableDownloadButton(data);

                this.dialog.confirmed().subscribe(data => {

                    if (data) {

                        // if this is a free set just open the link to the GPS site
                        if (data.selectedFormat == 'free_set') {

                            window.open(environment.freesetUrl);
                            return;
                        }

                        console.log('Download Form Data: ', data);
                        const notificationType = 'success';

                        const description = 'Refset ' + this.refset.refsetId + ' download';
                        const notification = this.notificationService.show('Your ' + description + ' is being generated.', null, notificationType, { timeOut: 0, extendedTimeOut: 0 });
                        let fileNameDate: any = this.selectedVersionDate;

                        if (fileNameDate == '' || fileNameDate == RefsetUtility.IN_DEVELOPMENT) {
                            fileNameDate = CodeUtility.getCurrentDate();
                        }

                        fileNameDate = fileNameDate.replaceAll('-', '');

                        const params: any = {
                            format: data.selectedFormat,
                            exportType: data.selectedContent.toUpperCase(),
                            languageId: data.selectedLanguage,
                            fileNameDate: fileNameDate,
                            transientEffectiveTime: fileNameDate,
                            exportMetadata: data.exportMetadata
                        };

                        if (data.selectedContent == 'delta') {
                            params.startEffectiveTime = data.selectedComparisonFrom.replaceAll('-', '');
                        }

                        this.refsetService.downloadRefset(this.refset.id, params).subscribe(results => {
                            console.log('Export Call Results: ', results);

                            if (results?.url) {

                                this.notificationService.close(notification);

                                if (results.redirect) {
                                    window.open(results.url);
                                } else {

                                    this.notificationService.close(notification);
                                    window.open(this.refsetService.restUrl + this.refsetService.contextPath + results.url);
                                }
                            }

                        });
                    }
                });

            },
            error: (error) => {
                console.log(error);
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
        this.disableDownloadButton(formData);
        return (formData.selectedFormat === 'rf2' || formData.selectedFormat === 'rf2_with_names');
    }

    showContentSection(formData) {

        if (CodeUtility.hasValue(formData.selectedFormat) && (formData.selectedFormat == 'rf2' || formData.selectedFormat == 'rf2_with_names')) {
            this.showContent = true;
        } else {

            this.showContent = false;
            formData.selectedContent = '';
        }
        this.disableDownloadButton(formData);
    }

    showLanguageSection(formData) {

        if (CodeUtility.hasValue(formData.selectedFormat) && formData.selectedFormat == 'rf2_with_names') {
            this.showLanguages = true;
        } else {
            this.showLanguages = false;
        }
        this.disableDownloadButton(formData);
    }

    showVersionSection(formData) {

        if (CodeUtility.hasValue(formData.selectedFormat) && formData.selectedFormat == 'free_set') {
            this.showVersions = false;

        } else if (!CodeUtility.hasValue(formData.selectedContent) || (formData.selectedContent == 'snapshot' || formData.selectedContent == 'snapshot_delta')) {
            this.showVersions = true;
        } else {
            this.showVersions = false;
        }
        this.disableDownloadButton(formData);
    }

    showComparisonSection(formData) {

        if (CodeUtility.hasValue(formData.selectedContent) && (formData.selectedContent == 'delta' || formData.selectedContent == 'snapshot_delta')) {
            this.showComparison = true;
        } else {

            this.showComparison = false;
            formData.selectedComparisonFrom = '';
        }
        this.disableDownloadButton(formData);
    }

    showMetadataSection(formData) {

        if (CodeUtility.hasValue(formData.selectedFormat) && formData.selectedFormat == 'free_set') {
            this.showMetadata = false;
        } else {
            this.showMetadata = true;
        }
        this.disableDownloadButton(formData);
    }

    changeFormat(formData) {
        console.log(formData);
        this.showSections(formData);
        this.disableDownloadButton(formData);
    }

    disableDownloadButton(formData): void {
        if (!formData.selectedFormat) {
            this.disableChannel.postMessage(true);
            return;
        }
        if (((formData.selectedFormat == 'rf2' || formData.selectedFormat == 'rf2_with_names') && formData.selectedContent == 'snapshot')) {
            this.disableChannel.postMessage(false);
        } else if ((formData.selectedFormat == 'rf2' || formData.selectedFormat == 'rf2_with_names') && formData.selectedContent == 'delta' && formData.selectedComparisonFrom) {
            this.disableChannel.postMessage(false);
        } else if (formData.selectedFormat == 'sctids') {
            this.disableChannel.postMessage(false);
        } else {
            this.disableChannel.postMessage(true);
        }
    }

    checkContentValues(data, option) {

        const show = option.value != 'delta' || (this.shouldShowDeltaContentLabel() && this.showDeltaOption(data) && option.value == 'delta');
        return show;
    }

    changeContent(formData) {
        this.showSections(formData);
    }

    changeComparisonFrom(formData) {
        this.disableDownloadButton(formData);
    }

    addSpaceAfterVersionDate(stringValue: string): string {
        if (stringValue?.includes('(')) {
            return stringValue.split('(').join(' (');
        }

        return stringValue;
    }

    shouldShowDeltaContentLabel(): boolean {

        if (this.comparisonFromOptions.length == 0) {

            return false;
        } else {
            return this.checkRefsetDates();
        }
    }

    private checkRefsetDates(): boolean {

        const jeComparisonToDate = new Date(this.selectedVersionDate);
        const keysToDelete = [];

        for (const entry of this.comparisonFromOptions.entries()) {
            let date;
            if (entry[1].display?.includes('(')) {
                date = new Date(entry[1].display?.split('(')[0]);
            } else {
                date = new Date(entry[1].display);

            }

            if (date >= jeComparisonToDate) {
                keysToDelete.push(entry[0]);
            }
        }

        let idx = 0;
        for (const key of keysToDelete) {
            this.comparisonFromOptions.splice((key - idx++), 1);
        }

        const mappedComparisonFromOptionsArray = this.comparisonFromOptions.map((version) => {
            if (version.display?.includes('(')) {
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
