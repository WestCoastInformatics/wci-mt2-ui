import { ChangeDetectorRef, Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';

@Component({
  selector: 'create-new-refset',
  templateUrl: './create-new-refset.component.html'
})
export class CreateNewRefsetComponent {
  dummydata = ['Your Usual Project', 'test2', 'test3'];
  selectedValue = this.dummydata[0];
  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = true;
  selectedRadioButton = false;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  isSelected = 0;

  constructor(private modalService: NgbModal,
    private detectChanges: ChangeDetectorRef) {
  }

  openCreateRefsetModal(createNewRefsetDialog: NgbModal) {
    this.modalService.open(createNewRefsetDialog);
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
      this.dummydata.push(value);
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }
  }

  remove(data: string): void {
    const index = this.dummydata.indexOf(data);

    if (index >= 0) {
      this.dummydata.splice(index, 1);
    }
  }
}
