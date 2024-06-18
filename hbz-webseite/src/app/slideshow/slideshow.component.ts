import { Component, Input } from '@angular/core';
import {NgIf} from "@angular/common";

@Component({
  selector: 'app-slideshow',
  templateUrl: './slideshow.component.html',
  standalone: true,
  imports: [
    NgIf
  ],
  styleUrls: ['./slideshow.component.scss']
})
export class SlideshowComponent {
  @Input() images: string[] = [];
  currentIndex: number = 0;

  get currentSlide(): string {
    return this.images[this.currentIndex];
  }

  nextSlide(): void {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
  }

  prevSlide(): void {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
  }
}
