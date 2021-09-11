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
  selectedNarrative = '';
  selectedTags = [];
  referenceTypes = ['Extensional', 'Intensional'];
  selectedReferenceType = '';
  selectedAvailability = false;

  @Input()
  selectedProject: any;

  @Input()
  existingMetadataConcepts: any;

  @Input()
  existingBranchVersions: any;

  constructor(private modalService: NgbModal,
    private detectChanges: ChangeDetectorRef,
    private router: Router,
    private refsetService: RefsetService) {
  }

  ngOnInit(): void {

  }

  openCreateRefsetModal(createNewRefsetDialog: NgbModal) {
    console.log(this.existingMetadataConcepts);
    if (this.selectedProject) {
      this.modalService.open(createNewRefsetDialog);
    }
  }

  resetModal(): void {
    this.isSelected = 0;
    this.selectedMetaDataConcept = '';
    this.selectedBranchVersion = '';
    this.createdMetaDataConcept = '';
    this.selectedNarrative = '';
    this.selectedTags = [];
    this.selectedReferenceType = '';
    this.selectedAvailability = false;
  }

  createRefsetObject(): void {
    this.refsetService.createRefset({
      name: this.selectedProject?.name,
      // parentConceptId: '',
      moduleId: '',
      editionId: this.selectedProject?.organization?.edition?.id,
      projectId: this.selectedProject?.id,
      narrative: this.selectedNarrative,
      type: this.selectedReferenceType,
      // tags: this.selectedTags?.join('; ').toString(),
      versionDate: this.selectedBranchVersion,
      privateRefset: this.selectedAvailability,
    }).subscribe(refsetId => this.router.navigate(['/edit/refset', refsetId.refsetInternalId]));

    console.log('refset object created');
    console.log(this.selectedProject.name);
    console.log(this.selectedProject['organization'].name);
    console.log(this.selectedProject['organization'].edition.name);
    console.log(this.selectedMetaDataConcept);
    console.log(this.createdMetaDataConcept);
    console.log(this.selectedNarrative);
    console.log(this.selectedTags);
    console.log(this.selectedReferenceType);
    console.log(this.selectedAvailability);
  }

  isComplete(): boolean {
    return this.selectedProject.name &&
    this.selectedProject.organization.edition.id &&
    this.selectedProject.id
  }

  checkRadioButtonValue(event: any): void {
    this.isSelected = event.value;
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
