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
import { RefsetUtility } from 'src/app/utilities/refset.utility';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
    selector: 'create-new-refset',
    templateUrl: './create-new-refset.component.html',
})
export class CreateNewRefsetComponent implements OnInit {

    visible = true;
    selectable = true;
    removable = true;
    addOnBlur = true;
    selectedRadioButton = false;
    readonly separatorKeysCodes: number[] = [ENTER, COMMA];
    isSelected = 0;
    selectedMetaDataConcept: any;
    createdMetaDataConcept = '';
    selectedParentConcept = undefined;
    selectedNarrative = '';
    selectedTags = [];
    definitionClauses = [];
    selectedVersionNotes = '';
    referenceTypes = [RefsetUtility.EXTENSIONAL, RefsetUtility.INTENSIONAL, RefsetUtility.EXTERNAL];
    selectedReferenceType = '';
    showLoadingSpinner = false;
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
    INTENSIONAL = RefsetUtility.INTENSIONAL;
    existingMetadataConcepts: any;
    parentConcepts: any;

    @Input() existingBranchVersions: any;
    @Input() isDetailsPage = false;
    @Input() editMode = false;
    @Input() disabled = false;
    @Input() refsetId: string;
    @Input() inputProperties: {
        project?: any;
        versionNotes?: string;
        metadataConcept?: string;
        parentConcept?: string;
        narrative?: string;
        tags?: string[];
        referenceType?: string;
        privateRefset?: boolean;
        versionDate?: any;
        definitionClauses?: [];
    };

    constructor(
        private modalService: NgbModal,
        private detectChanges: ChangeDetectorRef,
        private router: Router,
        private refsetService: RefsetService,
        private readonly workflowService: WorkflowService,
        private readonly refsetDetails: RefsetDetails,
        private readonly notificationService: NotificationService
    ) {}

    ngOnInit(): void {}

