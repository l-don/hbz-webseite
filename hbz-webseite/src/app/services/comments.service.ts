import { Injectable, signal } from '@angular/core';
import {CommentInterface} from "../types/comment.interface";
import {CommentsFirebaseService} from "./comments-firebase.service";


@Injectable({
  providedIn: 'root',
})
export class CommentsService {
  commentsSig = signal<CommentInterface[]>([]);

  constructor(private commentsFirebaseService: CommentsFirebaseService) {}

  addComment(author: string, message: string): void {
    const newComment = { author, message };
    this.commentsFirebaseService.addComment(newComment).subscribe((id) => {
      const fullComment: CommentInterface = { ...newComment, id };
      this.commentsSig.update((comments) => [...comments, fullComment]);
    });
  }
}
