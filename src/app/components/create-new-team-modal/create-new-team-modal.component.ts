import { Component, EventEmitter, Input, Output } from "@angular/core";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { RefsetService } from "src/app/services/rest/refset.service";
import { TeamsService } from "src/app/services/rest/teams.service";
import { UiUtility } from "src/app/utilities/ui.utility";
import { NotificationService } from "src/app/services/notification.service";
import { RefsetDetails } from 'src/app/pages/refset-details';
import { CodeUtility } from "src/app/utilities/code.utility";
import { OrganizationsService } from "src/app/services/rest/organizations.service";
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: "create-new-team-modal",
    templateUrl: "./create-new-team-modal.component.html",
})
export class CreateNewTeamModalComponent {
    name: string;
    email: string;
    description: string;
    openedModel: NgbModalRef;
	organizations: any;
    organizationsArray: any;
    selectedOrganization: any;
    organization:any;
    privateTeam: any;
    selectedRoles: any;
    members: any;
    refsetUser: any;

    roleOptions: any;

    @Output() changeLockedStatus = new EventEmitter<any>(true);
    param: any;
    
    constructor(
        private modalService: NgbModal,
        private refsetService: RefsetService,
        private teamsService: TeamsService,
        private organizationsService: OrganizationsService,
        private notificationService: NotificationService,
        private readonly refsetDetails: RefsetDetails,
        private readonly route: ActivatedRoute
    ) {
        this.route.params.subscribe(params => {
            this.selectedOrganization = this.param = params['id'];
            if (this.selectedOrganization) {
                this.getOrganization();
            }
          });
    }

    callMemberOperation(): void {

        if (!CodeUtility.hasValue(this.description)) {
            return;
        }

        this.changeLockedStatus.emit(true);
        
        this.createTeamObject();

        //UiUtility.manageNotifications(this.refsetInternalId, this.refsetId, messageModifier, this.processOperationReturn, this.notificationService, this.refsetService, this.router);
    }

    processOperationReturn = (data) => { 

        this.changeLockedStatus.emit(false);

        this.refsetDetails.ngOnInit();

        this.description = '';
    }

    openCreateNewTeamModal(createNewTeamDialog: NgbModal) {

        this.description = '';

        this.openedModel = this.modalService.open(createNewTeamDialog, {
        });
    }

    ngOnInit() {    
        // get list of organizations
        this.refsetService.getOrganizations().subscribe((organizationResults) => {
            this.organizations = organizationResults;
            this.organizationsArray = this.organizations?.items;
        }) 
        this.roleOptions = [{ value: 'AUTHOR', display: 'Author' }, { value: 'REVIEWER', display: 'Reviewer' },
        { value: 'ADMIN', display: 'Admin' }, { value: 'VIEWER', display: 'Viewer' }];
        
        try {
            this.refsetUser = JSON.parse(localStorage.getItem('refset_user'));
            this.members = [this.refsetUser.id];
        } catch (ex) {
            return null;
        }
    }

    getOrganization(): void {
        // get details about selected organization
        this.organizationsService.getOrganization(this.selectedOrganization).subscribe((organizationResult) => {
            this.organization = organizationResult;
        }) 
    }

    setRoles(): void {
        console.log(this.selectedRoles);
    }

    createTeamObject(): void {

        let params: any = {
            active: true,
            name: this.name,
            description: this.description,
            primaryContactEmail: this.email,
            privateTeam: this.privateTeam,
            roles: this.selectedRoles,
            organization: this.organization,
            members: this.members
        };
        
        this.teamsService.createTeam(params).subscribe(
            (data) => {
                this.notificationService.show("The team is created.", null, "success", {timeOut: 0, extendedTimeOut: 0});
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
}