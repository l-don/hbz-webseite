import {Component, Input} from '@angular/core';
import {NgForOf} from "@angular/common";
interface BildMitText {
  src: string;
  alt: string;
  desc: string;
}
@Component({
  selector: 'app-drei-bilder',
  standalone: true,
  imports: [
    NgForOf
  ],
  templateUrl: './drei-bilder.component.html',
  styleUrl: './drei-bilder.component.scss'
})


export class DreiBilderComponent {
  @Input() bilder: BildMitText[] = [];
}
