import { Component } from '@angular/core';
import {BannerImgComponent} from "../../banner-img/banner-img.component";

@Component({
  selector: 'app-verein-page',
  standalone: true,
  imports: [BannerImgComponent],
  templateUrl: './verein-page.component.html',
  styleUrl: './verein-page.component.scss'
})
export class VereinPageComponent {

}
