import { Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'artifacts-modal',
    templateUrl: './artifacts-modal.component.html'
})
export class ArtifactsModalComponent {

    @Input() refset: any;
    @Input() refsetInternalId: string;
    @Input() isDetails = true;
    @ViewChild('artifactsList') artifactsList: TemplateRef<any>;

    constructor(private route: ActivatedRoute, private readonly modalService: NgbModal) {
    }

    openArtifactsModal(artifactsDialog: NgbModal) {
        this.modalService.open(artifactsDialog, {
            backdrop: 'static',
            keyboard: false,
            modalDialogClass: 'full-modal',
            centered: true,
            windowClass: 'artifact-modal'
        });
    }

    downloadSelected(selected: any) {
        alert(`Downloading ${selected.length} selected file(s)`);
    }

    onRefresh(list: any) {
        list.onReload();
    }

    get canAdd(): boolean {
        return this.refset?.roles.includes('AUTHOR') || this.refset?.roles.includes('ADMIN');
    }
}
