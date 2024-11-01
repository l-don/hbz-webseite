import { Component } from '@angular/core';
import {BannerImgComponent} from "../../banner-img/banner-img.component";

@Component({
  selector: 'app-dsgvo-page',
  standalone: true,
    imports: [
        BannerImgComponent
    ],
  templateUrl: './dsgvo-page.component.html',
  styleUrl: './dsgvo-page.component.scss'
})
export class DsgvoPageComponent {

}
