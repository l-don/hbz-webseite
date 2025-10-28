import { Injectable, inject } from '@angular/core';
import { Firestore, doc, writeBatch } from '@angular/fire/firestore';

export interface RegistrationPayload {
  event: { id: string };
  registration: {
    id: string;
    event_id: string;
    email: string;
    phone: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    comment: string;
  };
  people: Array<{
    id: string;
    registration_id: string;
    firstname: string;
    lastname: string;
    birthday: string | null | '';
    address: string;
    comment: string;
    flags: number;
  }>;
  items: Array<{
    id: string;
    registration_id: string;
    type_id: string;
    comment: string;
  }>;
}

@Injectable({ providedIn: 'root' })
export class RegistrationFirebaseService {
  private readonly firestore = inject(Firestore);

  async submit(payload: RegistrationPayload): Promise<void> {
    const batch = writeBatch(this.firestore);

    const regRef = doc(this.firestore, 'registrations', payload.registration.id);
    batch.set(regRef, payload.registration);

    for (const person of payload.people) {
      const pRef = doc(this.firestore, 'people', person.id);
      batch.set(pRef, person as any);
    }

    for (const item of payload.items) {
      const iRef = doc(this.firestore, 'items', item.id);
      batch.set(iRef, item as any);
    }

    await batch.commit();
  }
}
