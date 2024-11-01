import { Component } from '@angular/core';
import {BannerImgComponent} from "../../banner-img/banner-img.component";
import {NgForOf} from "@angular/common";

@Component({
  selector: 'app-sponsoren-page',
  standalone: true,
  imports: [
    BannerImgComponent,
    NgForOf
  ],
  templateUrl: './sponsoren-page.component.html',
  styleUrl: './sponsoren-page.component.scss'
})
export class SponsorenPageComponent {
  sponsors = [
    { name: 'Balzuhn', logo: 'balzuhn-frankenberg-logo.jpg' },
    { name: 'BHS Transporte', logo: 'BHS Transporte Logo_Neu.jpeg' },
    { name: 'Agraset', logo: 'Logo-Agraset.jpg' },
    { name: 'Narrateau', logo: 'Narrateua 2.jpg' },
    { name: 'Orgis', logo: 'Orgis Logo 2.jpg' },
    { name: 'Sparkasse', logo: 'SPKMSN_rot.jpg' }
  ];
}
