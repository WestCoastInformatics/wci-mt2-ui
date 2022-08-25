import {Component, Input, OnInit} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {RefsetService} from '../../services/rest/refset.service';
import {Clipboard} from '@angular/cdk/clipboard';
import {NotificationService} from '../../services/notification.service';
import {emailValidator} from '../../validators/emailValidator';


@Component({
    selector: 'invite-people-modal',
    templateUrl: './invite-people-modal.component.html'
})
export class InvitePeopleModalComponent implements OnInit {
    model: any;
    form: FormGroup;
    @Input() refset: any;

    constructor(private readonly modalService: NgbModal, private dataService: RefsetService, private fb: FormBuilder,
                private clipboard: Clipboard, private notificationService: NotificationService) {
    }

    get modalTitle(): string {
        return 'Invite Collaborator to your organization';
    }

    get canInvite(): boolean {
        return this.refset?.project?.roles.includes('ADMIN');
    }

    errors(key: string): string[] {
        const errors = [];
        Object.keys(this.form.get(key).errors).forEach(e => {
            errors.push(this.form.get(key).errors[e].message);
        });
        return errors;
    }

    ngOnInit(): void {
        this.newForm();
    }

    openModal(modalDialog: NgbModal) {
        this.newForm();
        this.model = this.modalService.open(modalDialog, {
            backdrop: 'static',
            keyboard: false,
            centered: true,
            windowClass: 'share-modal'
        });
    }

    newForm(): void {
        this.form = this.fb.group({
            recipient: ['', [Validators.compose([emailValidator(), Validators.required])]],
            additionalMessage: ['']
        });
    }

    onSave(): void {
        this.form.markAllAsTouched();
        if (this.form.valid) {
            /*this.dataService.shareRefset(this.refset.id, this.form.value).subscribe(result => {
                if (result) {
                    this.notificationService.show('Profile was successfully updated', 'Success', 'success', {
                        timeOut: 3000,
                        extendedTimeOut: 0
                    });
                }
            });*/
        }
    }

}
