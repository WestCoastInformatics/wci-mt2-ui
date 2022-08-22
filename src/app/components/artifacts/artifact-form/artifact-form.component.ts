import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ArtifactsService } from '../../../services/rest/artifacts.service';
import { Artifact } from '../../../models/artifact';

@Component({
    selector: 'artifact-form',
    templateUrl: './artifact-form.component.html'
})
export class ArtifactFormComponent implements OnInit {
    file: File;
    model: any;
    deleteModel: any;
    @Input() artifact: Artifact;

    @Input() refsetInternalId: string;
    @Output() refresh = new EventEmitter<any>();
    @ViewChild('confirmDeleteModal') confirmDeleteModal: NgbModal;
    loaded = false;

    constructor(private readonly modalService: NgbModal, private artifactsService: ArtifactsService) {
    }

    get modalTitle(): string {
        return this.artifact?.id ? `Edit Artifact: ${this.artifact.fileName}` : 'New Artifact';
    }

    get isEdit(): boolean {
        return !!this.artifact?.id;
    }

    ngOnInit(): void {
        if (!this.artifact) {
            this.artifact = new Artifact();
            this.artifact.entityId = this.refsetInternalId;
            this.artifact.entityType = 'REFSET';
        }
        this.loaded = true;
    }

    openArtifactsModal(artifactsDialog: NgbModal) {
        this.model = this.modalService.open(artifactsDialog, {
            backdrop: 'static',
            keyboard: false,
            modalDialogClass: 'modal-xl',
            centered: true,
            windowClass: 'artifact-modal'
        });
    }

    deleteArtifact() {
        this.deleteModel.dismiss();
        this.artifactsService.deleteArtifact(this.artifact?.id).subscribe((result) => {
            this.refresh.emit();
            this.model.dismiss();
        });
    }

    confirmDelete() {
        this.deleteModel = this.modalService.open(this.confirmDeleteModal, {
            backdrop: 'static',
            keyboard: false,
            modalDialogClass: 'modal-md',
            centered: true,
            windowClass: 'artifact-modal'
        });
    }

    fileChange(fileInputEvent: any) {
        if (fileInputEvent.target) {
            this.file = fileInputEvent.target.files[0];
        } else {
            this.file = fileInputEvent[0];
        }
        this.artifact.fileName = this.file?.name;
    }

    onSave() {
        if (!this.artifact?.id && this.file || this.artifact?.id) {
            const data = new FormData();
            if (!this.isEdit) {
                data.append('file', this.file || null);
            }
            data.append('artifact', JSON.stringify(this.artifact));
            if (this.isEdit) {
                this.artifactsService.updateArtifact(this.artifact?.id, JSON.stringify(this.artifact)).subscribe((result) => {
                    this.refresh.emit();
                    this.model.dismiss();
                });
            } else {
                this.artifactsService.createArtifact(data).subscribe((result) => {
                    this.refresh.emit();
                    this.model.dismiss();
                });
            }
        }
    }

}
