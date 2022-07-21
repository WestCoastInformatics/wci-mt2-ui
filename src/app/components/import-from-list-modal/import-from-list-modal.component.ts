import { Component, EventEmitter, Input, Output } from "@angular/core";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { RefsetService } from "src/app/services/rest/refset.service";
import { catchError } from 'rxjs/operators';
import { UiUtility } from "src/app/utilities/ui.utility";
import { NotificationService } from "src/app/services/notification.service";
import { Router } from "@angular/router";
import { RefsetDetails } from 'src/app/pages/refset-details';
import { RefsetUtility } from "src/app/utilities/refset.utility";

@Component({
    selector: "import-from-list-modal",
    templateUrl: "./import-from-list-modal.component.html",
})
export class ImportFromListModalComponent {

    listOfIds: any;
    openedModel: NgbModalRef;

    @Input() refsetInternalId: string;
    @Input() refsetId: string;
    @Input() isIntensional: boolean = false;
    @Output() changeLockedStatus = new EventEmitter<any>(true);

    constructor(
        private modalService: NgbModal,
        private refsetService: RefsetService,
        private notificationService: NotificationService,
        private router: Router,
        private refsetDetails: RefsetDetails
    ) { }

    callMemberOperation(operation: string): void {

        if (!this.listOfIds?.length) {
            return;
        }

        this.changeLockedStatus.emit(true);
        RefsetUtility.addRemoveMembersByList(this.refsetInternalId, this.refsetId, this.listOfIds, operation, this.processOperationReturn, this.notificationService, this.refsetService, this.router);
    }

    processOperationReturn = (data) => {

        this.changeLockedStatus.emit(false);
        this.refsetDetails.ngOnInit();
        this.listOfIds = "";
    }

    openImportFromListModal(importFromListDialog: NgbModal) {

        this.listOfIds = undefined;

        this.openedModel = this.modalService.open(importFromListDialog, {
            //backdrop: "static",
            //keyboard: false,
        });
    }
}
