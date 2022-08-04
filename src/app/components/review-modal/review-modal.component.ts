import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { WorkflowService } from 'src/app/services/workflow/workflow.service';

@Component({
    selector: 'review-modal',
    templateUrl: './review-modal.component.html'
})
export class ReviewModalComponent {

    @Input() refsetInternalId: string;
    @Output() setWorkflowStatus = new EventEmitter<boolean>();
    editorConfig: any = {
        base_url: '/tinymce', suffix: '.min', height: 200,
        maxlength: 255, menubar: false, plugins: ['lists advlist wordcount'],
        toolbar: 'undo redo | bold italic | bullist numlist outdent indent',
        setup: function (ed) {
            ed.on('keypress', function (evt) {
                if ($(ed.getBody()).text().length + 1 > ed.getParam('maxlength')) {
                    evt.preventDefault();
                    // evt.stopPropagation();
                    return false;
                }
            });
        }
    };
    private reviewNotes = '';

    constructor(private route: ActivatedRoute, private readonly modalService: NgbModal, private workflowService: WorkflowService,
        private changeDetector: ChangeDetectorRef) {
    }

    checkIfNoteAdded(): boolean {
        return this.reviewNotes.replace(/<\/?p[^>]*>/g, '')?.length > 0;
    }

    openReviewModal(reviewDialog: NgbModal) {
        this.modalService.open(reviewDialog, {
            // backdrop : 'static',
            // keyboard : false,
            windowClass: 'review-modal'
        });
    }

    addNoteAndSetWorkflowStatus(): void {
        if (this.checkIfNoteAdded()) {
            this.workflowService.saveNotes(this.refsetInternalId, this.reviewNotes).subscribe(response => {
                if (response) {
                    this.setWorkflowStatus.emit(true);
                }
            });
        }
    }
}
