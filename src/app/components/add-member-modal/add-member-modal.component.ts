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
import { AuthenticationService } from "src/app/services/authentication/authentication.service";

@Component({
    selector: "add-member-modal",
    templateUrl: "./add-member-modal.component.html",
})
export class AddMemberModalComponent {

    email = '';
    emailError = '';
    openedModel: NgbModalRef;

    @Input() type: string;
    @Input() id: string;
    @Input() name: string;
    @Output() changeLockedStatus = new EventEmitter<any>(true);

    constructor(
        private modalService: NgbModal,
        private refsetService: RefsetService,
        private teamsService: TeamsService,
        private organizationsService: OrganizationsService,
        private notificationService: NotificationService,
        private readonly refsetDetails: RefsetDetails,
        private readonly route: ActivatedRoute,
        private authenticationService: AuthenticationService
    ) {}

    openAddMemberModal(addMemberModal: NgbModal) {

        this.email = '';
        this.openedModel = this.modalService.open(addMemberModal, { backdrop: 'static', keyboard: false });
    }

    isValidEmail(): boolean {

        var lowercasedEmail = this.email.toLowerCase();
        var flag = lowercasedEmail.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);

        if (flag == null) {
            this.emailError = "Email is invalid.";
        } else {
            this.emailError = "";
        }

        return flag == null ? false : true;
    }

    onKeyDownEvent(event: any){
        this.isValidEmail();
    }

    addMember(): void {

        if (!CodeUtility.hasValue(this.email)) {
            return;
        }

        this.changeLockedStatus.emit(true);

        let operation = this.teamsService.addUser.bind(this.teamsService);

        if (this.type.toLowerCase() == 'organization') {
            operation = this.organizationsService.addUser.bind(this.organizationsService);
        }

        operation(this.id, this.email).subscribe(
            (data) => {

                this.notificationService.show("The user has been added.", null, "success", {timeOut: 0, extendedTimeOut: 0});
                this.openedModel.dismiss();
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
