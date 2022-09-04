import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { NotificationService } from 'src/app/services/notification.service';
import { RefsetDetails } from 'src/app/pages/refset-details';
import { OrganizationsService } from 'src/app/services/rest/organizations.service';

@Component({
    selector: 'email-refset-modal',
    templateUrl: './email-refset-modal.component.html',
})
export class EmailRefsetModalComponent {

    email = '';
    description = '';
    openedModel: NgbModalRef;
    emailError = '';

    @Input() refset: any;
    @Input() refsetInternalId: string;
    @Output() changeLockedStatus = new EventEmitter<any>(true);

    constructor(
        private modalService: NgbModal,
        private changeDetectorRef: ChangeDetectorRef,
        private refsetService: RefsetService,
        private organizationsService: OrganizationsService,
        private notificationService: NotificationService,
        private readonly refsetDetails: RefsetDetails,
    ) { }

    openEmailRefsetModal(emailRefsetDialog: NgbModal) {

        this.description = '';
        this.openedModel = this.modalService.open(emailRefsetDialog, { backdrop: 'static', keyboard: false });


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
        console.log(event.target.value);
        this.isValidEmail();
    }

    emailRefsetObject(): void {

        this.changeLockedStatus.emit(true);

        const params: any = {
            additionalMessage: this.description,
            recipient: this.email
        };

        this.refsetService.emailRefset(this.refsetInternalId, params).subscribe(
            (data) => {
                this.notificationService.show('The refset was emailed.', null, 'success', { timeOut: 0, extendedTimeOut: 0 });
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
