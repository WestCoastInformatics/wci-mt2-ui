import { Component, Input, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'readonly-text-modal',
  templateUrl: './readonly-text-modal.component.html'
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
  }

  openCreateRefsetModal(refsetVersionNotes: NgbModal) {
      this.modalService.open(refsetVersionNotes, { size: 'lg', backdrop : 'static', keyboard : false  });
  }
}
