import {Component, inject, OnInit} from '@angular/core';
import {CommentsService} from "../services/comments.service";
import {CommentsFirebaseService} from "../services/comments-firebase.service";

@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [],
  templateUrl: './comments.component.html',
  styleUrl: './comments.component.scss'
})
export class CommentssComponent implements OnInit {
  commentsService = inject(CommentsService);
  commentsFirebaseService = inject(CommentsFirebaseService);

  ngOnInit(): void {
    this.commentsFirebaseService.getComments().subscribe((comments) => {
      //use comments here
    });
  }
}
