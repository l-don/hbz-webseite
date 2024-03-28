import { Component } from '@angular/core';
import {RouterLink, RouterOutlet} from '@angular/router';
import {MainLayoutComponent} from "./main-layout/main-layout.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MainLayoutComponent, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'hbz-webseite';
}
