import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageItems } from './manage-items.component';

describe('ManageItems', () => {
  let component: ManageItems;
  let fixture: ComponentFixture<ManageItems>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ManageItems]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageItems);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
