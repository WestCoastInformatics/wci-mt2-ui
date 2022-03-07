import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RefsetDetails } from 'src/app/pages/refset-details';

@Component({
  selector: 'finish-upgrade-modal',
  templateUrl: './finish-upgrade-modal.component.html'
})
export class FinishUpgradeModalComponent implements OnInit {



  constructor(private readonly modalService: NgbModal, readonly refsetDetails: RefsetDetails) { }

  ngOnInit(): void {
  }

  openFinishUpgradeModal(finishUpgradeDialog: NgbModal) {
    this.modalService.dismissAll();
    this.modalService.open(finishUpgradeDialog, {
      backdrop: 'static',
      keyboard: false,
      windowClass: 'finish-upgrade-modal',
      size: 'lg'
    });

  }
}
