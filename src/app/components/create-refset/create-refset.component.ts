import { ChangeDetectorRef, Component, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { Router } from '@angular/router';
import { RefsetDetails } from 'src/app/pages/refset-details';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { RefsetUtility } from 'src/app/utilities/refset.utility';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { NotificationService } from 'src/app/services/notification.service';
import { ProjectsRefsetComponent } from 'src/app/pages/projects/refsets/projects-refset.component';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { DialogFactoryService } from 'src/app/dialog/services/dialog-factory.service';
import { DialogService } from 'src/app/dialog/services/dialog.service';
import { Debounce } from 'src/app/decorators/debounce.decorator';

@Component({
    selector: 'create-refset',
    templateUrl: './create-refset.component.html',
})
export class CreateRefsetComponent implements OnInit {

    visible = true;
    selectable = true;
    removable = true;
    addOnBlur = true;
    selectedRadioButton = false;
    readonly separatorKeysCodes: number[] = [ENTER, COMMA];
    isSelected = 1;
    step = 1;
    selectedMetaDataConcept: any;
    selectedCopyRefset: any;
    selectedCopyRefsetName: string;
    selectedCombinationRefsets: any;
    selectedExternalName = '';
    selectedExternalUrl = '';
    createdMetaDataConcept = '';
    copyRefsetVersionOptions: any[];
    copySearchInput: string;
    refsetOptions: any[];
    refsetOptionsLoading = false;
    selectedParentConcept = undefined;
    selectedNarrative = '';
    selectedModuleId = '';
    selectedTags = [];
    definitionClauses = [];
    type = '';
    selectedVersionNotes = '';
    data = [];
    originalRefsetMembers = [];
    selectedUUID: string;
    referenceTypes = [RefsetUtility.EXTENSIONAL, RefsetUtility.INTENSIONAL, RefsetUtility.COMBINATION, RefsetUtility.EXTERNAL, RefsetUtility.COPY];
    selectedReferenceType = 'EXTENSIONAL';
    showLoadingSpinner = false;
    organizationName: string;
    editionName: string;
    projectName: string;
    narrative: string;
    versionNotes: string;
    referenceType: string;
    privateRefset: boolean;
    localSet: boolean;
    comboRefset: boolean = false;
    versionDate: string;
    refsetConcept: string;
    tags: string[];
    existingMetadataConcepts = [];
    comboConceptOptions: any;
    parentConcepts: any;
    conceptError = '';
    dialog: DialogService;

    @Input() existingBranchVersions: any;
    @Input() isDetailsPage = false;
    @Input() editMode = false;
    @Input() disabled = false;
    @Input() refsetInternalId: string;
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
    @ViewChild('infoDialog') infoDialog: TemplateRef<any>;
    @ViewChild('extensionalInfoDialog') extensionalInfoDialog: TemplateRef<any>;
    @ViewChild('intensionalInfoDialog') intensionalInfoDialog: TemplateRef<any>;
    @ViewChild('copyInfoDialog') copyInfoDialog: TemplateRef<any>;
    @ViewChild('combinationInfoDialog') combinationInfoDialog: TemplateRef<any>;
    @ViewChild('localsetInfoDialog') localsetInfoDialog: TemplateRef<any>;
    @ViewChild('externalInfoDialog') externalInfoDialog: TemplateRef<any>;
    @ViewChild('existingConceptDialog') existingConceptDialog: TemplateRef<any>;
    @ViewChild('newConceptDialog') newConceptDialog: TemplateRef<any>;
    @ViewChild('externalDialog') externalDialog: TemplateRef<any>;
    @ViewChild('availabilityDialog') availabilityDialog: TemplateRef<any>;
    @ViewChild('publicationDialog') publicationDialog: TemplateRef<any>;


    constructor(
        private modalService: NgbModal,
        private detectChanges: ChangeDetectorRef,
        private router: Router,
        private refsetService: RefsetService,
        private readonly refsetDetails: RefsetDetails,
        private dialogFactoryService: DialogFactoryService,
        private readonly notificationService: NotificationService,
        private readonly projectsRefsetComponent: ProjectsRefsetComponent,
        private readonly authenticationService: AuthenticationService
    ) {
    }

    get canAdd(): boolean {
        const project = this.inputProperties.project;
        return project?.roles?.includes('AUTHOR');
    }

    get showCombination(): boolean {
        return this.selectedReferenceType && this.selectedReferenceType === RefsetUtility.COMBINATION;
    }

    get showCopy(): boolean {
        return this.selectedReferenceType && this.selectedReferenceType === RefsetUtility.COPY;
    }

    get showECL(): boolean {
        return this.selectedReferenceType && this.selectedReferenceType === RefsetUtility.INTENSIONAL;
    }

    get showExternal(): boolean {
        return this.selectedReferenceType && this.selectedReferenceType === RefsetUtility.EXTERNAL;
    }

    get externalUrlValid(): boolean {
        const httpRegex = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{2,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;
        return this.selectedReferenceType === RefsetUtility.EXTERNAL && this.selectedExternalUrl && httpRegex.test(this.selectedExternalUrl);
    }

    get nextDisabled(): boolean {

        return this.step === 1 && !this.selectedReferenceType
            || (this.step === 2 && this.selectedReferenceType === RefsetUtility.EXTERNAL && (this.selectedExternalName?.length === 0 || !this.externalUrlValid))
            || (this.step === 2 && this.selectedReferenceType === RefsetUtility.INTENSIONAL && (this.definitionClauses?.length === 0 || this.definitionClauses[0]?.value === ''))
            || (this.step === 2 && this.selectedReferenceType === RefsetUtility.COPY && !this.selectedCopyRefset)
            || (this.step === 2 && this.selectedReferenceType === RefsetUtility.COMBINATION && (this.selectedCombinationRefsets?.length === 0));
    }

    ngOnInit(): void {
    }

    openCreateRefsetModal(createNewRefsetDialog: NgbModal) {

        this.resetModal();

        this.selectedModuleId = this.inputProperties.project.edition.modules[0];

        if (this.editMode) {
            this.setupEditMode();
        }

        if (CodeUtility.hasValue(this.inputProperties.project)) {

            this.refsetService.getRefsetConcepts(`branch=${this.inputProperties.project.edition.branch.toString()}&areParentConcepts=false`).subscribe(results => {
                this.existingMetadataConcepts = results.items ? results.items : undefined;
            });

            this.refsetService.getRefsetConcepts(`branch=${this.inputProperties.project.edition.branch.toString()}&areParentConcepts=true`).subscribe(results => {
                this.parentConcepts = results.items ? results.items : undefined;
                this.parentConcepts = this.sortParents(this.parentConcepts);
            });

            const restParams: any = {
                limit: -1,
                offset: 0,
                searchConcepts: true,
                showInDevelopment: true,
                //query: `projectId:${this.inputProperties.project.id} AND versionStatus:PUBLISHED`
                query: `editionShortName:${this.inputProperties.project.edition.shortName} AND versionStatus:PUBLISHED`
                //sortModel: rowParams.sortModel, //not needed once we get rid of mocking the backend
                //filterModel: rowParams.filterModel, //not needed once we get rid of mocking the backend
            };

            this.refsetService.getRefsets({ ...restParams }).subscribe({
                next: (results) => {

                    for (const refset of results.items) {
                        this.data.push({
                            name: `${refset?.organizationName}/${refset?.project?.name}/${refset.name}`
                            , refsetId: refset.refsetId
                            , private: refset.privateRefset
                            , workflowStatus: `${refset?.workflowStatus}`
                            , modified: `${refset?.modified}`, versionStatus: `${refset.versionStatus}`
                            , versionDate: `${refset.versionDate}`
                        });

                    }
                    this.data = this.sortRefsets(this.data);
                },
                error: (error) => {


                }
            });

            this.modalService.open(createNewRefsetDialog, {
                windowClass: 'createNewRefsetDialog',
                backdrop: 'static',
                keyboard: false
            });
        }
    }

    sortRefsets(refsets) {
        return refsets.sort((refset1, refset2) => {
            const name1 = refset1.name;
            const name2 = refset2.name;

            const compareValue = name1.localeCompare(name2);
            return compareValue;
        });
    }

    sortParents(concepts) {
        return concepts.sort((concept1, concept2) => {
            const name1 = concept1.name;
            const name2 = concept2.name;

            if (name1.toLowerCase() === 'simple type reference set') {
                this.selectedParentConcept = concept1.code;
                return -1;
            } else if (name2.toLowerCase() === 'simple type reference set') {
                this.selectedParentConcept = concept2.code;
                return 1;
            }
            const compareValue = name1.localeCompare(name2);
            return compareValue;
        });
    }

    resetModal(): void {

        this.isSelected = 1;
        this.selectedMetaDataConcept = '';
        this.createdMetaDataConcept = '';
        this.selectedParentConcept = undefined;
        this.selectedCombinationRefsets = '';
        this.selectedExternalName = '';
        this.selectedExternalUrl = '';
        this.selectedNarrative = '';
        this.selectedVersionNotes = '';
        this.selectedTags = [];
        this.data = [];
        this.definitionClauses = [{ value: '', negated: false }];
        this.selectedReferenceType = 'EXTENSIONAL';
        this.privateRefset = false;
        this.comboRefset = false;
        this.localSet = false;
        this.conceptError = '';
        this.step = 1;
        this.copyRefsetVersionOptions = [];
        this.copySearchInput = '';
        this.refsetOptions = [];
        this.refsetOptionsLoading = false;
        this.selectedCopyRefset = '';

    }

    setupEditMode(): void {

        let inputs = JSON.parse(JSON.stringify(this.inputProperties));

        this.organizationName = inputs.project.edition.organization.name;
        this.editionName = inputs.project.edition.name;
        this.projectName = inputs.project.edition.organization.name;
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
        this.localSet = inputs.localSet;
        this.refsetConcept = inputs.metadataConcept;
        this.versionNotes = inputs.versionNotes;
        this.selectedReferenceType = inputs.referenceType;
        this.definitionClauses = inputs.definitionClauses;
        //this.detectChanges.detectChanges();
    }

    createRefsetObject(): void {
        this.showLoadingSpinner = true;

        if (this.selectedReferenceType === RefsetUtility.COPY) {

            let existingCpt = this.existingMetadataConcepts[this.selectedMetaDataConcept]?.code;
            this.refsetService.getRefsetCopy(this.selectedUUID, this.createdMetaDataConcept, this.inputProperties.project.id, this.localSet, this.privateRefset, this.comboRefset, this.selectedNarrative, this.selectedTags,
                this.selectedParentConcept, existingCpt ? existingCpt : '').subscribe(results => {

                    this.showLoadingSpinner = false;
                    this.modalService.dismissAll();
                    this.router.navigate(['/details', results.refsetId, RefsetUtility.IN_DEVELOPMENT]);
                    return;
                },
                    (error) => {
                        this.showLoadingSpinner = false;
                    });
        } else {

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
                name: this.capitalizeFirstLetterOfString(name),
                parentConceptId: parentConceptId,
                moduleId: this.selectedModuleId,
                refsetId: refsetId,
                editionId: this.inputProperties.project.edition.id,
                projectId: this.inputProperties.project.id,
                narrative: this.selectedNarrative,
                type: this.type,
                privateRefset: this.privateRefset,
                comboRefset: this.comboRefset,
                localSet: this.localSet,
                tags: this.selectedTags,
                versionNotes: this.selectedVersionNotes,
            };

            if (this.type === RefsetUtility.INTENSIONAL && this.definitionClauses.length > 0) {
                params.definitionClauses = this.definitionClauses;
            }
            if (this.selectedReferenceType === RefsetUtility.EXTERNAL) {
                params.externalUrl = this.selectedExternalUrl;
                params.name = this.capitalizeFirstLetterOfString(this.selectedExternalName);
            }
            if (this.selectedReferenceType === RefsetUtility.COMBINATION) {
                params.comboRefset = true;
            }
            this.refsetService.createRefset(params).subscribe(
                (status) => {

                    this.showLoadingSpinner = false;

                    if (status.error) {

                        this.notificationService.show('There was a problem with the request, please try again! Error: ' + status.error, null, 'error', {
                            timeOut: 0,
                            extendedTimeOut: 0
                        });
                        return;
                    }

                    this.modalService.dismissAll();
                    this.router.navigate(['/details', status.refsetId, RefsetUtility.IN_DEVELOPMENT]);

                },
                (error) => {
                    this.modalService.dismissAll();
                    this.showLoadingSpinner = false;
                }
            );
        }
        ;
    }

    capitalizeFirstLetterOfString(stringValue: string): string {
        if (stringValue) {
            return stringValue.toLowerCase().replace(/(?:^|\s|[-"'([{])+\S/g, (c) =>
                c.toUpperCase()
            );
        }

        return stringValue;
    }

    generateDefinitionClausesJson(definitionClauses: []) {

        for (let definitionClause of definitionClauses) {
            return [{ value: definitionClauses, negated: false }];
        }
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

        if (this.selectedReferenceType === RefsetUtility.INTENSIONAL && this.definitionClauses.length > 0) {
            params.definitionClauses = this.definitionClauses;
        }

        this.refsetService.updateRefsetMetadata(this.refsetInternalId, params).subscribe((status) => {

            this.showLoadingSpinner = false;

            if (status.error) {

                this.notificationService.show('There was a problem with the request, please try again! Error: ' + status.error, null, 'error', {
                    timeOut: 0,
                    extendedTimeOut: 0
                });
                return;
            }

            this.modalService.dismissAll();
            this.router.navigate(['/details', this.refsetId, RefsetUtility.IN_DEVELOPMENT]);
            this.refsetDetails.initializeDetailsPage();
        },
            (error) => {
                this.showLoadingSpinner = false;
            }
        );
    }

    isComplete(): boolean {
        let typeCheck = false;

        if (this.selectedReferenceType === RefsetUtility.EXTERNAL && this.selectedExternalUrl?.length > 0 && this.selectedExternalName?.length > 0) {
            return true;
        } else if (this.selectedReferenceType === RefsetUtility.EXTENSIONAL) {
            typeCheck = true;
        } else if (this.selectedReferenceType === RefsetUtility.INTENSIONAL && this.definitionClauses.length > 0 && CodeUtility.hasValue(this.definitionClauses[0].value)) {
            typeCheck = true;
        } else if (this.selectedReferenceType === RefsetUtility.COMBINATION && this.selectedCombinationRefsets?.length > 0) {
            typeCheck = true;
        } else if (this.selectedReferenceType === RefsetUtility.COPY) {
            typeCheck = true;
        }

        return ((typeCheck && ((this.createdMetaDataConcept && this.selectedParentConcept) || this.selectedMetaDataConcept) && this.isValidConceptName()) && this.selectedModuleId.length > 0)
    }

    isValidConceptName(): boolean {
        var format = /^(?!.* {2,})[!-9A-z\\()À-ú\s]+$/;
        var lower = null;
        if (this.createdMetaDataConcept) {
            lower = this.createdMetaDataConcept.toLowerCase();
        } else {
            lower = this.existingMetadataConcepts[this.selectedMetaDataConcept].name;
        }

        var flag = lower.match(format);
        if (flag == null) {
            this.conceptError = 'The reference set concept name must comply with SNOMED International Requirements. Only alpha-numeric text is permitted.';
        } else {
            this.conceptError = '';
        }
        return flag == null ? false : true;
    }

    isUat(): boolean {
        return this.projectsRefsetComponent?.projectIsUat;
    }

    checkRadioButtonValue(event: any): void {

        this.isSelected = event.value;
        this.detectChanges.detectChanges();
    }

    // Handle the radio buttons for "within edition" and "local set"
    checkPublishability(event: any): void {

        if (event.value == 'true') {
            this.localSet = true;
        } else {
            this.localSet = false;
        }
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
        UiUtility.openEclBuilder(fieldId, this.inputProperties.project.edition.branch);
    }

    // This event handler gets called when the ecl builder dispatches the output event.
    eclDefinitionChanged(event) {
        // Fix for ecl builder returning ", " as a clause separator instead of " AND "
        if (event != this.definitionClauses[0].value.replaceAll('|, ', '| AND ')) {
                this.definitionClauses[0].value = this.definitionClauses[0].value.replaceAll('|, ', '| AND ');
        }
    }

    async onSearchChange(value): Promise<void> {
        await this.search(value);
    }

    handleInput(event: KeyboardEvent): void {
        event.stopPropagation();
    }

    @Debounce()
    search(query: string): void {

      this.refsetOptionsLoading = true;
      this.refsetOptions = [];
      this.copyRefsetVersionOptions = [];

      this.refsetService.searchRefsetsForDropdowns(query).subscribe((results) => {
        this.refsetOptions = results.items.filter((item) => item.refsetId !== this.refsetId);

        for (const option of this.refsetOptions) {
          option.flagIcon = RefsetUtility.getEditionFlagIcon(option.edition?.branch);
        }

        this.refsetOptionsLoading = false;
      });
    }

    copyRefsetSelected(event) {
        const copyRefset = event.value;
        this.selectedCopyRefsetName = copyRefset.name;
        this.selectedCopyRefset = event.value;
    }

    showFlagIcon(event, show) {
        event.target.style.display = (show) ? 'inline' : 'none';
    }

    openInfoDialog(referenceType): void {
        const dialogId = 'infoDialog';

        const dialogData = {
            headerText: `Information`,
            template: this.infoDialog,
            data: null,
            showCancel: false,
            confirmText: 'OK',
        };

        if (referenceType === 'availability') {
            dialogData.template = this.availabilityDialog;
        } else if (referenceType === 'publication') {
            dialogData.template = this.publicationDialog;
        } else if (referenceType === 'external') {
            dialogData.template = this.externalDialog;
        } else if (this.step === 3 && referenceType === 'existingConcept') {
            dialogData.template = this.existingConceptDialog;
        } else if (this.step === 3 && referenceType === 'newConcept') {
            dialogData.template = this.newConceptDialog;
        } else if (this.step === 3) {
            dialogData.template = this.infoDialog;
        } else if (referenceType === RefsetUtility.EXTENSIONAL) {
            dialogData.template = this.extensionalInfoDialog;
        } else if (referenceType === RefsetUtility.INTENSIONAL) {
            dialogData.template = this.intensionalInfoDialog;
        } else if (referenceType === RefsetUtility.EXTERNAL) {
            dialogData.template = this.externalInfoDialog;
        } else if (referenceType === RefsetUtility.COPY) {
            dialogData.template = this.copyInfoDialog;
        } else if (referenceType === RefsetUtility.COMBINATION) {
            dialogData.template = this.combinationInfoDialog;
        }

        const dialogOptions = {
            id: dialogId,
        };

        this.dialog = this.dialogFactoryService.open(dialogData);

        this.dialog.confirmed().subscribe((data) => {
        });
    }


    goBack(): void {
        if (this.step > 1) {
            this.step -= 1;
            if (this.selectedReferenceType === RefsetUtility.EXTENSIONAL) {
                this.step -= 1;
            }
        }
    }

    goNext(): void {
        if (this.step < 3) {
            this.step += 1;
            if (this.selectedReferenceType === RefsetUtility.EXTENSIONAL) {
                this.type = RefsetUtility.EXTENSIONAL;
                this.step += 1;
            }
            if (this.selectedReferenceType === RefsetUtility.INTENSIONAL) {
                this.type = RefsetUtility.INTENSIONAL;
            }
            if (this.selectedReferenceType === RefsetUtility.EXTERNAL) {
                this.type = RefsetUtility.EXTERNAL;
            }
            if (this.selectedReferenceType === RefsetUtility.COPY && this.selectedCopyRefset) {
                this.getRefset();
            }
            if (this.selectedReferenceType === RefsetUtility.COMBINATION && this.selectedCombinationRefsets?.length > 0) {
                this.type = RefsetUtility.INTENSIONAL;
                this.comboRefset = true;
                var str1 = '';
                for (let comboRefset of this.selectedCombinationRefsets) {
                    str1 = str1.concat('^ ' + comboRefset.refsetId + ' OR ');
                }
                str1 = str1.substring(0, str1.lastIndexOf('OR'));
                this.definitionClauses[0].value = str1;
            }
        }
    }

    changeType($event: any): void {
        this.selectedReferenceType = $event.value;
    }

    getRefset(): void {
        this.createdMetaDataConcept = 'Copy of ' + this.selectedCopyRefset?.name.substring(this.selectedCopyRefset?.name.lastIndexOf('/') + 1);
        this.refsetService.getRefset(this.selectedCopyRefset.refsetId, RefsetUtility.getVersionDateForRefsetApiCall(this.selectedCopyRefset)).subscribe({
            next: (results) => {
                this.selectedNarrative = results?.narrative;
                this.selectedTags = results?.tags;
                this.privateRefset = results?.privateRefset;
                this.localSet = results?.localSet;
                this.comboRefset = results?.comboRefset;
                //this.selectedParentConcept = results?.parentConceptId;
                this.definitionClauses[0].value = results?.definitionClauses[0]?.value;
                this.type = results?.type;
                this.selectedUUID = results?.id;
            }
        });
    }

}
