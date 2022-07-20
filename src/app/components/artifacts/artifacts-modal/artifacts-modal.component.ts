import {AfterViewInit, Component, ComponentRef, Input, TemplateRef, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ArtifactsListComponent} from '../artifacts-list/artifacts-list.component';

@Component({
    selector: 'artifacts-modal',
    templateUrl: './artifacts-modal.component.html'
})
export class ArtifactsModalComponent implements AfterViewInit {


    @Input() refsetInternalId: string;
    @Input() isDetails = true;
    @ViewChild('artifactsList') artifactsList: TemplateRef<any>;

    constructor(private route: ActivatedRoute, private readonly modalService: NgbModal) {
    }

    ngAfterViewInit(): void {

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
}
