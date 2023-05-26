import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { WorkflowService } from 'src/app/services/workflow/workflow.service';
import { EditorModule } from '@tinymce/tinymce-angular';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

declare const tinymce: any;

@Component({
	selector: 'workflow-history-notes-modal',
	templateUrl: './workflow-history-notes-modal.component.html',
	styleUrls: ['workflow-history-notes-modal.component.scss'],
})
export class WorkflowHistoryNotesModalComponent implements OnInit {
	characterCount = 0;
	title: string;
	editorInstance: any;
	openedModel: NgbModalRef;

	@Input() workflowHistoryNotes: string;
	@Input() refsetInternalId: string;
	@Input() user: string;
	@Input() disabled = false;
	@Input() edit: boolean;
	@Input() status: string;
	@Output() saved: EventEmitter<any> = new EventEmitter<any>();

	@ViewChild('workflowHistoryNotesEditor') editor: EditorModule;
	@ViewChild('modalContent', { read: TemplateRef }) content: TemplateRef<any>;

	constructor(private modalService: NgbModal, private readonly workflowService: WorkflowService) {}

	ngOnInit(): void {
		this.setTitle();
	}

	// Returns text statistics for the specified editor by id
	getStats() {
		this.editorInstance = tinymce.get('workflowHistoryNotesEditor').getBody();
		const body = this.editorInstance,
			text = tinymce.trim(body.innerHTML || body.textContent);

		return {
			/* eslint-disable no-useless-escape */
			chars: text.length,
			words: text.split(/[\w\u2019\'-]+/).length,
		};
	}

	ngOnChanges(changes: SimpleChanges) {
		for (const propertyName in changes) {
			if (propertyName === 'status') {
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

	openReadyForReviewModal(workflowModal: NgbModal) {
		this.openedModel = this.modalService.open(workflowModal, { backdrop: 'static', keyboard: false });
	}

	saveNotes(): void {
		this.workflowService.saveNotes(this.refsetInternalId, this.workflowHistoryNotes).subscribe((response) => {
			if (response) {
				this.workflowHistoryNotes = '';
				this.saved.emit(true);
				this.cancel();
			}
		});
	}

	cancel(): void {
		this.openedModel.dismiss();
	}
}
