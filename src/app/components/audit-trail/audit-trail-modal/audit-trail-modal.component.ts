import { Component, Input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
	selector: 'audit-trail-modal',
	templateUrl: './audit-trail-modal.component.html'
})
export class AuditTrailModalComponent {


	@Input() refsetInternalId: string;
	@Input() isDetails = true;

	constructor(private readonly modalService: NgbModal) { }

	openTrailModal(trailDialog: NgbModal) {
		this.modalService.open(trailDialog, {
			modalDialogClass: 'full-modal',
			centered: true,
			windowClass: 'audit-trail-modal'
		});
	}

}
