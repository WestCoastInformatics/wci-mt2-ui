import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'ready-for-review-modal',
  templateUrl: './ready-for-review-modal.component.html'
})
export class ReadyForReviewModalComponent implements OnInit {

  constructor(private readonly modalService: NgbModal) { }

  ngOnInit(): void {
  }

  openreadyForReviewModal(readyForReviewDialog: NgbModal) {
    this.modalService.open(readyForReviewDialog, {
      backdrop : 'static',
      keyboard : false,
      windowClass: 'ready-for-review-modal'
    });
  }
}
