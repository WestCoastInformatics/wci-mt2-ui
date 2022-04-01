import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { RefsetDetails } from 'src/app/pages/refset-details';
import { NotificationService } from 'src/app/services/notification.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { RefsetUtility } from 'src/app/utilities/refset.utility';
import { UiUtility } from 'src/app/utilities/ui.utility';

@Component({
    selector: 'app-launch-comparison-modal',
    templateUrl: './launch-comparison-modal.component.html'
})
export class LaunchComparisonModalComponent implements OnInit {

    comparisonRefset: any;
    comparisonRefsetId: string;
    activeRefsetVersionOptions: any[];
    comparisonRefsetVersionOptions: any[];
    comparisonTypeSelected: String
    activeRefsetVersionDate: string;
    refsetOptions: any[];
    refsetOptionsLoading = false;
    openedModel: NgbModalRef;

    @Input() activeRefset: any;
    @Input() isDetailPage: boolean;
    @Output() loadingSpinner = new EventEmitter<boolean>(false);

    constructor(private readonly modalService: NgbModal,
        readonly refsetService: RefsetService,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly notificationService: NotificationService,
        readonly refsetDetails: RefsetDetails) {
    }

    ngOnInit(): void {
    }

    openModal(dialog: NgbModal) {

        this.comparisonRefset = null;
        this.comparisonRefsetId = null;
        this.activeRefsetVersionOptions = [];
        this.comparisonRefsetVersionOptions = [];
        this.refsetOptions = [];
        this.comparisonTypeSelected = "same_refset";
        this.activeRefsetVersionDate = CodeUtility.formatJsonDate(this.activeRefset.versionDate, CodeUtility.DATE_FORMAT_REVERSE);
        this.activeRefsetVersionOptions = RefsetUtility.getVersionOptions(this.activeRefset);
        let selectedVersionDateIndex = this.activeRefsetVersionOptions.findIndex((element) => { return element.display.startsWith(this.activeRefsetVersionDate); });

        if (this.activeRefsetVersionOptions.length > 0) {
            this.activeRefsetVersionOptions.splice(selectedVersionDateIndex, selectedVersionDateIndex + 1);
        }

        this.openedModel = this.modalService.open(dialog, { backdrop: 'static', keyboard: false, windowClass: 'launch-comparison-dialog', size: 'lg' });
    }

    sendLoadingSpinnerTrigger = (value: any) => {
        this.loadingSpinner.emit(value);
    }

    comparisonSelectionChange(event: any): void {

        this.comparisonTypeSelected = event.value;
        this.comparisonRefset = null;
        this.comparisonRefsetId = null;
        this.comparisonRefsetVersionOptions = [];
    }

    async onKeyUp(value): Promise<void> {
        await this.search(value);
    }

    search(query: string): void {

        this.refsetOptionsLoading = true;
        this.refsetOptions = [];
        this.comparisonRefset = null;
        this.comparisonRefsetId = null;
        this.comparisonRefsetVersionOptions = [];

        const results = this.refsetService.searchRefsetsForDropdowns(query).subscribe((results) => {

            this.refsetOptions = results.items;
            this.refsetOptionsLoading = false;
        });
    }

    comparisonRefsetSelected(event) {

        this.comparisonRefset = event.value;
        this.comparisonRefsetVersionOptions = RefsetUtility.getVersionOptions(this.comparisonRefset);
    }

    checkComplete() {
        return this.comparisonRefsetId != null;
    }

    launchComparison() {

        this.refsetService.launchComparison(this.activeRefset.id, this.comparisonRefsetId).subscribe();
        UiUtility.manageProcessNotifications(this.activeRefset.id, this.activeRefset.refsetId, RefsetUtility.IN_DEVELOPMENT, null, this.notificationService, this.refsetService, this.router, 'comparison');

        this.openedModel.close();
		this.openedModel = null;
    }
}
