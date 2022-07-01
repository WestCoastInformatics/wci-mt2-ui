import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';

@Component({
    selector: 'artifact-form',
    templateUrl: './artifact-form.component.html'
})
export class ArtifactFormComponent implements OnInit, AfterViewInit {
    name: string;
    description: string;
    file: File;

    @Input() refsetInternalId: string;

    constructor(private route: ActivatedRoute, private readonly modalService: NgbModal, private refsetService: RefsetService,
        private changeDetectorRef: ChangeDetectorRef) { }

    ngOnInit(): void {
    }

    ngAfterViewInit(): void {
    }

    openArtifactsModal(artifactsDialog: NgbModal) {
        this.modalService.open(artifactsDialog, {
            //backdrop : 'static',
            //keyboard : false,
            modalDialogClass: 'modal-xl',
            centered: true,
            windowClass: 'artifact-modal'
        });
    }

    fileChange(fileInputEvent: any) {
        this.file = fileInputEvent.target.files[0];
    }

    get modalTitle(): string {
        return 'New Artifact';
    }

}
