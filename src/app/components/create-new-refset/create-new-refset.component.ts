import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { firstValueFrom } from 'rxjs';
import { Route, Router } from '@angular/router';
import { WorkflowService } from 'src/app/services/workflow/workflow.service';
import { RefsetDetails } from 'src/app/pages/refset-details';
import { UiUtility } from "src/app/utilities/ui.utility";


@Component({
    selector: 'create-new-refset',
    templateUrl: './create-new-refset.component.html',
})
export class CreateNewRefsetComponent implements OnInit {
    dummydata = ['Your Usual Project', 'test2', 'test3'];
    selectedValue = this.dummydata[0];
    visible = true;
    selectable = true;
    removable = true;
    addOnBlur = true;
    selectedRadioButton = false;
    readonly separatorKeysCodes: number[] = [ENTER, COMMA];
    isSelected = 0;
    selectedMetaDataConcept = '';
    selectedBranchVersion = '';
    createdMetaDataConcept = '';
    selectedParentConcept = undefined;
    selectedNarrative = '';
    selectedTags = [];
    selectedDefinitionClauses = '';
    selectedVersionNotes = '';
    referenceTypes = ['EXTENSIONAL', 'INTENSIONAL', 'EXTERNAL'];
    selectedReferenceType = '';
    selectedIsPrivate = false;
    showLoadingSpinner = false;
    @Input()
    selectedProject: any;
    @Input()
    existingMetadataConcepts: any;
    @Input()
    existingBranchVersions: any;
    @Input()
    isDetailsPage = false;
    @Input()
    editMode = false;
    @Input()
    disabled = false;
    @Input()
    id: string;
    @Input()
    editModeProperties: {
        projectName: string;
        organizationName: string;
        editionName: string;
        versionNotes: string;
        metadataConcept: string;
        parentConcept: string;
        narrative: string;
        tags: string[];
        referenceType: string;
        privateRefset: boolean;
        versionDate: any;
        definitionClauses: string;
    };
    organizationName: string;
    editionName: string;
    projectName: string;
    narrative: string;
    versionNotes: string;
    referenceType: string;
    privateRefset: boolean;
    versionDate: string;
    refsetConcept: string;
    tags: string[];

    constructor(
        private modalService: NgbModal,
        private detectChanges: ChangeDetectorRef,
        private router: Router,
        private refsetService: RefsetService,
        private readonly workflowService: WorkflowService,
        private readonly refsetDetails: RefsetDetails
    ) {}

    ngOnInit(): void {}

    openCreateRefsetModal(createNewRefsetDialog: NgbModal) {
        if (this.editMode) {
            this.setupEditMode();
        }
        if (this.selectedProject || this.isDetailsPage) {
            this.modalService.open(createNewRefsetDialog, {
                windowClass: 'createNewRefsetDialog',
                backdrop: 'static',
                keyboard: false,
            });
        }
    }

    resetModal(): void {
        this.isSelected = 0;
        this.selectedMetaDataConcept = '';
        this.selectedBranchVersion = '';
        this.createdMetaDataConcept = '';
        this.selectedParentConcept = undefined;
        this.selectedNarrative = '';
        this.selectedVersionNotes = '';
        this.selectedTags = [];
        this.selectedDefinitionClauses = '';
        this.selectedReferenceType = '';
        this.selectedIsPrivate = false;
    }

    setupEditMode(): void {
        this.organizationName = this.editModeProperties.organizationName;
        this.editionName = this.editModeProperties.editionName;
        this.projectName = this.editModeProperties.projectName;
        this.selectedMetaDataConcept = this.editModeProperties.metadataConcept;
        this.versionDate = this.editModeProperties.versionDate;
        this.createdMetaDataConcept = this.editModeProperties.metadataConcept;
        this.selectedParentConcept = this.editModeProperties.parentConcept;
        this.narrative = this.editModeProperties.narrative;
        this.tags = this.editModeProperties.tags;
        this.referenceType =
            this.editModeProperties.referenceType.substr(0, 1) +
            this.editModeProperties.referenceType.substr(1).toLowerCase();
        this.privateRefset = this.editModeProperties.privateRefset;
        this.refsetConcept = this.editModeProperties.metadataConcept;
        this.versionNotes = this.editModeProperties.versionNotes;
        this.selectedDefinitionClauses =
            this.editModeProperties.definitionClauses;
    }

