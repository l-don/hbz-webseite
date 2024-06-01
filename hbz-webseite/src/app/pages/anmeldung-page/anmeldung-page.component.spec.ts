import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnmeldungPageComponent } from './anmeldung-page.component';

describe('AnmeldungPageComponent', () => {
  let component: AnmeldungPageComponent;
  let fixture: ComponentFixture<AnmeldungPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnmeldungPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AnmeldungPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
