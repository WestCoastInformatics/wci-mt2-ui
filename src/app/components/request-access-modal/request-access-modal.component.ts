import {Component, Input, OnInit} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {RefsetService} from '../../services/rest/refset.service';
import {Clipboard} from '@angular/cdk/clipboard';
import {NotificationService} from '../../services/notification.service';
import {emailValidator} from '../../validators/emailValidator';
import {AuthenticationService} from '../../services/authentication/authentication.service';


@Component({
    selector: 'request-access-modal',
    templateUrl: './request-access-modal.component.html'
})
export class RequestAccessModalComponent implements OnInit {
    model: any;
    form: FormGroup;
    @Input() refset: any;

    constructor(private readonly modalService: NgbModal, private dataService: RefsetService, private fb: FormBuilder,
                private clipboard: Clipboard, private notificationService: NotificationService, private authService: AuthenticationService) {
    }

    get modalTitle(): string {
        return this.refset?.project ? `Request access to the underlying project for "${this.refset.name}" which is "${this.refset.project.name}"`
            : '';
    }

    get canRequest(): boolean {
        const user = this.authService.getUser();
        return !this.refset?.project?.memberList?.includes(user.id);
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
            additionalMessage:  ['', [Validators.compose([Validators.required])]]
        });
    }

    onSave(): void {
        this.form.markAllAsTouched();
        if (this.form.valid) {
            this.dataService.requestAccess(this.refset.id, this.form.value).subscribe(result => {
                if (result) {
                    this.notificationService.show('Request has been sent successfully', 'Success', 'success', {
                        timeOut: 3000,
                        extendedTimeOut: 0
                    });
                }
            });
        }
    }

}
