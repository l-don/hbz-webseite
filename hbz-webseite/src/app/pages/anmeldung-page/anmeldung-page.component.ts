import { Component } from '@angular/core';
import {BannerImgComponent} from "../../banner-img/banner-img.component";
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-anmeldung-page',
  standalone: true,
  imports: [
    BannerImgComponent,
    RouterModule
  ],
  templateUrl: './anmeldung-page.component.html',
  styleUrl: './anmeldung-page.component.scss'
})
export class AnmeldungPageComponent {

}
