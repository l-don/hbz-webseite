import { Component } from '@angular/core';
import {BannerImgComponent} from "../../banner-img/banner-img.component";
import {CommentsComponent} from "../../comments/comments.component";
import {CommentsService} from "../../services/comments.service";
import {FormsModule} from "@angular/forms";
import {RecaptchaModule} from "ng-recaptcha";
import {NgIf} from "@angular/common";

@Component({
  selector: 'app-gaestebuch-page',
  standalone: true,
  imports: [
    BannerImgComponent,
    CommentsComponent,
    FormsModule,
    RecaptchaModule,
    NgIf
  ],
  templateUrl: './gaestebuch-page.component.html',
  styleUrl: './gaestebuch-page.component.scss'
})
export class GaestebuchPageComponent {
  newCommentAuthor: string = '';
  newCommentMessage: string = '';
  captchaVerified: boolean = false;

  constructor(private commentsService: CommentsService) {}

  onCaptchaResolved(captchaResponse: string | null) {
    if (captchaResponse) {
      this.captchaVerified = true;
      // Optionally, send the captchaResponse to your server for verification
    }
  }

  submitComment() {
    if (this.newCommentAuthor && this.newCommentMessage && this.captchaVerified) {
      this.commentsService.addComment(
        this.newCommentAuthor,
        this.newCommentMessage
      );

      // Clear the input fields after submission
      this.newCommentAuthor = '';
      this.newCommentMessage = '';
      this.captchaVerified = false;  // Reset captcha verification
    } else {
      alert('Bitte füllen Sie sowohl den Namen als auch die Nachricht aus.');
    }
  }
}
