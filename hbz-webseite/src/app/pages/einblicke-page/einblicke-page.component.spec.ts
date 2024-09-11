import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EinblickePageComponent } from './einblicke-page.component';

describe('EinblickePageComponent', () => {
  let component: EinblickePageComponent;
  let fixture: ComponentFixture<EinblickePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EinblickePageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EinblickePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
