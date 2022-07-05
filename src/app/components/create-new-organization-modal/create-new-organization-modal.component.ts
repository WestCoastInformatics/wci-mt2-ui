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
import { AuthenticationService } from "src/app/services/authentication/authentication.service";

@Component({
    selector: "create-new-organization-modal",
    templateUrl: "./create-new-organization-modal.component.html",
})
export class CreateNewOrganizationModalComponent {

    name = '';
    email = '';
    description = '';
    openedModel: NgbModalRef;
	editions: any;
    editionsArray: any;
    selectedEdition: any;
    edition:any;
    emailError = '';

  
    @Output() changeLockedStatus = new EventEmitter<any>(true);
    
    constructor(
        private modalService: NgbModal,
        private refsetService: RefsetService,
        private organizationsService: OrganizationsService,
        private editionsService: EditionsService,
        private notificationService: NotificationService, 
        private readonly refsetDetails: RefsetDetails,
        private readonly router: Router,
        private authenticationService: AuthenticationService
    ) {}

    callMemberOperation(): void {

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

    isValidEmail(): boolean {
        var lower = this.email.toLowerCase();
        var flag = lower.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
        if (flag == null) {
            this.emailError = "Email is invalid.";
        } else {
            this.emailError = "";
        }
        return flag == null ? false : true;
    }

    isSelectedEdition(): boolean {
        if (this.edition?.name.length > 0) {
            return true;
        }
        return false;
    }

    onKeyDownEvent(event: any){
        console.log(event.target.value);
        this.isValidEmail();
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
                window.location.reload();
            },
            (err) => {
                this.changeLockedStatus.emit(false);
                console.error(err);
            }
        );
    }

    get canAdd(): boolean{
        return this.authenticationService.isAdmin();
    }
}
