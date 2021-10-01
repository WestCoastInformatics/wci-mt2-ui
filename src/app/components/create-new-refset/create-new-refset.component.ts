import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { firstValueFrom } from 'rxjs';
import { Route, Router } from '@angular/router';

@Component({
  selector: 'create-new-refset',
  templateUrl: './create-new-refset.component.html'
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
  referenceTypes = ['Extensional', 'Intensional'];
  versionNotes = ''
  selectedReferenceType = '';
  selectedAvailability = false;
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
  id: string;
  @Input()
  editModeProperties: {
    projectName: string;
    organizationName: string;
    editionName: string;
    metadataConcept: string;
    parentConcept: string;
    narrative: string;
    tags: string[];
    referenceType: string;
    selectedAvailability: boolean;
    versionDate: any
  }
  organizationName: string;
  editionName: string;
  projectName: string;
  constructor(private modalService: NgbModal,
    private detectChanges: ChangeDetectorRef,
    private router: Router,
    private refsetService: RefsetService) {
  }

  ngOnInit(): void {

  }

  openCreateRefsetModal(createNewRefsetDialog: NgbModal) {
    console.log(this.existingMetadataConcepts);
    if (this.editMode) {
      this.setupEditMode();
    }
    if (this.selectedProject || this.isDetailsPage) {
      this.modalService.open(createNewRefsetDialog, { windowClass: 'createNewRefsetDialog', backdrop : 'static', keyboard : false  });
    }
  }

  resetModal(): void {
    this.isSelected = 0;
    this.selectedMetaDataConcept = '';
    this.selectedBranchVersion = '';
    this.createdMetaDataConcept = '';
    this.selectedParentConcept = undefined;
    this.selectedNarrative = '';
    this.selectedTags = [];
    this.selectedReferenceType = '';
    this.selectedAvailability = false;
  }

  setupEditMode(): void {
    this.organizationName = this.editModeProperties.organizationName;
    this.editionName = this.editModeProperties.editionName;
    this.projectName = this.editModeProperties.projectName;
    this.selectedMetaDataConcept = this.editModeProperties.metadataConcept;
    this.selectedBranchVersion = this.editModeProperties.versionDate;
    this.createdMetaDataConcept = this.editModeProperties.metadataConcept;
    this.selectedParentConcept = this.editModeProperties.parentConcept;
    this.selectedNarrative = this.editModeProperties.narrative;
    this.selectedTags = this.editModeProperties.tags;
    this.selectedReferenceType = this.editModeProperties.referenceType;
    this.selectedAvailability = this.editModeProperties.selectedAvailability;
  }

  createRefsetObject(): void {
    this.showLoadingSpinner = true;
    this.refsetService.createRefset({
      name: this.selectedMetaDataConcept ? this.selectedMetaDataConcept : (this.createdMetaDataConcept ? this.createdMetaDataConcept : ''),
      parentConceptId: this.selectedParentConcept ? this.selectedParentConcept : undefined,
      moduleId: '',
      editionId: this.selectedProject?.organization?.edition?.id,
      projectId: this.selectedProject?.id,
      narrative: this.selectedNarrative,
      type: this.selectedReferenceType,
      tags: this.selectedTags,
      versionDate: this.selectedBranchVersion,
      privateRefset: this.selectedAvailability,
    }).subscribe(refsetId => {
        this.showLoadingSpinner = false;
        this.router.navigate(['/edit/refset', refsetId.refsetInternalId]);
    },
    error => {
      console.log(error);
      this.showLoadingSpinner = false;
    });

    console.log('refset object created');
    console.log(this.selectedProject.name);
    console.log(this.selectedProject['organization'].name);
    console.log(this.selectedProject['organization'].edition.name);
    console.log(this.isSelected);
    console.log(this.selectedMetaDataConcept ? this.selectedMetaDataConcept : (this.createdMetaDataConcept ? this.createdMetaDataConcept : ''));
    console.log(this.selectedParentConcept);
    console.log(this.selectedNarrative);
    console.log(this.selectedTags);
    console.log(this.selectedReferenceType);
    console.log(this.selectedAvailability);
  }

  editRefsetObject(): void {
    this.showLoadingSpinner = true;
    this.refsetService.editRefsetMembers(this.id, {
      narrative: this.selectedNarrative,
      tags: this.selectedTags,
      versionNotes: this.versionNotes
    }).subscribe(refsetId => {
        this.showLoadingSpinner = false;
        this.router.navigate(['/edit/refset', refsetId.refsetInternalId]);
    },
    error => {
      console.log(error);
      this.showLoadingSpinner = false;
    });

    console.log('refset object edited');
    console.log(this.versionNotes);
    console.log(this.selectedNarrative);
    console.log(this.selectedTags);
  }

  isComplete(): boolean {
    return this.selectedProject.name &&
    this.selectedProject.organization.edition.id &&
    this.selectedProject.id &&
    this.selectedBranchVersion &&
    this.selectedReferenceType &&
    (this.isSelected > 0);
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
    console.log(this.isSelected);
  }

  add(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    // Add our fruit
    if ((value || '').trim()) {
      this.selectedTags.push(value);
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }
  }

  remove(data: string): void {
    const index = this.selectedTags.indexOf(data);

    if (index >= 0) {
      this.selectedTags.splice(index, 1);
    }
  }
}
