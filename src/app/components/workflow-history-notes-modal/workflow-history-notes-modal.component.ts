import { Component, Input, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RefsetDetails } from 'src/app/pages/refset-details';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { WorkflowService } from 'src/app/services/workflow/workflow.service';
import { EditorModule, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';

declare const tinymce: any;

@Component({
	selector: 'workflow-history-notes-modal',
	templateUrl: './workflow-history-notes-modal.component.html'
})
export class WorkflowHistoryNotesModalComponent implements OnInit {

	characterCount = 0;
	title: string;

	@Input() workflowHistoryNotes: string;
	@Input() refsetId: string;
	@Input() user: string;
	@Input() disabled = false;
	@Input() status: string;

	@ViewChild("workflowHistoryNotesEditor") editor: EditorModule;

	constructor(private readonly modalService: NgbModal,
		private readonly workflowService: WorkflowService,
		private readonly refsetDetails: RefsetDetails) { }

	ngOnInit(): void {
		this.setTitle();
	}

	// Returns text statistics for the specified editor by id
	getStats() {
		var body = tinymce.get("workflowHistoryNotesEditor").getBody(), text = tinymce.trim(body.innerHTML || body.textContent);

		return {
			chars: text.length,
			words: text.split(/[\w\u2019\'-]+/).length
		};
	}

	ngOnChanges(changes: SimpleChanges) {

		for (const propertyName in changes) {

			if (propertyName === "status") {
				this.setTitle();
			}
		}
	}

	setTitle() {

		if (this.status == 'IN_EDIT') {
			this.title = 'Authoring Notes';
		} else {
			this.title = 'Reviewer Notes';
		}
	}

	openreadyForReviewModal(workflowHistoryNotesDialog: NgbModal) {
		this.modalService.open(workflowHistoryNotesDialog, {
			//backdrop: 'static',
			//keyboard: false,
			windowClass: 'workflow-history-notes-modal'
		});
	}

	saveNotes(modal: any): void {
	
		modal.close('Save');
		this.refsetDetails.ngOnInit();
		this.workflowService.saveNotes(this.refsetId, this.workflowHistoryNotes);
		this.workflowHistoryNotes = '';
		this.refsetDetails.ngOnInit();
	}
}
