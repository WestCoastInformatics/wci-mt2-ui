import { Component, EventEmitter, Input, Output } from "@angular/core";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { RefsetService } from "src/app/services/rest/refset.service";
import { UiUtility } from "src/app/utilities/ui.utility";
import { NotificationService } from "src/app/services/notification.service";
import { CodeUtility } from "src/app/utilities/code.utility";
import { RefsetDetails } from 'src/app/pages/refset-details';
import { ProjectsService } from "src/app/services/rest/projects.service";
import { OrganizationsService } from "src/app/services/rest/organizations.service";
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: "create-new-project-modal",
    templateUrl: "./create-new-project-modal.component.html",
})
export class CreateNewProjectModalComponent {

    name = '';
    email = '';
    description = '';
    openedModel: NgbModalRef;
	organizations: any[] = [];
    selectedOrganization: any;
    privateProject: any;
    emailError = '';

    @Input() organizationId = String;
    @Output() changeLockedStatus = new EventEmitter<any>(true);
    param: any;

    constructor(
        private modalService: NgbModal,
        private refsetService: RefsetService,
        private projectsService: ProjectsService,
        private organizationsService: OrganizationsService,
        private notificationService: NotificationService,
        private readonly refsetDetails: RefsetDetails,
        private readonly route: ActivatedRoute
    ) { }

    openCreateNewProjectModal(createNewProjectDialog: NgbModal) {

        this.description = '';
        this.openedModel = this.modalService.open(createNewProjectDialog, {});

        // get list of organizations
        this.refsetService.getOrganizations().subscribe((organizationResults) => {

            this.organizations = organizationResults.items;

            for (let organization of this.organizations) {

                if (organization.id == this.organizationId) {
                    this.selectedOrganization = organization;
                }
            }
        }); 
    }

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

    isValidEmail(): boolean {
        
        var lower = this.email.toLowerCase();
        var flag = lower.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);

        if (flag == null) {
            this.emailError = "Email is invalid.";
        } else {
            this.emailError = "";
        }

        return flag == null ? false : true;
    }

    onKeyDownEvent(event: any) {

        console.log(event.target.value);
        this.isValidEmail();
    }

    createProjectObject(): void {

        let params: any = {
            active: true,
            name: this.name,
            description: this.description,
            //primaryContactEmail: this.email,
            privateProject: this.privateProject,
            teams: [],
            organization: this.selectedOrganization
        };
        

        this.projectsService.createProject(params).subscribe(
            (data) => {

                this.notificationService.show("The project is created.", null, "success", {timeOut: 0, extendedTimeOut: 0});
                this.modalService.dismissAll();
                this.changeLockedStatus.emit(false);
                window.location.reload();
            },
            (err) => {
                this.changeLockedStatus.emit(false);
            }
        );
    }
}
