import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { RefsetService } from '../../services/rest/refset.service';
import { NotificationService } from '../../services/notification.service';
import { AuthenticationService } from '../../services/authentication/authentication.service';
import { RefsetDetails } from '../../pages/refset-details';

@Component({
	selector: 'request-access-modal',
	templateUrl: './request-access-modal.component.html',
})
export class RequestAccessModalComponent {
	email = '';
	description = '';
	openedModel: NgbModalRef;

	@Input() refset: any;
	@Output() changeLockedStatus = new EventEmitter<any>(true);

	constructor(
		private modalService: NgbModal,
		private refsetService: RefsetService,
		private notificationService: NotificationService,
		private readonly refsetDetails: RefsetDetails,
		private authService: AuthenticationService
	) {}

	get canRequest(): boolean {
		const user = this.authService.getUser();
		return !this.refset?.project?.roles || !this.refset?.project?.roles.length;
	}
	openModal(modal: NgbModal) {
		this.description = '';
		this.openedModel = this.modalService.open(modal, { backdrop: 'static', keyboard: false });
	}

	processOperationReturn = (data) => {
		this.changeLockedStatus.emit(false);
		this.refsetDetails.ngOnInit();
	};

	sendRequest(): void {
		this.changeLockedStatus.emit(true);
		const params: any = {
			additionalMessage: this.description,
		};

		this.refsetService.requestAccess(this.refset.id, params).subscribe(
			(data) => {
				this.notificationService.show('The request has been sent.', null, 'success', { timeOut: 0, extendedTimeOut: 0 });
				this.modalService.dismissAll();
				this.changeLockedStatus.emit(false);
			},
			(err) => {
				this.changeLockedStatus.emit(false);
				console.error(err);
			}
		);
	}
}
