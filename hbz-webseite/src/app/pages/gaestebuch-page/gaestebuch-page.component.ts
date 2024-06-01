import { Component } from '@angular/core';
import {BannerImgComponent} from "../../banner-img/banner-img.component";

@Component({
  selector: 'app-gaestebuch-page',
  standalone: true,
    imports: [
        BannerImgComponent
    ],
  templateUrl: './gaestebuch-page.component.html',
  styleUrl: './gaestebuch-page.component.scss'
})
export class GaestebuchPageComponent {

}
