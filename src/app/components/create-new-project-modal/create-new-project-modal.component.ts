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
import { AuthenticationService } from "src/app/services/authentication/authentication.service";

@Component({
    selector: "create-new-project-modal",
    templateUrl: "./create-new-project-modal.component.html",
})
export class CreateNewProjectModalComponent {

    // Create New Project Modal Variables
    name = '';
    email = '';
    description = '';
    openedModel: NgbModalRef;
	@Input() organizations: any[] = [];
    privateProject: any;
    emailError = '';

    @Input() organizationId = String;
    @Output() changeLockedStatus = new EventEmitter<any>(true);
    param: any;

    // Project artifact Variables for Navigation to resource page after project creation
    selectedProject: any;
    isSelectedProject: boolean;
    projectId: any;

    constructor(
        private modalService: NgbModal,
        private refsetService: RefsetService,
        private projectsService: ProjectsService,
        private organizationsService: OrganizationsService,
        private notificationService: NotificationService,
        private readonly refsetDetails: RefsetDetails,
        private readonly route: ActivatedRoute,
        private authenticationService: AuthenticationService
    ) { }

    openCreateNewProjectModal(createNewProjectDialog: NgbModal) {

        this.description = '';
        this.openedModel = this.modalService.open(createNewProjectDialog, {});

        if(!this.organizations.length){
            // get list of organizations
            this.refsetService.getOrganizations().subscribe((organizationResults) => {
                this.organizations = organizationResults.items;
            });
        }
    }

    callMemberOperation(): void {

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
        if (this.email.length == 0) {
            return true;
        }
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

    isSelectedOrganization(): boolean {
        if (this.selectedOrganization?.name.length > 0) {
            return true;
        }
        return false;
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


    get selectedOrganization(): any{

        if(this.organizations && this.organizationId){
            let org = this.organizations.filter(o => o.id == this.organizationId)
            if(org.length > 0){
                return org[0];
            }
        }
        return null;
    }

    set selectedOrganization(value) {
        this.organizationId = value?.id;
    }

    get canAdd(): boolean{
        let org = this.selectedOrganization;
        return this.authenticationService.isAdmin() || org && org.roles?.includes("ADMIN");
    }
}
