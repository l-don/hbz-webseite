import {Component, Input, OnInit} from '@angular/core';
import {SlideshowComponent} from "../slideshow/slideshow.component";


@Component({
  selector: 'app-dual-slideshow',
  templateUrl: './dual-slideshow.component.html',
  styleUrls: ['./dual-slideshow.component.scss'],
  standalone: true,
  imports: [SlideshowComponent]
})


export class DualSlideshowComponent implements OnInit {
  @Input() folder1: string = '';
  @Input() folder2: string = '';
  images1: string[] = [];
  images2: string[] = [];

  ngOnInit() {
    this.loadImages();
  }

  loadImages() {
    this.images1 = this.getImagesFromFolder(this.folder1, 'Abschnitt2_', 9);
    this.images2 = this.getImagesFromFolder(this.folder2, 'Abschnitt3_', 6);
  }

  getImagesFromFolder(folder: string, prefix: string, count: number): string[] {
    let images: string[] = [];
    for (let i = 1; i <= count; i++) {
      images.push(`${folder}/${prefix}${i}.jpg`);
    }
    return images;
  }
}
