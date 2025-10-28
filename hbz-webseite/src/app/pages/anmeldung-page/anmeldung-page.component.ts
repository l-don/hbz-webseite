import { Component } from '@angular/core';
import {BannerImgComponent} from "../../banner-img/banner-img.component";
import { RouterModule } from '@angular/router';
import { AsyncPipe, NgIf, NgFor } from '@angular/common';
import { EventsService, EventModel } from '../../services/events.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-anmeldung-page',
  standalone: true,
  imports: [
    BannerImgComponent,
    RouterModule,
    AsyncPipe,
    NgIf,
    NgFor
  ],
  templateUrl: './anmeldung-page.component.html',
  styleUrl: './anmeldung-page.component.scss'
})
export class AnmeldungPageComponent {
  events$: Observable<EventModel[]> = this.eventsService.list$();

  constructor(private eventsService: EventsService) {}
}
