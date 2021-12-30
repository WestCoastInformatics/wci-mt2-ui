import { Component, EventEmitter, Input, Output } from "@angular/core";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { RefsetService } from "src/app/services/rest/refset.service";
import { catchError } from 'rxjs/operators';
import { UiUtility } from "src/app/utilities/ui.utility";
import { NotificationService } from "src/app/services/notification.service";
import { Router } from "@angular/router";

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
    @Output() reloadPageData = new EventEmitter<boolean>();
    @Output() changeLockedStatus = new EventEmitter<any>(true);
    
    constructor(
        private modalService: NgbModal,
        private refsetService: RefsetService,
        private notificationService: NotificationService, 
        private router: Router
    ) {}

    callMemberOperation(operation: string): void {

        if (!this.listOfIds?.length) {
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

        const commaRegex = /,+/ig;
        let allIdsString = this.listOfIds?.replaceAll(" ", ",").replaceAll("\n", ",").replaceAll(commaRegex, ",").replaceAll(/[^,\-\_a-zA-Z0-9]/g, '').trim();

        operationFunction(this.refsetInternalId, "list", allIdsString).subscribe();

        UiUtility.manageNotifications(this.refsetInternalId, this.refsetId, messageModifier, this.processOperationReturn, this.notificationService, this.refsetService, this.router);
    }

    processOperationReturn = (data) => { 

        this.changeLockedStatus.emit(false);

        // if the same refset is still open then refsesh the page
        if (this.router.url.includes('edit/refset/' + this.refsetInternalId)) {
            this.reloadPageData.emit(true);
        }

        this.listOfIds = "";
    }

    openImportFromListModal(importFromListDialog: NgbModal) {

        this.listOfIds = undefined;

        this.openedModel = this.modalService.open(importFromListDialog, {
            backdrop: "static",
            keyboard: false,
        });
    }
}
