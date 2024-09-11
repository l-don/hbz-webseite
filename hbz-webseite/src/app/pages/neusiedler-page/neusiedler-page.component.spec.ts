import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NeusiedlerPageComponent } from './neusiedler-page.component';

describe('NeusiedlerPageComponent', () => {
  let component: NeusiedlerPageComponent;
  let fixture: ComponentFixture<NeusiedlerPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeusiedlerPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NeusiedlerPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