    createRefsetObject(): void {
        this.showLoadingSpinner = true;

        let params: any = {
            name: this.selectedMetaDataConcept
                ? this.selectedMetaDataConcept
                : this.createdMetaDataConcept
                ? this.createdMetaDataConcept
                : '',
            parentConceptId: this.selectedParentConcept
                ? this.selectedParentConcept
                : undefined,
            moduleId: '',
            editionId: this.selectedProject?.organization?.edition?.id,
            projectId: this.selectedProject?.id,
            narrative: this.selectedNarrative,
            type: this.selectedReferenceType,
            privateRefset: this.selectedIsPrivate,
            tags: this.selectedTags,
            versionDate: this.selectedBranchVersion,
            versionNotes: this.selectedVersionNotes,
        };

        if (this.selectedDefinitionClauses != '') {
            params.definitionClauses = this.generateDefinitionClausesJson(
                this.selectedDefinitionClauses
            );
        }

        this.refsetService.createRefset(params).subscribe(
            (refsetId) => {
                this.showLoadingSpinner = false;
                this.router.navigate([
                    '/edit/refset',
                    refsetId.refsetInternalId,
                ]);
            },
            (error) => {
                this.showLoadingSpinner = false;
            }
        );
    }

    generateDefinitionClausesJson(definitionClauses: string) {
        return [{ value: definitionClauses, negated: false }];
    }

    parseDefinitionClausesJson(definitionClauses: any) {
        return definitionClauses[0].value;
    }

    editRefsetObject(): void {
        this.showLoadingSpinner = true;
        let tagsToPersist: string[];
        if (this.tags) {
            tagsToPersist = this.tags;
        } else {
            tagsToPersist = this.selectedTags;
        }

        let params: any = {
            narrative: this.narrative,
            tags: tagsToPersist,
            definitionClauses: this.generateDefinitionClausesJson(
                this.selectedDefinitionClauses
            ),
            versionNotes: this.versionNotes,
            privateRefset: this.privateRefset,
            type: this.referenceType,
        };

        if (this.selectedDefinitionClauses != '') {
            params.definitionClauses = this.generateDefinitionClausesJson(
                this.selectedDefinitionClauses
            );
        }

        this.refsetService.updateRefsetMetadata(this.id, params).subscribe(
            (refsetId) => {
                this.showLoadingSpinner = false;
                this.router.navigate([
                    '/edit/refset',
                    refsetId.refsetInternalId,
                ]);
                this.refsetDetails.ngOnInit();
            },
            (error) => {
                this.showLoadingSpinner = false;
            }
        );
    }

    isComplete(): boolean {
        return (
            this.selectedProject.name &&
            this.selectedProject.organization.edition.id &&
            this.selectedProject.id &&
            this.selectedBranchVersion &&
            this.selectedReferenceType &&
            ((this.createdMetaDataConcept && this.selectedParentConcept) ||
                this.selectedMetaDataConcept)
        );
    }

    checkRadioButtonValue(event: any): void {
        this.isSelected = event.value;
        if (event.value === '1') {
            this.createdMetaDataConcept = '';
            this.selectedParentConcept = '';
        } else if (event.value === '2') {
            this.selectedMetaDataConcept = '';
        }
        this.detectChanges.detectChanges();
    }

    add(event: MatChipInputEvent): void {
        const input = event.input;
        const value = event.value;

        if (this.editMode) {
            // Handling update refset metadata

            // Add our tag
            if ((value || '').trim()) {
                this.tags.push(value);
            }

            // Reset the input value
            if (input) {
                input.value = '';
            }
        } else {
            // Handling new refset creation

            // Add our tag
            if ((value || '').trim()) {
                this.selectedTags.push(value);
            }

            // Reset the input value
            if (input) {
                input.value = '';
            }
        }
    }

    remove(data: string): void {
        if (this.editMode) {
            // Handling update refset metadata
            const index = this.tags.indexOf(data);

            if (index >= 0) {
                this.tags.splice(index, 1);
            }
        } else {
            // Handling new refset creation
            const index = this.selectedTags.indexOf(data);

            if (index >= 0) {
                this.selectedTags.splice(index, 1);
            }
        }
    }

    openEclBuilder(fieldId) {
        UiUtility.openEclBuilder(
            fieldId,
            this.selectedProject.organization.edition.branch +
                '/' +
                this.selectedBranchVersion
        );
    }
}
