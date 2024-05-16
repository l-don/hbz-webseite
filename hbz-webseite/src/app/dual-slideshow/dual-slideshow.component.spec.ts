import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DualSlideshowComponent } from './dual-slideshow.component';

describe('DualSlideshowComponent', () => {
  let component: DualSlideshowComponent;
  let fixture: ComponentFixture<DualSlideshowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DualSlideshowComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DualSlideshowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
