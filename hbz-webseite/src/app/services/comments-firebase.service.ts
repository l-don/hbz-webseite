import {inject, Injectable} from '@angular/core';
import {addDoc, collection, collectionData, Firestore} from "@angular/fire/firestore";
import {from, Observable} from "rxjs";
import {CommentInterface} from "../types/comment.interface";

@Injectable({
  providedIn: 'root'
})
export class CommentsFirebaseService {
  firestore = inject(Firestore);
  commentsCollection = collection(this.firestore, 'comments');

  getComments(): Observable<CommentInterface[]> {
    return collectionData(this.commentsCollection, {
      idField: 'id',
    }) as Observable<CommentInterface[]>;
  }

  addComment(comment: Omit<CommentInterface, 'id'>): Observable<string> {
    const promise = addDoc(this.commentsCollection, comment).then(
      (response) => response.id
    );
    return from(promise);
  }
}
