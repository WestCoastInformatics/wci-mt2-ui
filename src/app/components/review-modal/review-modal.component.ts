import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'review-modal',
  templateUrl: './review-modal.component.html'
})
export class ReviewModalComponent implements OnInit {

  constructor(private readonly modalService: NgbModal) { }

  ngOnInit(): void {
  }

  openReviewModal(reviewDialog: NgbModal) {
    this.modalService.open(reviewDialog, {
      backdrop : 'static',
      keyboard : false,
      windowClass: 'review-modal'
    });
  }
}
