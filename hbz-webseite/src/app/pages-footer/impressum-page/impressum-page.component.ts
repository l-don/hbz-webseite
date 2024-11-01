import { Component } from '@angular/core';
import {BannerImgComponent} from "../../banner-img/banner-img.component";
import {NgForOf} from "@angular/common";

@Component({
  selector: 'app-impressum-page',
  standalone: true,
  imports: [
    BannerImgComponent,
    NgForOf
  ],
  templateUrl: './impressum-page.component.html',
  styleUrl: './impressum-page.component.scss'
})
export class ImpressumPageComponent {

}
