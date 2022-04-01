import { Component, EventEmitter, Input, Output } from "@angular/core";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { RefsetService } from "src/app/services/rest/refset.service";
import { UiUtility } from "src/app/utilities/ui.utility";
import { NotificationService } from "src/app/services/notification.service";
import { CodeUtility } from "src/app/utilities/code.utility";
import { RefsetDetails } from 'src/app/pages/refset-details';
import { ProjectsService } from "src/app/services/rest/projects.service";
import { OrganizationsService } from "src/app/services/rest/organizations.service";

@Component({
    selector: "create-new-project-modal",
    templateUrl: "./create-new-project-modal.component.html",
})
export class CreateNewProjectModalComponent {

    name: string;
    email: string;
    description: string;
    openedModel: NgbModalRef;
	organizations: any;
    organizationsArray: any;
    selectedOrganization: any;
    organization:any;
    privateProject: any;

    @Output() changeLockedStatus = new EventEmitter<any>(true);
    
    constructor(
        private modalService: NgbModal,
        private refsetService: RefsetService,
        private projectsService: ProjectsService,
        private organizationsService: OrganizationsService,
        private notificationService: NotificationService, 
        private readonly refsetDetails: RefsetDetails
    ) {}

    callMemberOperation(): void {

        if (!CodeUtility.hasValue(this.description)) {
            return;
        }

        this.changeLockedStatus.emit(true);
        
        this.createProjectObject();

        //UiUtility.manageNotifications(this.refsetInternalId, this.refsetId, messageModifier, this.processOperationReturn, this.notificationService, this.refsetService, this.router);
    }

    processOperationReturn = (data) => { 

        this.changeLockedStatus.emit(false);

        this.refsetDetails.ngOnInit();

        this.description = '';
    }

    openCreateNewProjectModal(createNewProjectDialog: NgbModal) {

        this.description = '';

        this.openedModel = this.modalService.open(createNewProjectDialog, {
        });
    }

    ngOnInit() {    
        // get list of organizations
        this.refsetService.getOrganizations().subscribe((organizationResults) => {
            this.organizations = organizationResults;
            this.organizationsArray = this.organizations?.items;
        }) 
    }

    getOrganization(): void {
        // get details about selected organization
        this.organizationsService.getOrganization(this.selectedOrganization).subscribe((organizationResult) => {
            this.organization = organizationResult;
        }) 
    }

    createProjectObject(): void {

        let params: any = {
            active: true,
            name: this.name,
            description: this.description,
            primaryContactEmail: this.email,
            privateProject: this.privateProject,
            teams: [],
            organization: this.organization
        };
        

        this.projectsService.createProject(params).subscribe(
            (data) => {
                this.notificationService.show("The project is created.", null, "success", {timeOut: 0, extendedTimeOut: 0});
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
