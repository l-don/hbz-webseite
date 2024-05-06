import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DreiBilderComponent } from './drei-bilder.component';

describe('DreiBilderComponent', () => {
  let component: DreiBilderComponent;
  let fixture: ComponentFixture<DreiBilderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DreiBilderComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DreiBilderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
