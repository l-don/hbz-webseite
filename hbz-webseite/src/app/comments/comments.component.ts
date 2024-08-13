import {Component, inject, OnInit} from '@angular/core';
import {CommentsService} from "../services/comments.service";
import {CommentsFirebaseService} from "../services/comments-firebase.service";
import {NgForOf} from "@angular/common";

@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [
    NgForOf
  ],
  templateUrl: './comments.component.html',
  styleUrl: './comments.component.scss'
})
export class CommentsComponent implements OnInit {
  commentsService = inject(CommentsService);
  commentsFirebaseService = inject(CommentsFirebaseService);

  ngOnInit(): void {
    this.commentsFirebaseService.getComments().subscribe((comments) => {
      //use comments here
      this.commentsService.commentsSig.set(comments);
    });
    this.commentsService.addComment('John Doe', 'This is a great guestbook!', '1');
    this.commentsService.addComment('Jane Smith', 'Loved visiting your site!', '2');
  }
}
