import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {RefsetService} from '../../services/rest/refset.service';
import {NotificationService} from '../../services/notification.service';
import {RefsetDetails} from '../../pages/refset-details';


@Component({
    selector: 'invite-people-modal',
    templateUrl: './invite-people-modal.component.html'
})
export class InvitePeopleModalComponent implements OnInit {
    email = '';
    description = '';
    openedModel: NgbModalRef;
    emailError = '';

    @Input() refset: any;
    @Input() refsetInternalId: string;
    @Output() changeLockedStatus = new EventEmitter<any>(true);

    constructor(private readonly modalService: NgbModal, private dataService: RefsetService,
                private notificationService: NotificationService, private readonly refsetDetails: RefsetDetails) {
    }

    get modalTitle(): string {
        return 'Invite Collaborator to your organization';
    }

    get canInvite(): boolean {
        return this.refset?.project?.roles.includes('ADMIN');
    }

    ngOnInit(): void {
    }

    openModal(modalDialog: NgbModal) {
        this.description = '';
        this.email = '';
        this.openedModel = this.modalService.open(modalDialog, { backdrop: 'static', keyboard: false });
    }

    processOperationReturn = (data) => {

        this.changeLockedStatus.emit(false);

        this.refsetDetails.ngOnInit();

        this.description = '';
    }

    isValidEmail(): boolean {
        const lower = this.email.toLowerCase();
        const flag = lower.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
        if (flag == null) {
            this.emailError = 'Email is invalid.';
        } else {
            this.emailError = '';
        }
        return flag != null;
    }

    reset() {
        this.description = '';
        this.email = '';
    }

    onKeyDownEvent(event: any) {
        this.isValidEmail();
    }

    sendInvitation(): void {
        this.changeLockedStatus.emit(true);

        const params: any = {
            additionalMessage: this.description,
            recipient: this.email
        };

        this.dataService.inviteByEmail(this.refsetInternalId, params).subscribe(
            (data) => {
                this.notificationService.show('The invitation were sent successfully', null, 'success', { timeOut: 0, extendedTimeOut: 0 });
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
