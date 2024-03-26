import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VereinPageComponent } from './verein-page.component';

describe('VereinPageComponent', () => {
  let component: VereinPageComponent;
  let fixture: ComponentFixture<VereinPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VereinPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VereinPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
