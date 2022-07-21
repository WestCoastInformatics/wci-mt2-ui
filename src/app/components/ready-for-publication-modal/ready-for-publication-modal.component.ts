import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { WorkflowService } from 'src/app/services/workflow/workflow.service';

@Component({
  selector: 'ready-for-publication-modal',
  templateUrl: './ready-for-publication-modal.component.html'
})
export class ReadyForPublicationModalComponent implements OnInit {

  @Input() refsetData: any;
  @Input() labelPrefix: string;

  @Output() setWorkflowStatus = new EventEmitter<boolean>();

  requestForPublicationNotes = '';

  constructor(private readonly modalService: NgbModal,
    private readonly workflowService: WorkflowService) { }

  ngOnInit(): void {
  }

  openreadyForPublicationModal(readyForPublicationDialog: NgbModal) {
    this.modalService.open(readyForPublicationDialog, {
      windowClass: 'ready-for-publication-modal'
    });
  }

  clearModal(): void {
    this.requestForPublicationNotes = '';
  }

  setWorkflowStatusByAction(notes: string): void {
    if (notes) {
      this.workflowService.saveNotes(this.refsetData.id, notes).subscribe(response => {
        if (response) {
          this.setWorkflowStatus.emit(true);
        }
      });

      this.modalService.dismissAll();
      this.clearModal();
    }
  }
}
