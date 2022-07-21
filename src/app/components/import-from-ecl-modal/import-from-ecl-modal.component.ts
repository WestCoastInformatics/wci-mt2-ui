import { Component, EventEmitter, Input, Output } from "@angular/core";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { RefsetService } from "src/app/services/rest/refset.service";
import { UiUtility } from "src/app/utilities/ui.utility";
import { NotificationService } from "src/app/services/notification.service";
import { Router } from "@angular/router";
import { CodeUtility } from "src/app/utilities/code.utility";
import { RefsetUtility } from "src/app/utilities/refset.utility";
import { RefsetDetails } from 'src/app/pages/refset-details';

@Component({
    selector: "import-from-ecl-modal",
    templateUrl: "./import-from-ecl-modal.component.html",
})
export class ImportFromEclModalComponent {

    ecl: string;
    openedModel: NgbModalRef;

    @Input() refsetInternalId: string;
    @Input() refsetId: string;
    @Input() refsetBranchPath: string;
    @Input() isIntensional: boolean = false;
    @Output() changeLockedStatus = new EventEmitter<any>(true);

    constructor(
        private modalService: NgbModal,
        private refsetService: RefsetService,
        private notificationService: NotificationService,
        private router: Router,
        private readonly refsetDetails: RefsetDetails
    ) { }

    callMemberOperation(operation: string): void {

        if (!CodeUtility.hasValue(this.ecl)) {
            return;
        }

        this.changeLockedStatus.emit(true);

        let operationFunction: Function;
        let messageModifier = "";

        if (operation == 'add') {

            messageModifier = "added to";
            operationFunction = this.refsetService.addRefsetMembers.bind(this.refsetService);
        } else {

            messageModifier = "removed from";
            operationFunction = this.refsetService.removeRefsetMembers.bind(this.refsetService);
        }

        operationFunction(this.refsetInternalId, "list", '', escape(this.ecl)).subscribe();

        UiUtility.manageMemberNotifications(this.refsetInternalId, this.refsetId, messageModifier, this.processOperationReturn, this.notificationService, this.refsetService, this.router);
    }

    processOperationReturn = (data) => {

        this.changeLockedStatus.emit(false);

        this.refsetDetails.ngOnInit();

        this.ecl = '';
    }

    openImportFromEclModal(importFromEclDialog: NgbModal) {

        this.ecl = '';

        this.openedModel = this.modalService.open(importFromEclDialog, {
            //backdrop: "static",
            //keyboard: false,
            modalDialogClass: 'import-from-ecl-modal'
        });
    }

    openEclBuilder(fieldId) {
        UiUtility.openEclBuilder(fieldId, this.refsetBranchPath);
    }
}
