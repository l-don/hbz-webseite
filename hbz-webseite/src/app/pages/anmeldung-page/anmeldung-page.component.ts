import { Component } from '@angular/core';
import {BannerImgComponent} from "../../banner-img/banner-img.component";

@Component({
  selector: 'app-anmeldung-page',
  standalone: true,
  imports: [
    BannerImgComponent
  ],
  templateUrl: './anmeldung-page.component.html',
  styleUrl: './anmeldung-page.component.scss'
})
export class AnmeldungPageComponent {

}
