import {Component, OnInit} from '@angular/core';
import {RouterLink} from "@angular/router";
import {BannerImgComponent} from "../../banner-img/banner-img.component";
import {NgForOf, NgOptimizedImage} from "@angular/common";


@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [
    RouterLink,
    NgForOf,
    NgOptimizedImage,
    BannerImgComponent
  ],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.scss'
})
export class MainPageComponent {



}
