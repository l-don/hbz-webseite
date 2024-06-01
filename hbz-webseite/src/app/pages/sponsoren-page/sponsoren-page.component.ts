import { Component } from '@angular/core';
import {BannerImgComponent} from "../../banner-img/banner-img.component";

@Component({
  selector: 'app-sponsoren-page',
  standalone: true,
    imports: [
        BannerImgComponent
    ],
  templateUrl: './sponsoren-page.component.html',
  styleUrl: './sponsoren-page.component.scss'
})
export class SponsorenPageComponent {

}
