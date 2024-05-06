import { Component } from '@angular/core';
import {BannerImgComponent} from "../banner-img/banner-img.component";
import {SlideshowComponent} from "../slideshow/slideshow.component";
import {NgIf} from "@angular/common";
import {DreiBilderComponent} from "../drei-bilder/drei-bilder.component";

@Component({
  selector: 'app-tross-page',
  standalone: true,
  imports: [
    BannerImgComponent,
    SlideshowComponent,
    NgIf,
    DreiBilderComponent
  ],
  templateUrl: './tross-page.component.html',
  styleUrl: './tross-page.component.scss'
})
export class TrossPageComponent {
  slideshowVisible: boolean = false;
  selectedYear: number | null = null;
  meineBilder = [
    { src: "../assets/Home/Home_rechts.jpg", alt: "Das Zeltlager", desc: "Beschreibung von  1" },
    { src: "assets/Home/Home_links.jpg", alt: "Auf Tour", desc: "Beschreibung von Bild 2" },
    { src: "../assets/main_left.jpg", alt: "Die Mahlzeiten", desc: "Beschreibung von Bild 3" }
  ];

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
