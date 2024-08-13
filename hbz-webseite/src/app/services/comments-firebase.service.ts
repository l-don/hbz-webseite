import {inject, Injectable} from '@angular/core';
import {collection, collectionData, Firestore} from "@angular/fire/firestore";
import {Observable} from "rxjs";
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
}