    openCreateRefsetModal(createNewRefsetDialog: NgbModal) {

        this.resetModal();

        if (this.editMode) {
            this.setupEditMode();
        }

        if (CodeUtility.hasValue(this.inputProperties.project)) {

            this.refsetService.getRefsetConcepts(`branch=${this.inputProperties.project.organization.edition.branch.toString()}&areParentConcepts=false`).subscribe(results => {
                this.existingMetadataConcepts = results.items ? results.items : undefined;
            });

            this.refsetService.getRefsetConcepts(`branch=${this.inputProperties.project.organization.edition.branch.toString()}&areParentConcepts=true`).subscribe(results => {
                this.parentConcepts = results.items ? results.items : undefined;
            });

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
        this.createdMetaDataConcept = '';
        this.selectedParentConcept = undefined;
        this.selectedNarrative = '';
        this.selectedVersionNotes = '';
        this.selectedTags = [];
        this.definitionClauses = [{value: '', negated: false}];
        this.selectedReferenceType = '';
        this.privateRefset = false;
    }

    setupEditMode(): void {

        let inputs = JSON.parse(JSON.stringify(this.inputProperties));

        this.organizationName = inputs.project.organization.name;
        this.editionName = inputs.project.organization.edition.name;
        this.projectName = inputs.project.organization.name;
        this.selectedMetaDataConcept = inputs.metadataConcept;
        this.versionDate = inputs.versionDate;
        this.createdMetaDataConcept = inputs.metadataConcept;
        this.selectedParentConcept = inputs.parentConcept;
        this.narrative = inputs.narrative;
        this.tags = inputs.tags;
        this.referenceType =
            inputs.referenceType.substr(0, 1) +
            inputs.referenceType.substr(1).toLowerCase();
        this.privateRefset = inputs.privateRefset;
        this.refsetConcept = inputs.metadataConcept;
        this.versionNotes = inputs.versionNotes;
        this.selectedReferenceType = inputs.referenceType;
        this.definitionClauses = inputs.definitionClauses;
        //this.detectChanges.detectChanges();
    }

    createRefsetObject(): void {

        this.showLoadingSpinner = true;
        let name = '';
        let refsetId = null;
        let parentConceptId = null;

        if (this.selectedParentConcept) {
            parentConceptId = this.selectedParentConcept;
        }

        if (this.selectedMetaDataConcept) {

            name = this.existingMetadataConcepts[this.selectedMetaDataConcept].name;
            refsetId = this.existingMetadataConcepts[this.selectedMetaDataConcept].code;
        } else {
            name = this.createdMetaDataConcept;
        }

        let params: any = {
            name: name,
            parentConceptId: parentConceptId,
            moduleId: '',
            refsetId: refsetId,
            editionId: this.inputProperties.project.organization.edition.id,
            projectId: this.inputProperties.project.id,
            narrative: this.selectedNarrative,
            type: this.selectedReferenceType,
            privateRefset: this.privateRefset,
            tags: this.selectedTags,
            versionNotes: this.selectedVersionNotes,
        };

        if (this.selectedReferenceType == this.INTENSIONAL && this.definitionClauses.length > 0) {
            params.definitionClauses = this.definitionClauses;
        }

        this.refsetService.createRefset(params).subscribe(
            (status) => {

                this.showLoadingSpinner = false;

                if (status.error) {

                    this.notificationService.show('There was a problem with the request, please try again! Error: ' + status.error, null, 'error', {timeOut: 0, extendedTimeOut: 0});
                    return;
                }

                this.modalService.dismissAll();
                this.router.navigate(['/details', status.refsetInternalId,]);
            },
            (error) => {
                this.showLoadingSpinner = false;
            }
        );
    }

    generateDefinitionClausesJson(definitionClauses: []) {

        for (let definitionClause of definitionClauses)
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
            versionNotes: this.versionNotes,
            privateRefset: this.privateRefset,
            type: this.referenceType,
        };

        if (this.selectedReferenceType == this.INTENSIONAL && this.definitionClauses.length > 0) {
            params.definitionClauses = this.definitionClauses;
        }

        this.refsetService.updateRefsetMetadata(this.refsetId, params).subscribe( (status) => {

                this.showLoadingSpinner = false;

                if (status.error) {

                    this.notificationService.show('There was a problem with the request, please try again! Error: ' + status.error, null, 'error', {timeOut: 0, extendedTimeOut: 0});
                    return;
                }

                this.modalService.dismissAll();
                this.router.navigate(['/details', status.refsetInternalId,]);
                this.refsetDetails.initializeDetailsPage();
            },
            (error) => {
                this.showLoadingSpinner = false;
            }
        );
    }

    isComplete(): boolean {

        let typeCheck = false;
        
        if (this.selectedReferenceType == RefsetUtility.EXTENSIONAL) {
            typeCheck = true;
            console.log("EXTENSIONAL typeCheck: " + typeCheck);
        } else if (this.selectedReferenceType == RefsetUtility.INTENSIONAL && this.definitionClauses.length > 0 && CodeUtility.hasValue(this.definitionClauses[0].value)) {
            typeCheck = true;
            console.log("EXTENSIONAL INTENSIONAL: " + typeCheck);
            console.log("this.definitionClauses: ", this.definitionClauses);
        }


        return (typeCheck && ((this.createdMetaDataConcept && this.selectedParentConcept) || this.selectedMetaDataConcept));
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

        // Handling update refset metadata
        if (this.editMode) {

            // Add our tag
            if ((value || '').trim()) {
                this.tags.push(value);
            }

            // Reset the input value
            if (input) {
                input.value = '';
            }
        } 

        // Handling new refset creation
        else {

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

        // Handling update refset metadata
        if (this.editMode) {
            
            const index = this.tags.indexOf(data);

            if (index >= 0) {
                this.tags.splice(index, 1);
            }
        } 
        
        // Handling new refset creation
        else {
            
            const index = this.selectedTags.indexOf(data);

            if (index >= 0) {
                this.selectedTags.splice(index, 1);
            }
        }
    }

    openEclBuilder(fieldId) {

        UiUtility.openEclBuilder(fieldId, this.inputProperties.project.organization.edition.branch);
    }
}
