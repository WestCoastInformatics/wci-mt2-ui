import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { catchError } from 'rxjs/operators';
import { NotificationService } from 'src/app/services/notification.service';
import { Router } from '@angular/router';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { RefsetDetails } from 'src/app/pages/refset-details';
import { RefsetUtility } from 'src/app/utilities/refset.utility';

@Component({
    selector: "import-from-file-modal",
    templateUrl: "./import-from-file-modal.component.html",
})
export class ImportFromFileModalComponent implements OnInit {

    files: any[] = [];
    uploadedFile: any;
    allIds: string[];
    disableActionButtons = true;
    fileInput = '';
    openedModel: NgbModalRef;

    @Input() refsetInternalId: string;
    @Input() refsetId: string;
    @Input() isIntensional: boolean = false;
    @Output() changeLockedStatus = new EventEmitter<any>(true);
    @Output() onMembersGridReady = new EventEmitter<any>();

    constructor(private modalService: NgbModal, private readonly refsetDetails: RefsetDetails, private refsetService: RefsetService, private notificationService: NotificationService, private router: Router) {}

    ngOnInit(): void {}

    openImportFromFileModal(importFromFileDialog: NgbModal) {

        this.files = [];
        this.disableActionButtons = true;
        this.openedModel = this.modalService.open(importFromFileDialog, {
            //backdrop: "static",
            //keyboard: false,
        });
    }

    callMemberOperation(operation: string): void {
        
        const listOfIds = [];
        const fileReader = new FileReader();

        fileReader.onload = (e) => {

            for (const line of fileReader.result.toString().split(/[\r\n]+/)) {

                if (line.split("\t")[5] !== "referencedComponentId") {

                    // if this is an RF2 get the 5th column, otherwise it is just a list of IDs
                    if (line.split("\t")[5]) {
                        listOfIds.push(line.split("\t")[5]);
                    } else {
                        listOfIds.push(line.split("\t")[0].replace(",", "").trim());
                    }
                }
            }

            let allIdsString = listOfIds.join(",");

            if (listOfIds.length == 0) {
                return;
            }

            this.changeLockedStatus.emit(true);

            RefsetUtility.addRemoveMembersByList(this.refsetInternalId, this.refsetId, allIdsString, operation, this.processOperationReturn, this.notificationService, this.refsetService, this.router);
        };

        if (this.uploadedFile) {
            fileReader.readAsText(this.uploadedFile);
        }
    }

    processOperationReturn = (data) => { 

        this.changeLockedStatus.emit(false);

            this.refsetDetails.ngOnInit();

        this.files = [];
        this.disableActionButtons = true;
        this.fileInput = '';
    }

    /**
     * on file drop handler
     */
    onFileDropped(files) {

        if (files[0]?.name.includes('.txt') || files[0]?.name.includes('.rf2')) {

            this.prepareFilesList(files);
            this.uploadedFile = files[0];
            this.disableActionButtons = false;
        }
    }

    /**
     * handle file from browsing
     */
    fileBrowseHandler(files) {

        if (files[0]?.name.includes('.txt') || files[0]?.name.includes('.rf2')) {

            this.prepareFilesList(files);
            this.uploadedFile = files[0];
            this.disableActionButtons = false;
        }
    }

    /**
     * Delete file from files list
     * @param index (File index)
     */
    deleteFile(index: number) {

        this.files.splice(index, 1);
        if (!this.files.length) {
            this.disableActionButtons = true;
        }
    }

    /**
     * Simulate the upload process
     */
    uploadFilesSimulator(index: number) {

        setTimeout(() => {

            if (index === this.files.length) {
                return;
            } else {

                const progressInterval = setInterval(() => {

                    if (this.files[index]?.progress === 100) {

                        clearInterval(progressInterval);
                        this.uploadFilesSimulator(index + 1);

                    } else if (this.files[index]) {
                        this.files[index].progress += 5;
                    }
                }, 200);
            }
        }, 1000);
    }

    /**
     * Convert Files list to normal array list
     * @param files (Files List)
     */
    prepareFilesList(files: Array<any>) {

        for (const item of files) {

            item.progress = 0;
            this.files.push(item);
        }

        this.uploadFilesSimulator(0);
    }

    /**
     * format bytes
     * @param bytes (File size in bytes)
     * @param decimals (Decimals point)
     */
    formatBytes(bytes, decimals) {

        if (bytes === 0) {
            return "0 Bytes";
        }

        const suffixThreshold = 1024;
        const dm = decimals <= 0 ? 0 : decimals || 2;
        const suffixes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
        const suffixIndex = Math.floor(Math.log(bytes) / Math.log(suffixThreshold));
        const sizeNumber = parseFloat((bytes / Math.pow(suffixThreshold, suffixIndex)).toFixed(dm));

        return (sizeNumber + " " + suffixes[suffixIndex]);
    }
}
