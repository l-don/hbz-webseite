import { Component, Input, OnInit } from '@angular/core';
import { SlideshowComponent } from "../slideshow/slideshow.component";

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
  text1: string = '';
  text2: string = '';

  ngOnInit() {
    this.loadContent();
  }

  async loadContent() {
    const content1 = await this.getContentFromFolder(this.folder1);
    this.images1 = content1.images;
    this.text1 = content1.text;

    const content2 = await this.getContentFromFolder(this.folder2);
    this.images2 = content2.images;
    this.text2 = content2.text;
  }

  async getContentFromFolder(folder: string): Promise<{ images: string[], text: string }> {
    const response = await fetch(`${folder}/images.json`);
    const data = await response.json();
    const images = data.images.map((image: string) => `${folder}/${image}`);
    const text = data.text;
    return { images, text };
  }
}

