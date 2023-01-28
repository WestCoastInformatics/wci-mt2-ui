import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TeamsService } from 'src/app/services/rest/teams.service';
import { NotificationService } from 'src/app/services/notification.service';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { OrganizationsService } from 'src/app/services/rest/organizations.service';

@Component({
    selector: 'add-member-to-organization-modal',
    templateUrl: './add-member-to-organization-modal.component.html',
    styleUrls: ['add-member-to-organization-modal.component.scss']
})
export class AddMemberToOrganizationModalComponent {

    email = '';
    emailError = '';
    validEmail = false;
    openedModel: NgbModalRef;
    showLoadingSpinner = false;

    @Input() id: string;
    @Input() name: string;
    @Output() changeLockedStatus = new EventEmitter<any>(true);
    firstLoad = true;

    constructor(
        private modalService: NgbModal,
        private teamsService: TeamsService,
        private organizationsService: OrganizationsService,
        private notificationService: NotificationService,
    ) { }

    setAutoFocus(focusElement: any) {
        if (this.firstLoad) {
            focusElement.focus();
            this.firstLoad = false;
        }
    }

    openAddMemberModal(addMemberModal: NgbModal) {
        this.firstLoad = true;
        this.email = '';
        this.openedModel = this.modalService.open(addMemberModal, { backdrop: 'static', keyboard: false });
    }

    isValidEmail(): boolean {

        const lowercasedEmail = this.email.toLowerCase();
        const flag = lowercasedEmail.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);

        if (flag == null) {
            this.emailError = 'Email is invalid.';
            this.validEmail = false;
        } else {
            this.emailError = '';
            this.validEmail = true;
        }

        return flag != null;
    }

    onKeyDownEvent(event: any) {

        this.isValidEmail();
    }

    addUserToOrganization(): void {

        let userToAdd = "";
        if (CodeUtility.hasValue(this.email)) {
            userToAdd = this.email;
        }
        if (!CodeUtility.hasValue(userToAdd)) {
            return;
        }

        this.changeLockedStatus.emit(true);
        this.showLoadingSpinner = true;

        //let operation = this.teamsService.addUsers.bind(this.teamsService);
        let operation = this.organizationsService.addUsers.bind(this.organizationsService);

        operation(this.id, userToAdd).subscribe(
            (data) => {

                this.notificationService.show('The user is added.', null, 'success', { timeOut: 0, extendedTimeOut: 0 });
                this.openedModel.dismiss();
                this.changeLockedStatus.emit(false);
                this.showLoadingSpinner = false;
                window.location.reload();
            },
            (err) => {
                this.changeLockedStatus.emit(false);
                this.showLoadingSpinner = false;
                console.error(err);
            }
        );

    }

}
