import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TeamsService } from 'src/app/services/rest/teams.service';
import { NotificationService } from 'src/app/services/notification.service';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { OrganizationsService } from 'src/app/services/rest/organizations.service';

@Component({
    selector: 'add-member-modal',
    templateUrl: './add-member-modal.component.html',
    styleUrls: ['add-member-modal.component.scss']
})
export class AddMemberModalComponent {

    email = '';
    emails = [];
    emailError = '';
    validEmail = false;
    openedModel: NgbModalRef;
    showLoadingSpinner = false;

    @Input() type: string;
    @Input() id: string;
    @Input() name: string;
    @Input() users: any;
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
        this.emails = [];
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

    addUsersAsMembers(): void {

        let usersToAdd = "";
        if (CodeUtility.hasValue(this.email)) {
            usersToAdd = this.email;
        }
        if (CodeUtility.hasValue(this.emails)) {
            usersToAdd = this.emails.join(";");
        }
        if (!CodeUtility.hasValue(usersToAdd)) {
            return;
        }

        this.changeLockedStatus.emit(true);
        this.showLoadingSpinner = true;

        let operation = this.teamsService.addUsers.bind(this.teamsService);

        if (this.type.toLowerCase() == 'organization') {
            operation = this.organizationsService.addUsers.bind(this.organizationsService);
        }


        operation(this.id, usersToAdd).subscribe(
            (data) => {

                this.notificationService.show('The user(s) added.', null, 'success', { timeOut: 0, extendedTimeOut: 0 });
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
