import { Component, EventEmitter, Input, Output } from "@angular/core";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { RefsetService } from "src/app/services/rest/refset.service";
import { UiUtility } from "src/app/utilities/ui.utility";
import { NotificationService } from "src/app/services/notification.service";
import { Router } from "@angular/router";
import { CodeUtility } from "src/app/utilities/code.utility";
import { RefsetUtility } from "src/app/utilities/refset.utility";
import { RefsetDetails } from 'src/app/pages/refset-details';
import { OrganizationsService } from "src/app/services/rest/organizations.service";
import { EditionsService } from "src/app/services/rest/editions.service";

@Component({
    selector: "create-new-organization-modal",
    templateUrl: "./create-new-organization-modal.component.html",
})
export class CreateNewOrganizationModalComponent {

    name: string;
    email: string;
    description: string;
    openedModel: NgbModalRef;
	editions: any;
    editionsArray: any;
    selectedEdition: any;
    edition:any;

  
    @Output() changeLockedStatus = new EventEmitter<any>(true);
    
    constructor(
        private modalService: NgbModal,
        private refsetService: RefsetService,
        private organizationsService: OrganizationsService,
        private editionsService: EditionsService,
        private notificationService: NotificationService, 
        private readonly refsetDetails: RefsetDetails
    ) {}

    callMemberOperation(): void {

        if (!CodeUtility.hasValue(this.description)) {
            return;
        }

        this.changeLockedStatus.emit(true);
        
        this.createOrganizationObject();

        //UiUtility.manageNotifications(this.refsetInternalId, this.refsetId, messageModifier, this.processOperationReturn, this.notificationService, this.refsetService, this.router);
    }

    processOperationReturn = (data) => { 

        this.changeLockedStatus.emit(false);

        this.refsetDetails.ngOnInit();

        this.description = '';
    }

    openCreateNewOrganizationModal(createNewOrganizationDialog: NgbModal) {

        this.description = '';

        this.openedModel = this.modalService.open(createNewOrganizationDialog, {
        });
    }

    ngOnInit() {    
        // get list of editions
        this.refsetService.getEditions().subscribe((editionResults) => {
            this.editions = editionResults;
            this.editionsArray = this.editions?.items;
        }) 
    }

    getEdition(): void {
        // get details about selected edition
        this.editionsService.getEdition(this.selectedEdition).subscribe((editionResult) => {
            this.edition = editionResult;
        }) 
    }

    createOrganizationObject(): void {

        let params: any = {
            active: true,
            name: this.name,
            description: this.description,
            primaryContactEmail: this.email,
            edition: this.edition
        };
        

        this.organizationsService.createOrganization(params).subscribe(
            (data) => {
                this.notificationService.show("The organization is created.", null, "success", {timeOut: 0, extendedTimeOut: 0});
                this.modalService.dismissAll();
                this.changeLockedStatus.emit(false);
            },
            (err) => {
                this.changeLockedStatus.emit(false);
                console.error(err);
            }
        );
    }
}
