import { Component, Input, OnInit, ElementRef, Renderer2, Inject, PLATFORM_ID, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-instagram-feed',
  standalone: true,
  templateUrl: './instagram-feed.component.html',
  styleUrl: './instagram-feed.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class InstagramFeedComponent implements OnInit {
  /**
   * Replace with your actual Behold Feed ID from behold.so
   */
  @Input() feedId: string = '';

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Check if Behold script is already loaded to avoid duplicate script tags
      if (!document.querySelector('script[src="https://w.behold.so/widget.js"]')) {
        const script = this.renderer.createElement('script');
        script.type = 'module';
        script.src = 'https://w.behold.so/widget.js';
        this.renderer.appendChild(document.body, script);
      }
    }
  }
}
