import { Component } from '@angular/core';
import {BannerImgComponent} from "../../banner-img/banner-img.component";
import {NgForOf} from "@angular/common";
import {DualSlideshowComponent} from "../../dual-slideshow/dual-slideshow.component";

@Component({
  selector: 'app-sponsoren-page',
  standalone: true,
    imports: [
        BannerImgComponent,
        NgForOf,
        DualSlideshowComponent
    ],
  templateUrl: './sponsoren-page.component.html',
  styleUrl: './sponsoren-page.component.scss'
})
export class SponsorenPageComponent {
  sponsors = [
    { name: 'Uwe Balzuhn e.K.', logo: 'balzuhn-frankenberg-logo.jpg', link:'https://balzuhn.de' },
    { name: 'BHS Transporte', logo: 'BHS Transporte Logo_Neu.jpeg', link:'https://www.bhs-transporte.de'  },
    { name: 'Agraset-Agrargenossenschaft eG Naundorf bei Rochlitz', logo: 'Logo-Agraset.jpg', link:'https://www.agraset.de'  },
    { name: 'Narrateau', logo: 'Narrateua 2.jpg' , link:'https://www.narrateau.de' },
    { name: 'Orgis Werbung', logo: 'Orgis Logo 2.jpg' , link:'https://www.orgiswerbung.de' },
    { name: 'DELPHIN - Projekte gGmbH', logo: 'Delphin Logo mit Adresse.jpg' , link:'https://karree49.de/karree49' },
    { name: 'TO.LI. - Mietservice Herr Holger Liermann', logo: 'TO.LI.-Logo.jpg' , link:'http://www.toli-mietservice.de/index.html' },
    { name: 'ATM Reparaturzentrum', logo: 'atm-Reparaturzentrum-logo.jpg' , link:'https://www.atm-reparaturzentrum.de' },


  ];
}
