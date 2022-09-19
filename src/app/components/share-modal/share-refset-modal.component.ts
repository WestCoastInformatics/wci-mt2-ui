import {Component, Input, OnInit} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Refset} from '../../models/refset';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {RefsetService} from '../../services/rest/refset.service';
import {RefsetUtility} from '../../utilities/refset.utility';
import {Clipboard} from '@angular/cdk/clipboard';
import {NotificationService} from '../../services/notification.service';
import {emailValidator} from '../../validators/emailValidator';


@Component({
    selector: 'share-refset',
    templateUrl: './share-refset-modal.component.html'
})
export class ShareRefsetModalComponent implements OnInit {
    model: any;
    form: FormGroup;
    @Input() refset: Refset;

    constructor(private readonly modalService: NgbModal, private dataService: RefsetService, private fb: FormBuilder,
                private clipboard: Clipboard, private notificationService: NotificationService) {
    }

    get modalTitle(): string {
        return this.refset?.id ? `Share Refset: ${this.refset.name}` : 'Share Refset';
    }

    get directUrl(): string {
        return this.refset?.refsetId ? (window.location.protocol + '//' + window.location.host + '/details/' + this.refset.refsetId + '/'
            + RefsetUtility.getVersionDateForRefsetApiCall(this.refset)) : '';
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

    openShareModal(modalDialog: NgbModal) {
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
            recipient: ['', [Validators.required]],
            additionalMessage: ['']
        });
    }

    onSave(): void {
        this.form.markAllAsTouched();
        if (this.form.valid) {
            this.dataService.shareRefset(this.refset.id, this.form.value).subscribe(result => {
                if (result) {
                    this.notificationService.show('Profile was successfully updated', 'Success', 'success', {
                        timeOut: 3000,
                        extendedTimeOut: 0
                    });
                }
            });
        }
    }

    getLink(): void {
        this.clipboard.copy(this.directUrl);
        this.notificationService.show('URL Copied to clipboard', 'Success', 'success', {timeOut: 2000, extendedTimeOut: 0});
    }

}
