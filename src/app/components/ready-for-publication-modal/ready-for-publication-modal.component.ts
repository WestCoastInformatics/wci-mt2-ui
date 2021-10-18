import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { WorkflowService } from 'src/app/services/workflow/workflow.service';

@Component({
  selector: 'ready-for-publication-modal',
  templateUrl: './ready-for-publication-modal.component.html'
})
export class ReadyForPublicationModalComponent implements OnInit {
  @Input()
  refsetData: any;

  @Output()
  reloadPage = new EventEmitter<boolean>();
  
  requestForPublicationNotes = '';
  constructor(private readonly modalService: NgbModal,
    private readonly workflowService: WorkflowService) { }

  ngOnInit(): void {
  }

  openreadyForPublicationModal(readyForPublicationDialog: NgbModal) {
    this.modalService.open(readyForPublicationDialog, {
      backdrop : 'static',
      keyboard : false,
      windowClass: 'ready-for-publication-modal'
    });
  }

  clearModal(): void {
    this.requestForPublicationNotes = '';
  }

  setWorkflowStatusByAction(notes: string, action: string): void {
    this.workflowService
        .setWorkflowStatusByAction(
            this.refsetData.id,
            this.refsetData.modifiedBy,
            action,
            notes
        )
        .subscribe((results) => {
            console.log(results);
            if (results) {
                // window.location.reload();
                this.reloadPage.emit();
            }
        });
}
}
