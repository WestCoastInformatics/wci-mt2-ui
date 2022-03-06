import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RefsetDetails } from 'src/app/pages/refset-details';
import { NotificationService } from 'src/app/services/notification.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { UiUtility } from 'src/app/utilities/ui.utility';

@Component({
  selector: 'upgrade-modal',
  templateUrl: './upgrade-modal.component.html'
})
export class UpgradeModalComponent implements OnInit {

  @Input()
  refsetData: any;
  @Input()
  isInitialUpgrade = true;
  @Input()
  isResumeUpgrade = false;
  @Output()
  loadingSpinner = new EventEmitter<boolean>(false);

  selectedVersion: any;
  showWarning = false;
  membersInCommon: any;
  inactiveConcepts = 0;
  totalMembers = 0;

  getResumeParam = this.route.snapshot.queryParamMap.get('isResumeUpgrade') === 'true';
  getInitialParam = this.route.snapshot.queryParamMap.get('isInitialUpgrade') === 'true';


  constructor(private readonly modalService: NgbModal,
    readonly refsetService: RefsetService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly notificationService: NotificationService,
    readonly refsetDetails: RefsetDetails) { }

  ngOnInit(): void {
  }

  openUpgradeModal(upgradeDialog: NgbModal) {

    this.sendLoadingSpinnerTrigger(true);

    this.refsetService.isRefsetLocked(this.refsetData?.id).subscribe(async (x) => {

      if (!x && (!this.isInitialUpgrade || this.getResumeParam)) {
        this.isResumeUpgrade = true;
        await this.getUpgradeData(upgradeDialog);
      } else if (!x && (this.isInitialUpgrade || !this.getResumeParam)) {
        this.isResumeUpgrade = false;
        this.modalService.open(upgradeDialog, {
          backdrop: 'static',
          keyboard: false,
          windowClass: 'upgrade-modal',
          size: 'lg'
        });
        this.sendLoadingSpinnerTrigger(false);
      }
    });

  }

  async getUpgradeData(upgradeDialog: NgbModal): Promise<void> {

    this.refsetService.getUpgradeData(this.selectedVersion ? this.selectedVersion : this.route.snapshot.queryParamMap.get('selectedVersion'), '').subscribe((members) => {
      this.totalMembers = members?.total;
      this.inactiveConcepts = members?.items?.filter((items: any) => {
        return items?.active == false;
      })?.length;


      this.modalService.open(upgradeDialog, {
        backdrop: 'static',
        keyboard: false,
        windowClass: 'upgrade-modal',
        size: 'lg'
      });
      this.sendLoadingSpinnerTrigger(false);

      this.membersInCommon = members;
    });
  }

  sendLoadingSpinnerTrigger = (value: any) => {
    this.loadingSpinner.emit(value);
  }

  listOfDates(versionList: any[]): any {
    return versionList.filter((x) => {
      if (Date.parse(x?.date) > Date.parse(this.refsetData?.versionDate) && !x?.status?.includes('IN DEVELOPMENT')) {
        return true;
      }
      return false;
    });
  }

  upgrade(): void {
    if (this.isInitialUpgrade) {
      if (!this.listOfDates(this.refsetData?.versionList)?.length || !this.selectedVersion) {
        this.showWarning = true;
        setTimeout(() => {
          this.showWarning = false;
        }, 3500);
      } else {
        this.modalService.dismissAll();
        this.refsetService.initializeUpgrade(this.selectedVersion);
        this.isInitialUpgrade = false;
        this.isResumeUpgrade = true;
        UiUtility.manageProcessNotifications(this.refsetData?.Id, this.refsetData?.refsetId, this.refsetData?.versionDate, this.notificationService, this.refsetService, this.router, 'upgrade', this.selectedVersion);
      }
    }
  }
}
