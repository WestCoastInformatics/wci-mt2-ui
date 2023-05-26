import { ChangeDetectorRef, Component, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { Router } from '@angular/router';
import { RefsetDetails } from 'src/app/pages/refset-details';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { Constants } from 'src/app/utilities/constants.utility';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { NotificationService } from 'src/app/services/notification.service';
import { ProjectsRefsetComponent } from 'src/app/pages/projects/refsets/projects-refset.component';
import { DialogFactoryService } from 'src/app/dialog/services/dialog-factory.service';
import { DialogService } from 'src/app/dialog/services/dialog.service';

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
	referenceTypes = [Constants.EXTENSIONAL, Constants.INTENSIONAL, Constants.EXTERNAL];
	selectedReferenceType = '';
	showLoadingSpinner = false;
	organizationName: string;
	editionName: string;
	projectName: string;
	narrative: string;
	versionNotes: string;
	referenceType: string;
	privateRefset: boolean;
	localSet: boolean;
	publication: string;
	moduleId: string;
	versionDate: string;
	refsetConcept: string;
	tags: string[];
	INTENSIONAL = Constants.INTENSIONAL;
	existingMetadataConcepts: any;
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
		localSet?: boolean;
		moduleId?: string;
		versionDate?: any;
		definitionClauses?: [];
	};
	@ViewChild('infoDialog') infoDialog: TemplateRef<any>;

	constructor(
		private modalService: NgbModal,
		private detectChanges: ChangeDetectorRef,
		private router: Router,
		private refsetService: RefsetService,
		private readonly refsetDetails: RefsetDetails,
		private dialogFactoryService: DialogFactoryService,
		private readonly notificationService: NotificationService,
		private readonly projectsRefsetComponent: ProjectsRefsetComponent
	) {}

	get canAdd(): boolean {
		const project = this.inputProperties.project;
		return project?.roles?.includes('AUTHOR');
	}

	get canEditName(): boolean {
		return this.editMode && this.selectedReferenceType === Constants.EXTERNAL;
	}

	ngOnInit(): void {}

	openCreateRefsetModal(createNewRefsetDialog: NgbModal) {
		this.resetModal();

		if (this.editMode) {
			this.setupEditMode();
		}

		if (CodeUtility.hasValue(this.inputProperties.project)) {
			this.refsetService.getRefsetConcepts(`branch=${this.inputProperties.project.edition.branch.toString()}&areParentConcepts=false`).subscribe((results) => {
				this.existingMetadataConcepts = results.items ? results.items : undefined;
			});

			this.refsetService.getRefsetConcepts(`branch=${this.inputProperties.project.edition.branch.toString()}&areParentConcepts=true`).subscribe((results) => {
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
		this.definitionClauses = [{ value: '', negated: false }];
		this.selectedReferenceType = '';
		this.privateRefset = false;
		this.localSet = false;
		this.moduleId = null;
		this.publication = 'Within Edition';
		this.conceptError = '';
	}

	setupEditMode(): void {
		const inputs = JSON.parse(JSON.stringify(this.inputProperties));

		this.organizationName = inputs.project.edition.organization.name;
		this.editionName = inputs.project.edition.name;
		this.projectName = inputs.project.edition.organization.name;
		this.selectedMetaDataConcept = inputs.metadataConcept;
		this.versionDate = inputs.versionDate;
		this.createdMetaDataConcept = inputs.metadataConcept;
		this.selectedParentConcept = inputs.parentConcept;
		this.narrative = inputs.narrative;
		this.tags = inputs.tags;
		this.referenceType = inputs.referenceType.substr(0, 1) + inputs.referenceType.substr(1).toLowerCase();
		this.privateRefset = inputs.privateRefset;
		this.localSet = inputs.localSet;
		this.moduleId = inputs.moduleId;
		this.publication = this.localSet ? 'Local Set' : 'Within Edition';

		this.refsetConcept = inputs.metadataConcept;
		this.versionNotes = inputs.versionNotes;
		this.selectedReferenceType = inputs.referenceType;
		this.definitionClauses = inputs.definitionClauses;
		// this.detectChanges.detectChanges();
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

		const params: any = {
			name: this.capitalizeFirstLetterOfString(name),
			parentConceptId: parentConceptId,
			refsetId: refsetId,
			editionId: this.inputProperties.project.edition.id,
			projectId: this.inputProperties.project.id,
			narrative: this.selectedNarrative,
			type: this.selectedReferenceType,
			privateRefset: this.privateRefset,
			localSet: this.localSet,
			moduleId: this.moduleId,
			tags: this.selectedTags,
			versionNotes: this.selectedVersionNotes,
		};

		if (this.selectedReferenceType === this.INTENSIONAL && this.definitionClauses.length > 0) {
			//this.definitionClauses[0].value = this.definitionClauses[0].value.replaceAll('|, ', '| AND ');
			params.definitionClauses = this.definitionClauses;
		}
		this.refsetService.createRefset(params).subscribe(
			(status) => {
				this.showLoadingSpinner = false;

				if (status.error) {
					this.notificationService.show('There was a problem with the request, please try again! Error: ' + status.error, null, 'error', {
						timeOut: 0,
						extendedTimeOut: 0,
					});
					return;
				}

				this.modalService.dismissAll();
				this.router.navigate(['/details', status.refsetId, Constants.IN_DEVELOPMENT]);
			},
			(error) => {
				this.showLoadingSpinner = false;
			}
		);
	}

	capitalizeFirstLetterOfString(stringValue: string): string {
		if (stringValue) {
			return stringValue.toLowerCase().replace(/(?:^|\s|[-"'([{])+\S/g, (c) => c.toUpperCase());
		}

		return stringValue;
	}

	generateDefinitionClausesJson(definitionClauses: []) {
		for (const definitionClause of definitionClauses) {
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

		const params: any = {
			narrative: this.narrative,
			tags: tagsToPersist,
			versionNotes: this.versionNotes,
			privateRefset: this.privateRefset,
			localSet: this.localSet,
			moduleId: this.moduleId,
			type: this.referenceType,
		};
		if (this.selectedReferenceType === Constants.EXTERNAL) {
			params.name = this.refsetConcept;
		}

		if (this.selectedReferenceType === this.INTENSIONAL && this.definitionClauses.length > 0) {
			// NO longer needed
			// this.definitionClauses[0].value = this.definitionClauses[0].value.replaceAll('|, ', '| AND ');
			params.definitionClauses = this.definitionClauses;
		}

		this.refsetService.updateRefsetMetadata(this.refsetInternalId, params).subscribe({
			next: (status) => {
				this.showLoadingSpinner = false;

				if (status.error) {
					this.notificationService.show('There was a problem with the request, please try again! Error: ' + status.error, null, 'error', {
						timeOut: 0,
						extendedTimeOut: 0,
					});
					return;
				}

				this.modalService.dismissAll();
				this.router.navigate(['/details', this.refsetId, Constants.IN_DEVELOPMENT]);
				this.refsetDetails.initializeDetailsPage();
			},
			error: (error) => {
				this.showLoadingSpinner = false;
			},
		});
	}

	isComplete(): boolean {
		let typeCheck = false;

		if (this.selectedReferenceType === Constants.EXTENSIONAL) {
			typeCheck = true;
		} else if (this.selectedReferenceType === Constants.INTENSIONAL && this.definitionClauses.length > 0 && CodeUtility.hasValue(this.definitionClauses[0].value)) {
			typeCheck = true;
		}

		return typeCheck && ((this.createdMetaDataConcept && this.selectedParentConcept) || this.selectedMetaDataConcept) && this.isValidConceptName();
	}

	isValidConceptName(): boolean {
		/* eslint-disable no-useless-escape */
		const format = /^(?!.* {2,})[\/-9A-Za-z\\()À-ú\s]+$/;
		let lower = null;
		if (this.createdMetaDataConcept) {
			lower = this.createdMetaDataConcept.toLowerCase();
		} else {
			lower = this.existingMetadataConcepts[this.selectedMetaDataConcept].name;
		}

		const flag = lower.match(format);
		if (flag == null) {
			this.conceptError = 'The Reference Set concept name must comply with SNOMED International Requirements. Only alpha-numeric text is permitted.';
		} else {
			this.conceptError = '';
		}
		return flag != null;
	}

	isUat(): boolean {
		return this.projectsRefsetComponent?.projectIsUat;
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
		} else {
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
		} else {
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

	openInfoDialog() {
		const dialogId = 'infoDialog';

		const dialogData = {
			headerText: `Information`,
			template: this.infoDialog,
			data: null,
			showCancel: false,
			confirmText: 'OK',
		};

		const dialogOptions = {
			id: dialogId,
		};

		this.dialog = this.dialogFactoryService.open(dialogData);

		this.dialog.confirmed().subscribe((data) => {});
	}

	// Handle the radio buttons for "within edition" and "local set"
	checkPublishability(event: any): void {
		if (event.value == 'true') {
			this.localSet = true;
		} else {
			this.localSet = false;
		}
		this.publication = this.localSet ? 'Local Set' : 'Within Edition';
	}

	setModuleIdOrder(moduleA, moduleB) {
		return 1;
	}
}
