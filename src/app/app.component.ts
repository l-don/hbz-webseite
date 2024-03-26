import { Component } from '@angular/core';
import {RouterLink, RouterOutlet} from '@angular/router';
import {MainLayoutComponent} from "./main-layout/main-layout.component";
import {CarouselComponent} from "@coreui/angular";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MainLayoutComponent, RouterLink, CarouselComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'hbz-webseite';
}
