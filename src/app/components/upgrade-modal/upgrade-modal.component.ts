import { Component, Input, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'upgrade-modal',
  templateUrl: './upgrade-modal.component.html'
})
export class UpgradeModalComponent implements OnInit {

  @Input()
  refsetData: any;
  selectedVersion: string;
  showWarning = false;
  @Input()
  isInitialUpgrade = true;
  @Input()
  isResumeUpgrade = false;
  constructor(private readonly modalService: NgbModal) { }

  ngOnInit(): void {
  }

  openUpgradeModal(upgradeDialog: NgbModal) {
    this.modalService.open(upgradeDialog, {
      backdrop: 'static',
      keyboard: false,
      windowClass: 'upgrade-modal'
    });
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
      if (!this.listOfDates(this.refsetData?.versionList)?.length) {
        this.showWarning = true;
        setTimeout(() => {
          this.showWarning = false;
        }, 3500);
      } else {
        this.modalService.dismissAll();
        this.isInitialUpgrade = false;
        this.isResumeUpgrade = true;
      }
    } else if (this.isResumeUpgrade) {
      this.isInitialUpgrade = true;
      this.isResumeUpgrade = false;
    }

  }
}
