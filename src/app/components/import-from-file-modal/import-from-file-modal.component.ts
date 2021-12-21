import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { catchError } from 'rxjs/operators';
import { JsontocsvService } from 'src/app/services/export-services/jsontocsv.service';

@Component({
    selector: "import-from-file-modal",
    templateUrl: "./import-from-file-modal.component.html",
})
export class ImportFromFileModalComponent implements OnInit {

    files: any[] = [];
    uploadedFile: any;
    showLoadingSpinner = false;
    showBanner = false;
    successfulImport = false;
    numOfIds: any;
    failedIds: any;
    allIds: string[];
    failedIdNames: string[];

    @Input() internalRefsetId: string;
    @Input() isIntensional: boolean = false;

    @Output() reloadGrid = new EventEmitter<boolean>();
    disableFileUpload = true;
    
    constructor(
        private modalService: NgbModal,
        private refsetService: RefsetService,
        private readonly jsontocsv: JsontocsvService
    ) {}

    ngOnInit(): void {}

    private sendReloadGridTrigger(value: boolean): void {
        this.reloadGrid.emit(value);
    }

    openImportFromFileModal(importFromFileDialog: NgbModal) {
        this.showBanner = false;
        this.files = [];
        this.disableFileUpload = true;
        this.modalService.open(importFromFileDialog, {
            backdrop: "static",
            keyboard: false,
        });
    }

    createImportReport(): void {
        const ids = [];
        const failedIdNamesWithoutWhiteSpace = this.failedIdNames.map(
            (name) => {
                return name?.replace(" ", "");
            }
        );
        if (this.successfulImport) {
            for (let i = 0; i < this.allIds.length; i++) {
                ids.push({
                    Concept: this.allIds[i],
                    Status: "SUCCESS",
                });
            }
        } else {
            for (let i = 0; i < this.allIds.length; i++) {
                if (failedIdNamesWithoutWhiteSpace.includes(this.allIds[i])) {
                    ids.push({
                        Concept: this.allIds[i],
                        Status: "Failed",
                    });
                } else {
                    ids.push({
                        Concept: this.allIds[i],
                        Status: "SUCCESS",
                    });
                }
            }
        }
        this.jsontocsv.downloadFile(ids);
    }

    addMembers(): void {
        
        this.showLoadingSpinner = true;
        const listOfIds = [];
        const fileReader = new FileReader();
        fileReader.onload = (e) => {
            for (const line of fileReader.result.toString().split(/[\r\n]+/)) {
                if (line.split("\t")[5] !== "referencedComponentId") {
                    listOfIds.push(
                        line.split("\t")[5]
                            ? line.split("\t")[5]
                            : line.split("\t")[0].replace(",", "").trim()
                    );
                }
            }

            let allIdsString = listOfIds.join(",");
            this.allIds = allIdsString.split(",");
            this.numOfIds = this.allIds.length;

            this.refsetService
                .addRefsetMembers(
                    this.internalRefsetId,
                    "list",
                    allIdsString
            ).pipe(
                catchError((err) => {
                    if (err) {
                        this.showLoadingSpinner = false;
                    }

                  return err;
                })
              ).subscribe((data) => {
                    this.sendReloadGridTrigger(true);
                    this.showLoadingSpinner = false;
                    if (data?.status?.includes("All concepts added")) {
                        this.showLoadingSpinner = false;
                        this.showBanner = true;
                        this.successfulImport = true;
                    } else {
                        this.showLoadingSpinner = false;
                        this.failedIdNames = data?.error
                            .replace("Unable to add concepts ", "")
                            .split(",");
                        this.failedIds = data?.error.split(",").length;
                        this.showBanner = true;
                        this.successfulImport = false;
                    }
                });
        };
        if (this.uploadedFile) {
            fileReader.readAsText(this.uploadedFile);
        } else {
            this.showLoadingSpinner = false;
        }
    }

    removeMembers(): void {
        this.showLoadingSpinner = true;
        const listOfIds = [];
        const fileReader = new FileReader();
        fileReader.onload = (e) => {
            for (const line of fileReader.result.toString().split(/[\r\n]+/)) {
                if (line.split("\t")[5] !== "referencedComponentId") {
                    listOfIds.push(
                        line.split("\t")[5]
                            ? line.split("\t")[5]
                            : line.split("\t")[0].replace(",", "").trim()
                    );
                }
            }
            this.refsetService
                .removeRefsetMembers(
                    this.internalRefsetId,
                    "list",
                    listOfIds.join(",")
                ).pipe(
                    catchError((err) => {
                        if (err) {
                            this.showLoadingSpinner = false;
                        }
    
                      return err;
                    })
                  ).subscribe(
                    (data) => {
                        this.sendReloadGridTrigger(true);
                        this.showLoadingSpinner = false;
                    },
                    (error) => {
                        this.showLoadingSpinner = false;
                    }
                );
        };
        if (this.uploadedFile) {
            fileReader.readAsText(this.uploadedFile);
        } else {
            this.showLoadingSpinner = false;
        }
    }

    /**
     * on file drop handler
     */
    onFileDropped(files) {
        if (files[0]?.name.includes('.txt') || files[0]?.name.includes('.rf2')) {
            this.prepareFilesList(files);
            this.uploadedFile = files[0];
            this.disableFileUpload = false;
        }
    }

    /**
     * handle file from browsing
     */
    fileBrowseHandler(files) {
        if (files[0]?.name.includes('.txt') || files[0]?.name.includes('.rf2')) {
            this.prepareFilesList(files);
            this.uploadedFile = files[0];
            this.disableFileUpload = false;
        }
    }

    /**
     * Delete file from files list
     * @param index (File index)
     */
    deleteFile(index: number) {
        this.files.splice(index, 1);
        this.disableFileUpload = true;
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
        const k = 1024;
        const dm = decimals <= 0 ? 0 : decimals || 2;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (
            parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
        );
    }
}
