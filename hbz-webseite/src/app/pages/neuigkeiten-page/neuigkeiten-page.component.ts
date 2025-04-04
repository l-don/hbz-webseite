import { Component, OnInit } from '@angular/core';
import { BannerImgComponent } from "../../banner-img/banner-img.component";
import { GalleryLightboxComponent } from "../../gallery-lightbox/gallery-lightbox.component";
import { CommonModule } from "@angular/common";

@Component({
  selector: 'app-neuigkeiten-page',
  standalone: true,
  imports: [
    BannerImgComponent,
    GalleryLightboxComponent,
    CommonModule
  ],
  templateUrl: './neuigkeiten-page.component.html',
  styleUrl: './neuigkeiten-page.component.scss'
})
export class NeuigkeitenPageComponent implements OnInit {
  rochlitzImages: Array<any> = [];

  ngOnInit(): void {
    // Prepare Rochlitz images for the gallery lightbox
    const basePath = 'assets/neuigkeiten/rochlitz/';
    const imageFiles = [
      'IMG-20250402-WA0003.jpg',
      'IMG-20250402-WA0004.jpg',
      'IMG-20250402-WA0005.jpg',
      'IMG-20250402-WA0006.jpg',
      'IMG-20250402-WA0007.jpg',
      'IMG-20250402-WA0008.jpg',
      'IMG-20250402-WA0012.jpg',
      'WhatsApp Bild 2025-03-30 um 17.53.22_4feb8296.jpg',
      'WhatsApp Bild 2025-03-30 um 17.53.22_5dd3db21.jpg'
    ];
    
    this.rochlitzImages = imageFiles.map(file => ({
      src: basePath + file,
      thumb: basePath + file,
      caption: 'Rochlitz 2025'
    }));
  }
}
