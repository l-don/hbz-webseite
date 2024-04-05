import { Component } from '@angular/core';
import {RouterLink, RouterOutlet} from '@angular/router';
import {MainLayoutComponent} from "./main-layout/main-layout.component";
import {MatSidenav, MatSidenavContainer, MatSidenavModule} from "@angular/material/sidenav";
import {MatIcon} from "@angular/material/icon";
import {map, Observable} from "rxjs";
import {BreakpointObserver, Breakpoints} from "@angular/cdk/layout";
import {AsyncPipe, NgIf} from "@angular/common";
import {MatAnchor, MatButtonModule, MatIconButton} from "@angular/material/button";
import {MatMenu, MatMenuItem, MatMenuTrigger} from "@angular/material/menu";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MainLayoutComponent, RouterLink, MatSidenavContainer, MatSidenav, MatIcon, AsyncPipe, MatIconButton, NgIf, MatAnchor, MatSidenavModule, MatButtonModule, MatMenuTrigger, MatMenu, MatMenuItem],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'hbz-webseite';
  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches)
    );

  constructor(private breakpointObserver: BreakpointObserver) {}
}
