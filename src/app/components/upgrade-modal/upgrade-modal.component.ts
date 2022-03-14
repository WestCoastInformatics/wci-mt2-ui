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
  refsetId: any;
  @Input()
  refsetInternalId: any;
  @Input()
  refsetVersionDate: any;
  @Output()
  loadingSpinner = new EventEmitter<boolean>(false);
  @Input()
  membersOfRefset: any;
  selectedVersion: any;
  showWarning = false;
  membersInCommon: any;
  inactiveConcepts = 0;
  totalMembers = 0;




  constructor(private readonly modalService: NgbModal,
    readonly refsetService: RefsetService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly notificationService: NotificationService,
    readonly refsetDetails: RefsetDetails) { }

  ngOnInit(): void {
  }

  openUpgradeModal(upgradeDialog: NgbModal) {
    this.selectedVersion = this.refsetData.id;

    this.sendLoadingSpinnerTrigger(true);

    this.refsetService.isRefsetLocked(this.refsetData?.id).subscribe(async (x) => {

      if (!x && (!this.isInitialUpgrade)) {
        await this.getUpgradeData(upgradeDialog);
      } else if (!x && (this.isInitialUpgrade)) {
        this.modalService.open(upgradeDialog, {
          backdrop: 'static',
          keyboard: false,
          windowClass: 'upgrade-modal',
          size: 'lg'
        });
      }
      this.sendLoadingSpinnerTrigger(false);
    });

  }

  get isInitialUpgrade(): boolean {
    if (this.refsetData?.availableActions?.includes('CANCEL_UPGRADE') || this.refsetData?.availableActions?.includes('FINISH_UPGRADE')) {
      return false;
    } else if (this.refsetData?.availableActions?.includes('EDIT')) {
      return true;
    }
  }

  async getUpgradeData(upgradeDialog: NgbModal): Promise<void> {

    this.refsetService.getUpgradeData(this.selectedVersion ? this.selectedVersion : this.route.snapshot.queryParamMap.get('selectedVersion'), '').subscribe((members) => {
      this.totalMembers = members?.miscCountA;
      this.inactiveConcepts = members?.total;

      this.modalService.open(upgradeDialog, {
        backdrop: 'static',
        keyboard: false,
        windowClass: 'upgrade-modal',
        size: 'lg'
      });

      this.membersInCommon = members;
    });
  }

  sendLoadingSpinnerTrigger = (value: any) => {
    this.loadingSpinner.emit(value);
  }

  latestDate(versionList: any[]): string {
    return versionList[0].date;
  }

  upgrade(): void {
    if (this.isInitialUpgrade) {
      this.refsetService.initializeUpgrade(this.selectedVersion).subscribe((x) => {
        if (this.router.url.includes('/' + this.refsetId)) {
          window.location.reload();
        }
      });
      UiUtility.manageProcessNotifications(this.refsetInternalId, this.refsetId, this.refsetVersionDate, this.notificationService, this.refsetService, this.router, 'lookup', this.selectedVersion);
      console.log(this.refsetInternalId, this.refsetId, this.refsetVersionDate);
      this.modalService.dismissAll();
      this.refsetDetails.initializeDetailsPage();
    }
  }

  getInactiveChangeReport(): void {
    const memberItems = this.membersInCommon.items;
    const inactiveConcepts = memberItems.filter((items: any) => {
      return items?.active == false;
    });
    let data = [];
    for (let i = 0; i < inactiveConcepts.length; i++) {
      data.push({
        'Inactive Concept ID': inactiveConcepts[i].code,
        'Inactive Concept': this.transformDescriptions(inactiveConcepts[i].descriptions).term.replaceAll(',', '/'),
        'Reason': inactiveConcepts[i].replacementConcecpts ? inactiveConcepts[i].replacementConcecpts[0].reason : '',
        'Suggested Replacement Concept ID': inactiveConcepts[i].replacementConcecpts ? inactiveConcepts[i].replacementConcecpts[0].code : '',
        'Suggested Replacement Concept': this.transformReplacementDescriptions(inactiveConcepts[i].replacementConcecpts ? inactiveConcepts[i].replacementConcecpts[0].descriptions : '').term.replaceAll(',', '/')
      });
    }

    console.log(inactiveConcepts);
    UiUtility.createInactiveChangeReport(this.refsetData.refsetId, data);
  }

  transformDescriptions(descriptions: any) {
    if (descriptions) {
      const getStringifiedJSON = descriptions.split('[')[1].split(']')[0];
      if (getStringifiedJSON) {
        const formattedObjectArray = getStringifiedJSON.slice(1).split('{"descriptionId"').map((x) => {
          if (x[x.length - 1] === ',') {
            const modifiedString = x.slice(0, -1);
            x = modifiedString;
          }
          if (!x.includes('"descriptionId"')) {
            x = '{"descriptionId"' + x;
          } else if (!x.includes('{"descriptionId"') && x.includes('"descriptionId"')) {
            x = '{' + x;
          }
          if (x[x.length - 1] !== '}' && x[x.length - 2] !== '"') {
            x = x + '"}';
          }
          return JSON.parse(x);
        });
        return formattedObjectArray[0];
      }
    }
  }

  transformReplacementDescriptions(descriptions: any) {
    if (descriptions) {
      const getStringifiedJSON = descriptions.split('[')[1].split(']')[0];
      if (getStringifiedJSON) {
        const formattedObjectArray = getStringifiedJSON.slice(1).split('{"active"').map((x) => {
          if (x[x.length - 1] === ',') {
            const modifiedString = x.slice(0, -1);
            x = modifiedString;
          }
          if (!x.includes('"active"')) {
            x = '{"active"' + x;
          } else if (!x.includes('{"active"') && x.includes('"active"')) {
            x = '{' + x;
          }
          if (x[x.length - 1] !== '}' && x[x.length - 2] !== '"') {
            x = x + '"}';
          }
          return JSON.parse(x);
        });
        return formattedObjectArray[0];
      }
    }
  }
}
