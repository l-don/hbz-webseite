import { Injectable, signal } from '@angular/core';
import {CommentInterface} from "../types/comment.interface";


@Injectable({
  providedIn: 'root',
})
export class CommentsService {
  commentsSig = signal<CommentInterface[]>([]);

  addComment(author: string, message: string, id: string): void {
    const newComment: CommentInterface = {
      author,
      message,
      id,
    };
    this.commentsSig.update((comments) => [...comments, newComment]);
  }

  // Other CRUD operations as needed
}
