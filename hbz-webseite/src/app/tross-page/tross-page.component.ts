import { Component } from '@angular/core';
import {BannerImgComponent} from "../banner-img/banner-img.component";

@Component({
  selector: 'app-tross-page',
  standalone: true,
  imports: [
    BannerImgComponent
  ],
  templateUrl: './tross-page.component.html',
  styleUrl: './tross-page.component.scss'
})
export class TrossPageComponent {

}
