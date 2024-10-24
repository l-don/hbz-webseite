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
  public years: string[] = [];
  public selectedYear: string = '';
  private imagesByYear: { [year: string]: string[] } = {};

  constructor(private _lightbox: Lightbox, private http: HttpClient) { }

  ngOnInit(): void {
    this.http.get<{ [year: string]: string[] }>('assets/image-list.json').subscribe(data => {
      this.imagesByYear = data;
      this.years = Object.keys(data).sort((a, b) => Number(b) - Number(a)); // Jahre sortieren
      this.selectedYear = this.years[0]; // Standardmäßig das neueste Jahr auswählen
      this.updateGallery();
    });
  }

  updateGallery(): void {
    const images = this.imagesByYear[this.selectedYear] || [];
    this.albums = images.map(image => ({
      src: image,
      thumb: image
    }));
  }

  onYearChange(year: string): void {
    this.selectedYear = year;
    this.updateGallery();
  }

  open(index: number): void {
    this._lightbox.open(this.albums, index);
  }

  close(): void {
    this._lightbox.close();
  }
}
