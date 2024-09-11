import { Component } from '@angular/core';
import {BannerImgComponent} from "../../banner-img/banner-img.component";

@Component({
  selector: 'app-neusiedler-page',
  standalone: true,
    imports: [
        BannerImgComponent
    ],
  templateUrl: './neusiedler-page.component.html',
  styleUrl: './neusiedler-page.component.scss'
})
export class NeusiedlerPageComponent {

}
