import {
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output,
    ViewEncapsulation,
} from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { RefsetService } from "src/app/services/rest/refset.service";
import { AngularCsv } from "angular7-csv";

@Component({
    selector: "import-from-list-modal",
    templateUrl: "./import-from-list-modal.component.html",
})
export class ImportFromListModalComponent {
    files: any[] = [];
    listOfIds: any;
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

    private sendReloadGridTrigger(value: boolean): void {
        this.reloadGrid.emit(value);
    }

    addMembers(): void {
        this.showLoadingSpinner = true;
        console.log(
            this.listOfIds
                ?.replaceAll(" ", ",")
                .replaceAll("\n", ",")
                .split(",").length
        );
        this.allIds = this.listOfIds
            ?.replaceAll(" ", ",")
            .replaceAll("\n", ",")
            .split(",");
        this.numOfIds = this.listOfIds
            ?.replaceAll(" ", ",")
            .replaceAll("\n", ",")
            .split(",").length;
        this.refsetService
            .addRefsetMembers(
                this.internalRefsetId,
                "list",
                this.listOfIds
                    ?.replaceAll(" ", ",")
                    .replaceAll("\n", ",")
                    .trim()
            )
            .subscribe((data) => {
                console.log(data);
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
        this.showLoadingSpinner = true;
        console.log(
            this.listOfIds.replaceAll(" ", ",").replaceAll("\n", ",").trim()
        );

        this.refsetService
            .removeRefsetMembers(
                this.internalRefsetId,
                "list",
                this.listOfIds.replaceAll(" ", ",").replaceAll("\n", ",").trim()
            )
            .subscribe(
                (data) => {
                    console.log(data);
                    this.showLoadingSpinner = false;
                    this.sendReloadGridTrigger(true);
                },
                (error) => {
                    console.log(error);
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
        console.log(failedIdNamesWithoutWhiteSpace)
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

        console.log(new AngularCsv(ids, "Import Report"));
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
