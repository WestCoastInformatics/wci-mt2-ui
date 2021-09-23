import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddRemoveByConceptModalComponent } from './add-remove-by-concept-modal.component';

describe('AddRemoveByConceptModalComponent', () => {
  let component: AddRemoveByConceptModalComponent;
  let fixture: ComponentFixture<AddRemoveByConceptModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddRemoveByConceptModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddRemoveByConceptModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
