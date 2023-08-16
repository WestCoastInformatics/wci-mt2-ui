import { ChangeDetectorRef, Component, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { Router } from '@angular/router';
import { RefsetDetailsComponent } from 'src/app/pages/refset-details';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { RefsetUtility } from 'src/app/utilities/refset.utility';
import { Constants } from 'src/app/utilities/constants.utility';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { NotificationService } from 'src/app/services/notification.service';
import { ProjectsRefsetComponent } from 'src/app/pages/projects/refsets/projects-refset.component';
import { DialogFactoryService } from 'src/app/dialog/services/dialog-factory.service';
import { DialogService } from 'src/app/dialog/services/dialog.service';
import { Debounce } from 'src/app/decorators/debounce.decorator';
import { FormControl } from '@angular/forms';

@Component({
	selector: 'create-refset',
	templateUrl: './create-refset.component.html',
	styleUrls: ['create-refset.component.scss'],
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
	selectedCombinationRefsets = [];
	selectedExternalName = '';
	selectedExternalUrl = '';
	createdMetaDataConcept = '';
	copyRefsetVersionOptions: any[];
	copySearchInput: string;
	copySelectedVersion: any;
	comboSearchInput: string;
	refsetOptions: any[];
	refsetOptionsLoading = false;
	selectedParentConcept = undefined;
	selectedNarrative = '';
	selectedModuleId = '';
	selectedTags = [];
	definitionClauses = [];
	type = '';
	selectedVersionNotes = '';
	originalRefsetMembers = [];
	selectedUUID: string;
	referenceTypes = [Constants.EXTENSIONAL, Constants.INTENSIONAL, Constants.COMBINATION, Constants.EXTERNAL, Constants.COPY];
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
	comboRefset = false;
	versionDate: string;
	refsetConcept: string;
	tags: string[];
	existingMetadataConcepts = [];
	comboConceptOptions: any;
	parentConcepts: any;
	conceptError = '';
	dialog: DialogService;
	selectedCombinationRefsetsForm = new FormControl();
	isAffiliate = false;

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
		private readonly refsetDetails: RefsetDetailsComponent,
		private dialogFactoryService: DialogFactoryService,
		private readonly notificationService: NotificationService,
		private readonly projectsRefsetComponent: ProjectsRefsetComponent
	) {}

	get canAdd(): boolean {
		const project = this.inputProperties.project;
		return project?.roles?.includes('AUTHOR');
	}

	get showCombination(): boolean {
		return this.selectedReferenceType && this.selectedReferenceType === Constants.COMBINATION;
	}

	get showCopy(): boolean {
		return this.selectedReferenceType && this.selectedReferenceType === Constants.COPY;
	}

	get showECL(): boolean {
		return this.selectedReferenceType && this.selectedReferenceType === Constants.INTENSIONAL;
	}

	get showExternal(): boolean {
		return this.selectedReferenceType && this.selectedReferenceType === Constants.EXTERNAL;
	}

	get externalUrlValid(): boolean {
		/* eslint-disable no-useless-escape */
		const httpRegex = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{2,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;
		return this.selectedReferenceType === Constants.EXTERNAL && this.selectedExternalUrl && httpRegex.test(this.selectedExternalUrl);
	}

	get nextDisabled(): boolean {
		return (
			(this.step === 1 && !this.selectedReferenceType) ||
			(this.step === 2 && this.selectedReferenceType === Constants.EXTERNAL && (this.selectedExternalName?.length === 0 || !this.externalUrlValid)) ||
			(this.step === 2 && this.selectedReferenceType === Constants.INTENSIONAL && (this.definitionClauses?.length === 0 || this.definitionClauses[0]?.value === '')) ||
			(this.step === 2 && this.selectedReferenceType === Constants.COPY && (!this.selectedCopyRefset || !this.copySelectedVersion)) ||
			(this.step === 2 && this.selectedReferenceType === Constants.COMBINATION && this.selectedCombinationRefsets?.length === 0)
		);
	}

	ngOnInit(): void {}

	openCreateRefsetModal(createNewRefsetDialog: NgbModal) {
		this.resetModal();

		this.selectedModuleId = this.inputProperties.project.edition.modules[0];
		this.isAffiliate = this.inputProperties.project.edition.organization.affiliate;

		if (this.isAffiliate) {
			this.localSet = true;
			this.isSelected = 2;
		}

		if (this.editMode) {
			this.setupEditMode();
		}

		if (CodeUtility.hasValue(this.inputProperties.project)) {
			this.refsetService.getRefsetConcepts(`branch=${this.inputProperties.project.edition.branch.toString()}&areParentConcepts=false`).subscribe((results) => {
				this.existingMetadataConcepts = results.items ? results.items : undefined;
			});

			this.refsetService.getRefsetConcepts(`branch=${this.inputProperties.project.edition.branch.toString()}&areParentConcepts=true`).subscribe((results) => {
				this.parentConcepts = results.items ? results.items : undefined;
				this.parentConcepts = this.sortParents(this.parentConcepts);
			});

			const restParams: any = {
				limit: -1,
				offset: 0,
				searchConcepts: true,
				showInDevelopment: true,
				//query: `projectId:${this.inputProperties.project.id} AND versionStatus:PUBLISHED`
				query: `editionShortName:${this.inputProperties.project.edition.shortName} AND versionStatus:PUBLISHED`,
				//sortModel: rowParams.sortModel, //not needed once we get rid of mocking the backend
				//filterModel: rowParams.filterModel, //not needed once we get rid of mocking the backend
			};

			this.modalService.open(createNewRefsetDialog, {
				windowClass: 'createNewRefsetDialog',
				backdrop: 'static',
				keyboard: false,
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
		this.selectedCombinationRefsets = [];
		this.selectedExternalName = '';
		this.selectedExternalUrl = '';
		this.selectedNarrative = '';
		this.selectedVersionNotes = '';
		this.selectedTags = [];
		this.definitionClauses = [{ value: '', negated: false }];
		this.selectedReferenceType = 'EXTENSIONAL';
		this.privateRefset = false;
		this.comboRefset = false;
		this.localSet = false;
		this.conceptError = '';
		this.step = 1;
		this.copyRefsetVersionOptions = [];
		this.copySearchInput = '';
		this.comboSearchInput = '';
		this.refsetOptions = [];
		this.refsetOptionsLoading = false;
		this.selectedCopyRefset = '';
		this.selectedUUID = '';
		this.copySelectedVersion = '';
		this.isAffiliate = false;
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
		this.refsetConcept = inputs.metadataConcept;
		this.versionNotes = inputs.versionNotes;
		this.selectedReferenceType = inputs.referenceType;
		this.definitionClauses = inputs.definitionClauses;
		this.isAffiliate = inputs.project.edition.organization.affiliate;
		//this.detectChanges.detectChanges();
	}

	createRefsetObject(): void {
		this.showLoadingSpinner = true;
		if (this.selectedReferenceType === Constants.COPY) {
			const existingCpt = this.existingMetadataConcepts[this.selectedMetaDataConcept]?.code;
			this.refsetService
				.getRefsetCopy(
					this.selectedUUID,
					this.createdMetaDataConcept,
					this.inputProperties.project.id,
					this.localSet,
					this.privateRefset,
					this.comboRefset,
					this.selectedNarrative,
					this.selectedTags,
					this.selectedParentConcept,
					existingCpt ? existingCpt : ''
				)
				.subscribe(
					(results) => {
						this.showLoadingSpinner = false;
						this.modalService.dismissAll();
						this.router.navigate(['/details', results.refsetId, Constants.IN_DEVELOPMENT], { replaceUrl: false, skipLocationChange: false });
						return;
					},
					(error) => {
						this.showLoadingSpinner = false;
						this.modalService.dismissAll();
					}
				);
		} else {
			let name = '';
			let refsetId = null;
			let parentConceptId = null;

			if (this.selectedReferenceType !== Constants.EXTERNAL && this.isSelected === 1) {
				name = this.existingMetadataConcepts[this.selectedMetaDataConcept].name;
				refsetId = this.existingMetadataConcepts[this.selectedMetaDataConcept].code;
			} else {
				name = this.createdMetaDataConcept;
				parentConceptId = this.selectedParentConcept;
			}

			const params: any = {
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

			if (this.type === Constants.INTENSIONAL && this.definitionClauses.length > 0) {
				params.definitionClauses = this.definitionClauses;
			}
			if (this.selectedReferenceType === Constants.EXTERNAL) {
				params.externalUrl = this.selectedExternalUrl;
				params.name = this.capitalizeFirstLetterOfString(this.selectedExternalName);
			}
			if (this.selectedReferenceType === Constants.COMBINATION) {
				params.comboRefset = true;
			}
			this.refsetService.createRefset(params).subscribe(
				(status) => {
					if (status.error) {
						this.notificationService.show('There was a problem with the request, please try again! Error: ' + status.error, null, 'error', {
							timeOut: 0,
							extendedTimeOut: 0,
						});
						return;
					}
					this.showLoadingSpinner = false;
					this.modalService.dismissAll();
					this.router.navigate(['/details', status.refsetId, Constants.IN_DEVELOPMENT], { replaceUrl: false, skipLocationChange: false });
				},
				(error) => {
					this.showLoadingSpinner = false;
					this.modalService.dismissAll();
				}
			);
		}
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
			type: this.referenceType,
		};

		if (this.selectedReferenceType === Constants.INTENSIONAL && this.definitionClauses.length > 0) {
			params.definitionClauses = this.definitionClauses;
		}

		this.refsetService.updateRefsetMetadata(this.refsetInternalId, params).subscribe(
			(status) => {
				if (status.error) {
					this.notificationService.show('There was a problem with the request, please try again! Error: ' + status.error, null, 'error', {
						timeOut: 0,
						extendedTimeOut: 0,
					});
					return;
				}

				this.modalService.dismissAll();
				this.router.navigate(['/details', this.refsetId, Constants.IN_DEVELOPMENT], { replaceUrl: false, skipLocationChange: false });
				this.refsetDetails.initializeDetailsPage();
			},
			(error) => {
				//
			}
		);
	}

	isComplete(): boolean {
		let typeCheck = false;
		let conceptCheck = false;

		if (this.selectedReferenceType === Constants.EXTERNAL && this.selectedExternalUrl?.length > 0 && this.selectedExternalName?.length > 0) {
			return true;
		} else if (this.selectedReferenceType === Constants.EXTENSIONAL) {
			typeCheck = true;
		} else if (this.selectedReferenceType === Constants.INTENSIONAL && this.definitionClauses.length > 0 && CodeUtility.hasValue(this.definitionClauses[0].value)) {
			typeCheck = true;
		} else if (this.selectedReferenceType === Constants.COMBINATION && this.selectedCombinationRefsets?.length > 0) {
			typeCheck = true;
		} else if (this.selectedReferenceType === Constants.COPY) {
			typeCheck = true;
		}

		if (this.isSelected === 1 && CodeUtility.hasValue(this.selectedMetaDataConcept)) {
			conceptCheck = true;
		} else if (this.isSelected === 2 && CodeUtility.hasValue(this.createdMetaDataConcept) && CodeUtility.hasValue(this.selectedParentConcept) && this.isValidConceptName()) {
			conceptCheck = true;
		}

		return typeCheck && conceptCheck && this.selectedModuleId.length > 0;
	}

	isValidConceptName(): boolean {
		const format = /^(?!.* {2,})[!-9A-z\\()À-ú\s]+$/;
		let lower = null;
		if (this.createdMetaDataConcept) {
			lower = this.createdMetaDataConcept.toLowerCase();
		} else {
			lower = this.existingMetadataConcepts[this.selectedMetaDataConcept].name;
		}

		const flag = lower.match(format);
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
		this.isSelected = Number(event.value);
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

	removeCombinationRefset(index: number): void {
		const newSelectedCombinationRefsetsForm = this.selectedCombinationRefsetsForm.value.filter((_, i) => i !== index);

		this.selectedCombinationRefsetsForm.patchValue(newSelectedCombinationRefsetsForm);
		this.selectedCombinationRefsets = this.selectedCombinationRefsetsForm.value;
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

	async onSearchChange(value, isCombination = false): Promise<void> {
		if (isCombination) {
			await this.combinationSearch(value);
		} else {
			await this.search(value);
		}
	}

	handleInput(event: KeyboardEvent): void {
		event.stopPropagation();
	}

	@Debounce()
	search(query: string): void {
		this.refsetOptionsLoading = true;
		this.refsetOptions = [];
		this.selectedUUID = null;
		this.copySelectedVersion = null;
		this.copyRefsetVersionOptions = [];

		this.refsetService.searchRefsetsForDropdowns(query).subscribe((results) => {
			this.refsetOptions = results.items.filter((item) => item.refsetId !== this.refsetId);

			for (const option of this.refsetOptions) {
				option.flagIcon = RefsetUtility.getEditionFlagIcon(option.edition?.branch);
			}

			this.refsetOptionsLoading = false;
		});
	}

	@Debounce()
	combinationSearch(query: string): void {
		this.refsetOptionsLoading = true;
		this.refsetOptions = [];

		query = query.trim();
		let queryField = '';

		// if this is numeric only treat it as a refset ID
		if (/^\d+$/.test(query)) {
			queryField = 'refsetId:' + query;
		} else {
			queryField = 'name:' + query;
		}

		const restParams: any = {
			displayType: 'list',
			offset: 0,
			searchConcepts: false,
			showInDevelopment: false,
			countComments: false,
			query: `editionShortName:${this.inputProperties.project.edition.shortName} AND versionStatus:PUBLISHED AND ${queryField}`,
		};

		if (query.length > 2) {
			this.refsetService.getRefsets({ ...restParams }).subscribe({
				next: (results) => {
					this.refsetOptions = this.sortRefsets(results.items);

					for (const option of this.refsetOptions) {
						option.flagIcon = RefsetUtility.getEditionFlagIcon(option.edition?.branch);
					}

					this.refsetOptionsLoading = false;
				},
				error: (error) => {
					//
				},
			});
		} else {
			this.refsetOptionsLoading = false;
		}
	}

	copyRefsetSelected(event) {
		const copyRefset = event.value;
		this.copyRefsetVersionOptions = RefsetUtility.getVersionOptions(copyRefset);
		this.selectedCopyRefsetName = copyRefset.name;
		this.copySelectedVersion = this.copyRefsetVersionOptions[0];
	}

	optionSelect(event) {
		if (this.selectedCombinationRefsets.indexOf(event) === -1) {
			this.selectedCombinationRefsets.push(event);
		} else {
			const index = this.selectedCombinationRefsets.indexOf(event);

			this.selectedCombinationRefsets.splice(index, 1);
		}

		this.selectedCombinationRefsetsForm.patchValue(this.selectedCombinationRefsets);
	}

	copyCheckComplete() {
		return this.selectedCopyRefset != null;
	}

	showFlagIcon(event, show) {
		event.target.style.display = show ? 'inline' : 'none';
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
		} else if (referenceType === Constants.EXTENSIONAL) {
			dialogData.template = this.extensionalInfoDialog;
		} else if (referenceType === Constants.INTENSIONAL) {
			dialogData.template = this.intensionalInfoDialog;
		} else if (referenceType === Constants.EXTERNAL) {
			dialogData.template = this.externalInfoDialog;
		} else if (referenceType === Constants.COPY) {
			dialogData.template = this.copyInfoDialog;
		} else if (referenceType === Constants.COMBINATION) {
			dialogData.template = this.combinationInfoDialog;
		}

		const dialogOptions = {
			id: dialogId,
		};

		this.dialog = this.dialogFactoryService.open(dialogData);

		this.dialog.confirmed().subscribe((data) => {});
	}

	goBack(): void {
		if (this.step > 1) {
			this.step -= 1;
			if (this.selectedReferenceType === Constants.EXTENSIONAL) {
				this.step -= 1;
			}
		}
	}

	goNext(): void {
		if (this.step < 3) {
			this.step += 1;
			if (this.selectedReferenceType === Constants.EXTENSIONAL) {
				this.type = Constants.EXTENSIONAL;
				this.step += 1;
			}
			if (this.selectedReferenceType === Constants.INTENSIONAL) {
				this.type = Constants.INTENSIONAL;
			}
			if (this.selectedReferenceType === Constants.EXTERNAL) {
				this.type = Constants.EXTERNAL;
			}
			if (this.selectedReferenceType === Constants.COPY && this.selectedCopyRefset) {
				this.getRefset();
			}
			if (this.selectedReferenceType === Constants.COMBINATION && this.selectedCombinationRefsets?.length > 0) {
				this.type = Constants.INTENSIONAL;
				this.comboRefset = true;
				let str1 = '';
				for (const comboRefset of this.selectedCombinationRefsets) {
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

	setModuleIdOrder(moduleA, moduleB) {
		return 1;
	}

	getRefset(): void {
		const name = this.selectedCopyRefset?.name.substring(this.selectedCopyRefset?.name.lastIndexOf('/') + 1);
		this.createdMetaDataConcept = 'Copy of ' + name;
		this.refsetService.getRefset(this.selectedCopyRefset.refsetId, this.copySelectedVersion.versionDate).subscribe({
			next: (results) => {
				this.selectedNarrative = results?.narrative ? 'Narrative is copied from <i>' + name + '</i>:<br/><br/>' + results?.narrative : '';
				this.selectedTags = results?.tags;
				this.privateRefset = results?.privateRefset;
				this.comboRefset = results?.comboRefset;
				//this.selectedParentConcept = results?.parentConceptId;
				this.definitionClauses[0].value = results?.definitionClauses[0]?.value;
				this.type = results?.type;
				this.selectedUUID = results?.id;

				if (this.isAffiliate) {
					this.localSet = true;
				} else {
					this.localSet = results?.localSet;
				}
			},
		});
	}
}
