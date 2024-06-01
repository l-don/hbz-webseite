import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GaestebuchPageComponent } from './gaestebuch-page.component';

describe('GaestebuchPageComponent', () => {
  let component: GaestebuchPageComponent;
  let fixture: ComponentFixture<GaestebuchPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GaestebuchPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GaestebuchPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
