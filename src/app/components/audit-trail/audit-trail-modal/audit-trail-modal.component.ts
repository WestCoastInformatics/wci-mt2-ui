import { AfterViewInit, Component, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RefsetService } from 'src/app/services/rest/refset.service';

@Component({
	selector: 'audit-trail-modal',
	templateUrl: './audit-trail-modal.component.html'
})
export class AuditTrailModalComponent implements AfterViewInit{


	@Input() refsetInternalId: string;
	@Input() isDetails: boolean = true;

	constructor(private route: ActivatedRoute, private readonly modalService: NgbModal, private refsetService: RefsetService) { }

	ngAfterViewInit(): void {
	}
	openTrailModal(trailDialog: NgbModal) {
		this.modalService.open(trailDialog, {
			//backdrop : 'static',
			//keyboard : false,
			modalDialogClass: 'full-modal',
            centered: true,
			windowClass: 'audit-trail-modal'
		});
	}

}
