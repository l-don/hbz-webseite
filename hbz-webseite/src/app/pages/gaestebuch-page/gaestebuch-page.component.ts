import { Component } from '@angular/core';
import {BannerImgComponent} from "../../banner-img/banner-img.component";
import {CommentsComponent} from "../../comments/comments.component";
import {CommentsService} from "../../services/comments.service";
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'app-gaestebuch-page',
  standalone: true,
  imports: [
    BannerImgComponent,
    CommentsComponent,
    FormsModule
  ],
  templateUrl: './gaestebuch-page.component.html',
  styleUrl: './gaestebuch-page.component.scss'
})
export class GaestebuchPageComponent {
  newCommentAuthor: string = '';
  newCommentMessage: string = '';

  constructor(private commentsService: CommentsService) {}

  submitComment() {
    if (this.newCommentAuthor && this.newCommentMessage) {
      // Add the new comment using the service
      this.commentsService.addComment(
        this.newCommentAuthor,
        this.newCommentMessage
      );

      // Clear the input fields after submission
      this.newCommentAuthor = '';
      this.newCommentMessage = '';
    } else {
      alert('Bitte füllen Sie sowohl den Namen als auch die Nachricht aus.');
    }
  }
}
