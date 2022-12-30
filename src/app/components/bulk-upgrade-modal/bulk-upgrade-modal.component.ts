import { Component, EventEmitter, Input, Output } from "@angular/core";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { RefsetService } from "src/app/services/rest/refset.service";
import { UiUtility } from "src/app/utilities/ui.utility";
import { NotificationService } from "src/app/services/notification.service";
import { Router } from '@angular/router';
import { Constants } from "src/app/utilities/constants.utility";

@Component({
	selector: "bulk-upgrade-modal",
	templateUrl: "./bulk-upgrade-modal.component.html",
})
export class BulkUpgradeModalComponent {

	refsetsForUpgrade: any[] = [];
	selectedRefsets: any[] = [];
	openedModel: NgbModalRef;

	@Input() project: any;
	@Output() processComplete = new EventEmitter<any>(true);
	
	constructor(
		private modalService: NgbModal,
		private refsetService: RefsetService,
		private notificationService: NotificationService,
		private readonly router: Router,
	) { }

	openUpgradeModal(bulkUpgradeDialog: NgbModal) {

		this.refsetsForUpgrade = [];
		this.selectedRefsets = [];

		const restParams: any = {
			limit: -1,
			offset: 0,
			searchConcepts: true,
			showInDevelopment: true,
			query: "projectId:" + this.project.id + " AND workflowStatus:('PUBLISHED' OR 'READY_FOR_EDIT')"
		};

		this.refsetService.getRefsets({ ...restParams }).subscribe({
			next: (results) => {

				for (const refset of results.items) {

					this.refsetsForUpgrade.push({
						id: refset.id,
						name: refset.name, 
						refsetId: refset.refsetId, 
					});
				}

				this.refsetsForUpgrade = this.sortRefsets(this.refsetsForUpgrade);
				
			},
			error: (error) => {}
		});

		this.openedModel = this.modalService.open(bulkUpgradeDialog, { backdrop: 'static', keyboard: false, windowClass: 'createNewRefsetDialog'});
	}

	upgradeRefsets(): void {

		let refsetInternalIds = '';
		let refsetIds = '';
		
		for (let refset of this.selectedRefsets) {

			refsetInternalIds += refset.id + ',';
			refsetIds += refset.refsetId + ', ';
		}

		refsetInternalIds = refsetInternalIds.slice(0, -1);
		refsetIds = refsetIds.slice(0, -2);

		this.modalService.dismissAll();

    	this.refsetService.initializeUpgrade(refsetInternalIds).subscribe();

    	UiUtility.manageProcessNotifications(refsetInternalIds, refsetIds, Constants.IN_DEVELOPMENT, this.emitProcessComplete, this.notificationService, this.refsetService, this.router, 'bulk upgrade');
	}

	emitProcessComplete = () => { 
		this.processComplete.emit(true); 
	}

	sortRefsets(refsets) {

        return refsets.sort((refset1, refset2) => {

            const name1 = refset1.name;
            const name2 = refset2.name;

            const compareValue = name1.localeCompare(name2);
            return compareValue;
        });
    }
}
