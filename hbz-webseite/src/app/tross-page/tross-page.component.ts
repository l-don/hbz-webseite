import { Component } from '@angular/core';
import {BannerImgComponent} from "../banner-img/banner-img.component";
import {SlideshowComponent} from "../slideshow/slideshow.component";
import {NgIf} from "@angular/common";

@Component({
  selector: 'app-tross-page',
  standalone: true,
  imports: [
    BannerImgComponent,
    SlideshowComponent,
    NgIf
  ],
  templateUrl: './tross-page.component.html',
  styleUrl: './tross-page.component.scss'
})
export class TrossPageComponent {
  slideshowVisible: boolean = false;
  selectedYear: number | null = null;

  toggleSlideshow(year: number) {
    if (this.selectedYear === year) {
      this.slideshowVisible = !this.slideshowVisible;
      this.selectedYear = null;
    } else {
      this.selectedYear = year;
      this.slideshowVisible = true;
    }
  }
}
