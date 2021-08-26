import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateNewRefsetComponent } from './create-new-refset.component';

describe('CreateNewRefsetComponent', () => {
  let component: CreateNewRefsetComponent;
  let fixture: ComponentFixture<CreateNewRefsetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateNewRefsetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateNewRefsetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
