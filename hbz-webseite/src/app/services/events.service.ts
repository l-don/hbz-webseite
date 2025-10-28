import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, deleteDoc, doc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface EventModel {
  id?: string;
  title: string;
  deadline?: string; // YYYY-MM-DD
  begin?: string;    // ISO datetime
  end?: string;      // ISO datetime
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class EventsService {
  private readonly firestore = inject(Firestore);
  private readonly coll = collection(this.firestore, 'events');

  list$(): Observable<EventModel[]> {
    return collectionData(this.coll, { idField: 'id' }) as Observable<EventModel[]>;
  }

  async add(ev: Omit<EventModel, 'id'>): Promise<string> {
    const ref = await addDoc(this.coll, ev);
    return ref.id;
  }

  async remove(id: string): Promise<void> {
    return deleteDoc(doc(this.firestore, 'events', id));
    }
}

