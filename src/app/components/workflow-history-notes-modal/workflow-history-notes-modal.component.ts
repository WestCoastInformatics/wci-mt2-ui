import { Component, ComponentRef, Input, OnInit, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RefsetDetails } from 'src/app/pages/refset-details';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { WorkflowService } from 'src/app/services/workflow/workflow.service';
import { EditorModule, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';
import { DomService } from 'src/app/services/dom.service';
import { ComposeModalComponent } from '../compose-modal/compose-modal.component';

declare const tinymce: any;

@Component({
	selector: 'workflow-history-notes-modal',
	templateUrl: './workflow-history-notes-modal.component.html',
	styleUrls: ['./workflow-history-notes-modal.component.scss']
})
export class WorkflowHistoryNotesModalComponent implements OnInit {

	characterCount = 0;
	title: string;
	eidtorInstance: any;
	isInitialized = false;
	modal: ComponentRef<ComposeModalComponent>;

	@Input() workflowHistoryNotes: string;
	@Input() refsetInternalId: string;
	@Input() user: string;
	@Input() disabled = false;
	@Input() status: string;

	@ViewChild("workflowHistoryNotesEditor") editor: EditorModule;
	@ViewChild("modalContent", { read: TemplateRef }) content: TemplateRef<any>;

	constructor(private readonly workflowService: WorkflowService,
		private readonly domService: DomService,
		private readonly refsetDetails: RefsetDetails) { }

	ngOnInit(): void {
		this.setTitle();
	}

	// Returns text statistics for the specified editor by id
	getStats() {
		this.eidtorInstance = tinymce.get("workflowHistoryNotesEditor").getBody();
		var body = this.eidtorInstance, text = tinymce.trim(body.innerHTML || body.textContent);

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

	openReadyForReviewModal() {
		if (!this.isInitialized) {
			const comp = this.domService.appendComponentToBody(ComposeModalComponent) as ComponentRef<ComposeModalComponent>;
			comp.instance.content = this.content;
			comp.instance.title = this.title;
			this.modal = comp;
			this.isInitialized = true;
		}
		else {
			this.modal.instance.isHidden = false;
		}
	}

	saveNotes(): void {
		this.workflowService.saveNotes(this.refsetInternalId, this.workflowHistoryNotes);
		this.workflowHistoryNotes = '';
		this.modal.instance.isHidden = true;
		this.refsetDetails.ngOnInit();
	}
}
