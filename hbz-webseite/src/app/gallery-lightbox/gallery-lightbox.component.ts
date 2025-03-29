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
  public years: string[] = Array.from({ length: 18 }, (_, i) => (2024 - i).toString()); // Initialize with years from 2007 to 2024
  public selectedYear: string = '2024'; // Default to the latest year
  private imagesByYear: { [year: string]: string[] } = {};

  constructor(private _lightbox: Lightbox, private http: HttpClient) { }

  ngOnInit(): void {
    // Make sure years are always available regardless of HTTP request success
    this.selectedYear = this.years[0];
    
    // Add better error handling for the HTTP request
    this.http.get<{ [year: string]: string[] }>('./assets/image-list.json')
      .subscribe({
        next: (data) => {
          console.log('Successfully loaded image data:', Object.keys(data));
          this.imagesByYear = data;
          this.updateGallery();
        },
        error: (error) => {
          console.error('Error loading image-list.json:', error);
          // Initialize with empty arrays to prevent errors
          this.years.forEach(year => {
            this.imagesByYear[year] = [];
          });
          this.updateGallery();
        }
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
