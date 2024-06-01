import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NeuigkeitenPageComponent } from './neuigkeiten-page.component';

describe('NeuigkeitenPageComponent', () => {
  let component: NeuigkeitenPageComponent;
  let fixture: ComponentFixture<NeuigkeitenPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeuigkeitenPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NeuigkeitenPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
