import { Component, Input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuditService } from 'src/app/services/rest/audit.service';
import { UiUtility } from 'src/app/utilities/ui.utility';

@Component({
	selector: 'audit-trail-modal',
	templateUrl: './audit-trail-modal.component.html'
})
export class AuditTrailModalComponent {

    downloadDisabled: boolean = true;

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

	getAuditReport(): void {

		const auditReport = JSON.parse(localStorage.getItem('audit_report'));
		const auditData = [];

		for (let auditRow of auditReport) {
			auditData.push({
				'Date': new Date(auditRow.created)?.toUTCString(),
				'Modified By': auditRow?.modifiedBy,
				'Message': auditRow?.message,
				'Details': auditRow?.details
			});
		}


		const auditReportObject = {
			'auditData': auditData,
		};
		UiUtility.createAuditReport(this.refsetInternalId, auditReportObject);
	}

    dataLoadedStatus = (value: boolean) => {
        this.downloadDisabled = !value;
    }
}
