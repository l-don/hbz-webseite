import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-banner-img',
  standalone: true,
  templateUrl: './banner-img.component.html',
  styleUrls: ['./banner-img.component.scss']
})
export class BannerImgComponent {
  @Input() imgSrc: string = "../../assets/Bannerfoto_Anmeldung.jpg";
}

