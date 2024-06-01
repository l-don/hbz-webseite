import { Component } from '@angular/core';
import {BannerImgComponent} from "../../banner-img/banner-img.component";

@Component({
  selector: 'app-neuigkeiten-page',
  standalone: true,
    imports: [
        BannerImgComponent
    ],
  templateUrl: './neuigkeiten-page.component.html',
  styleUrl: './neuigkeiten-page.component.scss'
})
export class NeuigkeitenPageComponent {

}
