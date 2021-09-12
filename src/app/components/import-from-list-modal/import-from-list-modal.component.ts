import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RefsetService } from 'src/app/services/rest/refset.service';

@Component({
  selector: 'import-from-list-modal',
  templateUrl: './import-from-list-modal.component.html',
  styleUrls: ['./import-from-list-modal.component.scss']
})
export class ImportFromListModalComponent {
  files: any[] = [];
  listOfIds: any;
  showLoadingSpinner = false;

  @Input()
  internalRefsetId: string;

  constructor(private modalService: NgbModal,
    private refsetService: RefsetService) {
  }

  addMembers(): void {
    this.showLoadingSpinner = true;
    console.log(this.listOfIds.replaceAll(' ', ',').replaceAll('\n', ',').trim());

    this.refsetService.addRefsetMembers(this.internalRefsetId, 'list', this.listOfIds.replaceAll(' ', ',').replaceAll('\n', ',').trim())
    .subscribe(
      data => {
        console.log(data);
        this.showLoadingSpinner = false;
      },
      error => {
        console.log(error);
        this.showLoadingSpinner = false;
      });
  }

  removeMembers(): void {
    this.showLoadingSpinner = true;
    console.log(this.listOfIds.replaceAll(' ', ',').replaceAll('\n', ',').trim());

    this.refsetService.removeRefsetMembers(this.internalRefsetId, 'list', this.listOfIds.replaceAll(' ', ',').replaceAll('\n', ',').trim())
    .subscribe(
      data => {
        console.log(data);
        this.showLoadingSpinner = false;
      },
      error => {
        console.log(error);
        this.showLoadingSpinner = false;
      });
  }

  openImportFromListModal(importFromListDialog: NgbModal) {
    this.listOfIds = undefined;
    this.modalService.open(importFromListDialog);
  }
}
