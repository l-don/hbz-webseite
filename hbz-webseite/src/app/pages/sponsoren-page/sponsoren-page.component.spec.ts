import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SponsorenPageComponent } from './sponsoren-page.component';

describe('SponsorenPageComponent', () => {
  let component: SponsorenPageComponent;
  let fixture: ComponentFixture<SponsorenPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SponsorenPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SponsorenPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
