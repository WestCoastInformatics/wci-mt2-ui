import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { WorkflowService } from 'src/app/services/workflow/workflow.service';

@Component({
  selector: 'review-modal',
  templateUrl: './review-modal.component.html'
})
export class ReviewModalComponent implements OnInit {

  @Output() setWorkflowStatus = new EventEmitter<boolean>();
  private reviewNotes = '';
  id: string;

  constructor(private route: ActivatedRoute, private readonly modalService: NgbModal, private workflowService: WorkflowService) { }

  ngOnInit(): void {
    this.route.params.subscribe(routeParams => {

      this.id = routeParams.refsetId;
  });
  }

  checkIfNoteAdded(): boolean {
    return this.reviewNotes.replace(/<\/?p[^>]*>/g, '')?.length > 0;
  }

  openReviewModal(reviewDialog: NgbModal) {
    this.modalService.open(reviewDialog, {
      backdrop : 'static',
      keyboard : false,
      windowClass: 'review-modal'
    });
  }

  addNoteAndSetWorkflowStatus(): void {
    if (this.checkIfNoteAdded()) {
      this.workflowService.saveNotes(this.id, this.reviewNotes);
      this.setWorkflowStatus.emit(true);
    }
  }
}
