import { Component } from '@angular/core';
import {BannerImgComponent} from "../../banner-img/banner-img.component";

@Component({
  selector: 'app-einblicke-page',
  standalone: true,
    imports: [
        BannerImgComponent
    ],
  templateUrl: './einblicke-page.component.html',
  styleUrl: './einblicke-page.component.scss'
})
export class EinblickePageComponent {

}
