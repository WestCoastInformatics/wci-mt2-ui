import {Component, ComponentRef, EventEmitter, Input, OnInit, Output, SimpleChanges, TemplateRef, ViewChild} from '@angular/core';
import {WorkflowService} from 'src/app/services/workflow/workflow.service';
import {EditorModule} from '@tinymce/tinymce-angular';
import {DomService} from 'src/app/services/dom.service';
import {ComposeModalComponent} from '../compose-modal/compose-modal.component';

declare const tinymce: any;

@Component({
  selector: 'workflow-history-notes-modal',
  templateUrl: './workflow-history-notes-modal.component.html',
  styleUrls: ['workflow-history-notes-modal.component.scss']
})
export class WorkflowHistoryNotesModalComponent implements OnInit {

  characterCount = 0;
  title: string;
  editorInstance: any;
  isInitialized = false;
  modal: ComponentRef<ComposeModalComponent>;

  @Input() workflowHistoryNotes: string;
  @Input() refsetInternalId: string;
  @Input() user: string;
  @Input() disabled = false;
  @Input() edit: boolean;
  @Input() status: string;
  @Output() saved: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild('workflowHistoryNotesEditor') editor: EditorModule;
  @ViewChild('modalContent', {read: TemplateRef}) content: TemplateRef<any>;

  constructor(private readonly workflowService: WorkflowService,
              private readonly domService: DomService) {
  }

  ngOnInit(): void {
    this.setTitle();
  }

  // Returns text statistics for the specified editor by id
  getStats() {
    this.editorInstance = tinymce.get('workflowHistoryNotesEditor').getBody();
    var body = this.editorInstance, text = tinymce.trim(body.innerHTML || body.textContent);

    return {
      chars: text.length,
      words: text.split(/[\w\u2019\'-]+/).length
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

  openReadyForReviewModal() {
    if (!this.isInitialized) {
      const comp = this.domService.appendComponentToBody(ComposeModalComponent) as ComponentRef<ComposeModalComponent>;
      comp.instance.content = this.content;
      comp.instance.title = this.title;
      this.modal = comp;
      this.isInitialized = true;
    } else {
      this.modal.instance.isHidden = false;
    }
  }

  saveNotes(): void {
    this.workflowService.saveNotes(this.refsetInternalId, this.workflowHistoryNotes).subscribe(response => {
      if (response) {
        this.workflowHistoryNotes = '';
        this.modal.instance.isHidden = true;
        this.saved.emit(true);
      }
    });
  }

  cancel(): void {
    this.modal.instance.isHidden = true;
  }
}
