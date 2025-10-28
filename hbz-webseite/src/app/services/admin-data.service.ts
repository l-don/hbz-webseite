import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, query, where, getDocs, writeBatch, doc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface RegistrationDoc {
  id: string;
  event_id: string;
  email: string;
  phone: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  comment: string;
}

export interface PersonDoc {
  id: string;
  registration_id: string;
  firstname: string;
  lastname: string;
  birthday?: string;
  address?: string;
  comment?: string;
  flags: number;
}

export interface ItemDoc {
  id: string;
  registration_id: string;
  type_id: string;
  comment?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminDataService {
  private readonly firestore = inject(Firestore);

  registrations$(): Observable<RegistrationDoc[]> {
    const coll = collection(this.firestore, 'registrations');
    return collectionData(coll, { idField: 'id' }) as Observable<RegistrationDoc[]>;
  }

  people$(): Observable<PersonDoc[]> {
    const coll = collection(this.firestore, 'people');
    return collectionData(coll, { idField: 'id' }) as Observable<PersonDoc[]>;
  }

  items$(): Observable<ItemDoc[]> {
    const coll = collection(this.firestore, 'items');
    return collectionData(coll, { idField: 'id' }) as Observable<ItemDoc[]>;
  }

  async deleteRegistrationCascade(registrationId: string): Promise<void> {
    const batch = writeBatch(this.firestore);

    // Delete registration
    batch.delete(doc(this.firestore, 'registrations', registrationId));

    // Delete related people
    const peopleQ = query(collection(this.firestore, 'people'), where('registration_id', '==', registrationId));
    const peopleSnap = await getDocs(peopleQ);
    peopleSnap.forEach((p) => batch.delete(doc(this.firestore, 'people', p.id)));

    // Delete related items
    const itemsQ = query(collection(this.firestore, 'items'), where('registration_id', '==', registrationId));
    const itemsSnap = await getDocs(itemsQ);
    itemsSnap.forEach((i) => batch.delete(doc(this.firestore, 'items', i.id)));

    await batch.commit();
  }
}
