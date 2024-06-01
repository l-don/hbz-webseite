import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrossPageComponent } from './tross-page.component';

describe('TrossPageComponent', () => {
  let component: TrossPageComponent;
  let fixture: ComponentFixture<TrossPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrossPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TrossPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
