import {AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ArtifactsService} from '../../../services/rest/artifacts.service';
import {Artifact} from '../../../models/artifact';

@Component({
    selector: 'artifact-form',
    templateUrl: './artifact-form.component.html'
})
export class ArtifactFormComponent implements OnInit, AfterViewInit {
    file: File;
    model: any;
    @Input() artifact: Artifact;

    @Input() refsetInternalId: string;
    isEdit = false;
    @Output() refresh = new EventEmitter<any>();
    loaded = false;

    constructor(private route: ActivatedRoute, private readonly modalService: NgbModal, private artifactsService: ArtifactsService,
                private changeDetectorRef: ChangeDetectorRef) {
    }

    get modalTitle(): string {
        return this.artifact?.id ? `Edit Artifact: ${this.artifact.fileName}` : 'New Artifact';
    }

    ngOnInit(): void {
        if (!this.artifact) {
            this.artifact = new Artifact();
            this.artifact.entityId = this.refsetInternalId;
            this.artifact.entityType = 'REFSET';
        } else {
            this.isEdit = true;
        }
        this.loaded = true;
    }

    ngAfterViewInit(): void {
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

    fileChange(fileInputEvent: any) {
        this.file = fileInputEvent.target.files[0];
        this.artifact.fileName = this.file?.name;
    }

    onSave() {
        if (!this.artifact?.id && this.file || this.artifact?.id) {
            const data = new FormData();
            data.append('file', this.file || null);
            data.append('artifact', JSON.stringify(this.artifact));
            if (this.artifact?.id) {
                this.artifactsService.updateArtifact(this.artifact?.id, data).subscribe((result) => {
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
