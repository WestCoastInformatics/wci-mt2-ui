import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'ready-for-publication-modal',
  templateUrl: './ready-for-publication-modal.component.html'
})
export class ReadyForPublicationModalComponent implements OnInit {

  constructor(private readonly modalService: NgbModal) { }

  ngOnInit(): void {
  }

  openreadyForPublicationModal(readyForPublicationDialog: NgbModal) {
    this.modalService.open(readyForPublicationDialog, {
      backdrop : 'static',
      keyboard : false,
      windowClass: 'ready-for-publication-modal'
    });
  }
}
