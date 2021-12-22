import {
    Component,
    EventEmitter,
    Input,
    Output,
} from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { RefsetService } from "src/app/services/rest/refset.service";
import { catchError } from 'rxjs/operators';
import { JsontocsvService } from 'src/app/services/export-services/jsontocsv.service';

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
    failedIds: string[];
    allIds: string[];
    messageModifier: string;

    @Input() internalRefsetId: string;
    @Input() isIntensional: boolean = false;

    @Output() reloadGrid = new EventEmitter<boolean>();
    

    constructor(
        private modalService: NgbModal,
        private refsetService: RefsetService,
        private readonly jsontocsv: JsontocsvService
    ) {}

    private sendReloadGridTrigger(value: boolean): void {
        this.reloadGrid.emit(value);
    }

    callMemberOperation(operation: string): void {

        if (!this.listOfIds?.length) {
            return;
        }

        let operationFunction: Function;

        if (operation == 'add') {

            this.messageModifier = "added to";
            operationFunction = this.refsetService.addRefsetMembers.bind(this.refsetService);
        } else {

            this.messageModifier = "removed from";
            operationFunction = this.refsetService.removeRefsetMembers.bind(this.refsetService);
        }

        this.showLoadingSpinner = true;
        const commaRegex = /,+/ig;
        let allIdsString = this.listOfIds?.replaceAll(" ", ",").replaceAll("\n", ",").replaceAll(commaRegex, ",").trim();
        this.allIds = allIdsString.split(",");

        operationFunction(this.internalRefsetId, "list", allIdsString)
            .pipe(catchError((err) => {

                if (err) {
                    this.showLoadingSpinner = false;
                }

                return err;

            })).subscribe((data) => {
                this.processOperationReturn(data);
            });
    }

    processOperationReturn(data) { 

        this.showLoadingSpinner = false;
        this.sendReloadGridTrigger(true);
        this.listOfIds = "";

        if (data?.status?.includes("All concepts")) {

            this.showBanner = true;
            this.successfulImport = true;

        } else {

            this.failedIds = data?.error.replace(/Unable to .* concepts /i, "").split(",");
            this.showBanner = true;
            this.successfulImport = false;
        }
    }

    createImportReport(): void {
        const ids = [];
        const failedIdsWithoutWhiteSpace = this.failedIds?.map((name) => {
          return name?.replace(' ', '');
        })
        if (this.successfulImport) {
            for (let i = 0; i < this.allIds?.length; i++) {
                ids.push({
                    Concept: this.allIds[i],
                    Status: "SUCCESS",
                });
            }
        } else {
            for (let i = 0; i < this.allIds.length; i++) {
                if (failedIdsWithoutWhiteSpace?.includes(this.allIds[i])) {
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

    openImportFromListModal(importFromListDialog: NgbModal) {
        this.listOfIds = undefined;
        this.showBanner = false;
        this.modalService.open(importFromListDialog, {
            backdrop: "static",
            keyboard: false,
        });
    }
}
