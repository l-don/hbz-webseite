import { Component } from '@angular/core';
import {RouterLink, RouterOutlet} from '@angular/router';
import {MainLayoutComponent} from "./main-layout/main-layout.component";
import {MatSidenav, MatSidenavContainer, MatSidenavModule} from "@angular/material/sidenav";
import {MatIcon} from "@angular/material/icon";
import {AsyncPipe, NgIf} from "@angular/common";
import {MatAnchor, MatButtonModule, MatIconButton} from "@angular/material/button";
import {MatMenu, MatMenuItem, MatMenuTrigger} from "@angular/material/menu";
import { HeaderComponent } from './header/header.component';
import {FooterComponent} from "./footer/footer.component";
import { RecaptchaModule } from 'ng-recaptcha';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MainLayoutComponent, RouterLink, MatSidenavContainer, MatSidenav, MatIcon, AsyncPipe, MatIconButton, NgIf, MatAnchor, MatSidenavModule, MatButtonModule, MatMenuTrigger, MatMenu, MatMenuItem,HeaderComponent, FooterComponent, RecaptchaModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

}

