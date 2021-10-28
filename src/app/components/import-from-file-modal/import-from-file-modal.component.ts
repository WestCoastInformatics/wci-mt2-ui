import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { AngularCsv } from 'angular7-csv';

@Component({
    selector: "import-from-file-modal",
    templateUrl: "./import-from-file-modal.component.html",
})
export class ImportFromFileModalComponent implements OnInit {
    files: any[] = [];
    uploadedFile: any;
    showLoadingSpinner = false;

    @Input()
    internalRefsetId: string;

    @Output()
    reloadGrid = new EventEmitter<boolean>();
    showBanner = false;
    successfulImport = false;
    numOfIds: any;
    failedIds: any;
    allIds: string[];
    failedIdNames: string[];
    constructor(
        private modalService: NgbModal,
        private refsetService: RefsetService
    ) {}

    ngOnInit(): void {}

    private sendReloadGridTrigger(value: boolean): void {
        this.reloadGrid.emit(value);
    }

    openImportFromFileModal(importFromFileDialog: NgbModal) {
        this.showBanner = false;
        this.files = [];
        this.modalService.open(importFromFileDialog, {
            backdrop: "static",
            keyboard: false,
        });
    }

    createImportReport(): void {
        const ids = [
            {
                name: "Concept",
                status: "Status",
            },
        ];
        const failedIdNamesWithoutWhiteSpace = this.failedIdNames.map(
            (name) => {
                return name?.replace(" ", "");
            }
        );
        if (this.successfulImport) {
            for (let i = 0; i < this.allIds.length; i++) {
                ids.push({
                    name: this.allIds[i],
                    status: "SUCCESS",
                });
            }
        } else {
            for (let i = 0; i < this.allIds.length; i++) {
                if (failedIdNamesWithoutWhiteSpace.includes(this.allIds[i])) {
                    ids.push({
                        name: this.allIds[i],
                        status: "Failed",
                    });
                } else {
                    ids.push({
                        name: this.allIds[i],
                        status: "SUCCESS",
                    });
                }
            }
        }

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
            this.allIds = listOfIds.join(",").split(",");
            this.numOfIds = listOfIds.join(",").split(",").length;
            this.refsetService
                .addRefsetMembers(
                    this.internalRefsetId,
                    "list",
                    listOfIds.join(",")
                )
                .subscribe((data) => {
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
        fileReader.readAsText(this.uploadedFile);
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
                )
                .subscribe(
                    (data) => {
                        this.sendReloadGridTrigger(true);
                        this.showLoadingSpinner = false;
                    },
                    (error) => {
                        this.showLoadingSpinner = false;
                    }
                );
        };
        fileReader.readAsText(this.uploadedFile);
    }

    /**
     * on file drop handler
     */
    onFileDropped($event) {
        this.prepareFilesList($event);
        this.uploadedFile = $event[0];
    }

    /**
     * handle file from browsing
     */
    fileBrowseHandler(files) {
        this.prepareFilesList(files);
        this.uploadedFile = files[0];
    }

    /**
     * Delete file from files list
     * @param index (File index)
     */
    deleteFile(index: number) {
        this.files.splice(index, 1);
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
                    if (this.files[index].progress === 100) {
                        clearInterval(progressInterval);
                        this.uploadFilesSimulator(index + 1);
                    } else {
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
