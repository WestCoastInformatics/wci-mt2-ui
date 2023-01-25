import { Component, Input, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'readonly-text-modal',
  templateUrl: './readonly-text-modal.component.html',
  styleUrls: ['readonly-text-modal.component.scss']
})
export class ReadonlyTextModalComponent implements OnInit {
  @Input()
  longText: string;
  @Input()
  shortText: string;
  @Input()
  title: string;

  constructor(private readonly modalService: NgbModal) { }

  ngOnInit(): void {
    if (this.shortText?.length > 25) {
      this.shortText = this.shortText?.slice(0, 24) + '...';
    }
  }

  openCreateRefsetModal(refsetVersionNotes: NgbModal) {
    this.modalService.open(refsetVersionNotes, { size: 'lg', windowClass: 'refset-version-notes' });
  }
}
