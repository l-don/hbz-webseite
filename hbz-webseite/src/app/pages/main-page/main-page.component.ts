import {Component } from '@angular/core';
import {RouterLink} from "@angular/router";
import {BannerImgComponent} from "../../banner-img/banner-img.component";
import {NgForOf, NgOptimizedImage} from "@angular/common";
import {GalleryLightboxComponent} from "../../gallery-lightbox/gallery-lightbox.component";

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [
    RouterLink,
    NgForOf,
    NgOptimizedImage,
    BannerImgComponent,
    GalleryLightboxComponent
  ],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.scss'
})
export class MainPageComponent {

}
