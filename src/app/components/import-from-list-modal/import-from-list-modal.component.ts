import {
    Component,
    EventEmitter,
    Input,
    Output,
} from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { RefsetService } from "src/app/services/rest/refset.service";
import { catchError } from 'rxjs/operators';

@Component({
    selector: "import-from-list-modal",
    templateUrl: "./import-from-list-modal.component.html",
})
export class ImportFromListModalComponent {

    files: any[] = [];
    listOfIds: any;
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
    

    constructor(
        private modalService: NgbModal,
        private refsetService: RefsetService
    ) {}

    private sendReloadGridTrigger(value: boolean): void {
        this.reloadGrid.emit(value);
    }

    addMembers(): void {

        if (!this.listOfIds?.length) {
            return;
        }

        this.showLoadingSpinner = true;
        const commaRegex = /,+/ig;
        let allIdsString = this.listOfIds?.replaceAll(" ", ",").replaceAll("\n", ",").replaceAll(commaRegex, ",").trim();
        this.allIds = allIdsString.split(",");
        this.numOfIds = this.allIds.length;

        this.refsetService.addRefsetMembers(this.internalRefsetId, "list", allIdsString)
            .pipe(catchError((err) => {

                if (err) {
                    this.showLoadingSpinner = false;
                }

                return err;

            })).subscribe((data) => {

                this.showLoadingSpinner = false;
                this.sendReloadGridTrigger(true);
                this.listOfIds = "";
                // this.successfulImport = true;

                if (data?.status?.includes("All concepts added")) {

                    this.showBanner = true;
                    this.successfulImport = true;

                } else {

                    this.failedIdNames = data?.error
                        .replace("Unable to add concepts ", "")
                        .split(",");
                    this.failedIds = data?.error.split(",").length;
                    this.showBanner = true;
                    this.successfulImport = false;
                }
            });
    }

    removeMembers(): void {

        if (!this.listOfIds?.length) {
            return;
        }

        this.showLoadingSpinner = true;
        const commaRegex = /,+/ig;

        this.refsetService.removeRefsetMembers(this.internalRefsetId, "list", this.listOfIds?.replaceAll(" ", ",").replaceAll("\n", ",").replaceAll(commaRegex, ",").trim())
            .pipe(catchError((err) => {

                if (err) {
                    this.showLoadingSpinner = false;
                }

                return err;

            })).subscribe((data) => {
                
                    this.showLoadingSpinner = false;
                    this.sendReloadGridTrigger(true);
                },
                (error) => {
                    this.showLoadingSpinner = false;
                }
            );
    }

    createImportReport(): void {
        const ids = [{
          name: 'Concept',
          status: 'Status',
        }];
        const failedIdNamesWithoutWhiteSpace = this.failedIdNames.map((name) => {
          return name?.replace(' ', '');
        })
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

    openImportFromListModal(importFromListDialog: NgbModal) {
        this.listOfIds = undefined;
        this.showBanner = false;
        this.modalService.open(importFromListDialog, {
            backdrop: "static",
            keyboard: false,
        });
    }
}
