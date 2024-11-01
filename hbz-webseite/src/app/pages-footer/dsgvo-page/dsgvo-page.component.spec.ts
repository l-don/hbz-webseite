import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DsgvoPageComponent } from './dsgvo-page.component';

describe('DsgvoPageComponent', () => {
  let component: DsgvoPageComponent;
  let fixture: ComponentFixture<DsgvoPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DsgvoPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DsgvoPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
