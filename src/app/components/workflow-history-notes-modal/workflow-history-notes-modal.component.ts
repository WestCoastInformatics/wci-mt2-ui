import { Component, Input, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { WorkflowService } from 'src/app/services/workflow/workflow.service';

@Component({
  selector: 'workflow-history-notes-modal',
  templateUrl: './workflow-history-notes-modal.component.html'
})
export class WorkflowHistoryNotesModalComponent implements OnInit {
  workflowHistoryNotes: string;
  @Input()
  refsetId: string;
  constructor(private readonly modalService: NgbModal,
    private readonly refsetService: RefsetService,
    private readonly workflowService: WorkflowService) { }

  ngOnInit(): void {
  }

  openreadyForReviewModal(workflowHistoryNotesDialog: NgbModal) {
    this.modalService.open(workflowHistoryNotesDialog, {
      backdrop : 'static',
      keyboard : false,
      windowClass: 'workflow-history-notes-modal'
    });
  }

  saveNotes(): void {
    this.workflowService.saveNotes(this.refsetId, this.workflowHistoryNotes);
  }
}
