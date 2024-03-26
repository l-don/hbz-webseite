import {Component, OnInit} from '@angular/core';
import {RouterLink} from "@angular/router";

import {NgForOf, NgOptimizedImage} from "@angular/common";

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [
    RouterLink,
    NgForOf,
    NgOptimizedImage
  ],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.scss'
})
export class MainPageComponent implements OnInit {

  slides: any[] = new Array(3).fill({id: -1, src: '', title: '', subtitle: ''});

  constructor() { }
  ngOnInit(): void {
    this.slides[0] = {
      src: '../assets/slideshow-1.png',
    };
    this.slides[1] = {
      src: '../assets/slideshow-2.png',
    }
    this.slides[2] = {
      src: '../assets/slideshow-3.png',
    }
  }

}
