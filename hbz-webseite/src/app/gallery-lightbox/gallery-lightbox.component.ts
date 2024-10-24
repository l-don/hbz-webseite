import { Component, OnInit } from '@angular/core';
import {Lightbox, LightboxModule} from 'ngx-lightbox';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import {CommonModule, NgForOf} from "@angular/common";
@Component({
  selector: 'app-gallery-lightbox',
  standalone: true,
  imports: [
    NgForOf,
    CommonModule, LightboxModule, HttpClientModule
  ],
  templateUrl: './gallery-lightbox.component.html',
  styleUrl: './gallery-lightbox.component.scss'
})
export class GalleryLightboxComponent implements OnInit {
  public albums: Array<any> = [];

  constructor(private _lightbox: Lightbox, private http: HttpClient) { }

  ngOnInit(): void {
    this.http.get<string[]>('/assets/image-list.json').subscribe(images => {
      this.albums = images.map(image => ({
        src: image,
        thumb: image
      }));
    });
  }

  open(index: number): void {
    this._lightbox.open(this.albums, index);
  }

  close(): void {
    this._lightbox.close();
  }
}
