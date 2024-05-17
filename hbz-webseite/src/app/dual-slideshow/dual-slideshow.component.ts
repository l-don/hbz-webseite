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

  async loadImages() {
    this.images1 = await this.getImagesFromFolder(this.folder1);
    this.images2 = await this.getImagesFromFolder(this.folder2);
  }

  async getImagesFromFolder(folder: string): Promise<string[]> {
    const response = await fetch(`${folder}/images.json`);
    const data = await response.json();
    return data.images.map((image: string) => `${folder}/${image}`);
  }
}
