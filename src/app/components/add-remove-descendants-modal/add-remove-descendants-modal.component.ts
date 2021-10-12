import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'add-remove-descendants-modal',
  templateUrl: './add-remove-descendants-modal.component.html'
})
export class AddRemoveDescendantsModalComponent implements OnInit {

  constructor(private readonly modalService: NgbModal) { }

  ngOnInit(): void {
  }

  openAddRemoveDescendantsModal(addRemoveDescendantsDialog: NgbModal) {
    this.modalService.open(addRemoveDescendantsDialog, {
      backdrop : 'static',
      keyboard : false,
      windowClass: 'add-remove-descendants-modal'
    });
  }

}
