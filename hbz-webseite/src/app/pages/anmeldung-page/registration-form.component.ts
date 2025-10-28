import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RegistrationFirebaseService } from '../../services/registration-firebase.service';

// Simple UUID util (uses browser crypto when available)
function uuid(): string {
  const g = (globalThis as any);
  if (g.crypto?.randomUUID) {
    return g.crypto.randomUUID();
  }
  // Fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface EventModel {
  id: string;
  title: string;
  deadline?: string;
  begin?: string;
  end?: string;
  description?: string;
}

interface ItemType {
  id: string; // slug or UUID
  title: string;
  price: number;
}

@Component({
  selector: 'app-registration-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './registration-form.component.html'
})
export class RegistrationFormComponent implements OnInit {
  // Catalog data (phase 1: hardcoded; can later be loaded from Firestore)
  readonly events: EventModel[] = [
    {
      id: 'hbz-2026',
      title: 'Historischer Besiedlungszug 2026',
      deadline: '2026-05-15',
      begin: '2026-07-04T08:00:00Z',
      end: '2026-07-12T18:00:00Z',
      description: 'Anmeldung für den Besiedlungszug 2026'
    }
  ];

  readonly itemTypes: ItemType[] = [
    { id: 'dog', title: 'Hund', price: 50 },
    { id: 'tshirt', title: 'T-Shirt', price: 20 },
    { id: 'wagon', title: 'Wagenplatz', price: 100 }
  ];

  form: FormGroup;

  constructor(private fb: FormBuilder, private regService: RegistrationFirebaseService) {
    this.form = this.fb.group({
      event_id: new FormControl(this.events[0]?.id || '', { nonNullable: true, validators: [Validators.required] }),
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      emergency_contact: ['', [Validators.required]],
      comment: ['', [Validators.required]],
      people: this.fb.array([]),
      items: this.fb.array([])
    });
  }

  ngOnInit(): void {
    if (this.people.length === 0) {
      this.addPerson();
    }
  }

  // Helpers to access arrays
  get people(): FormArray<FormGroup> {
    return this.form.get('people') as FormArray<FormGroup>;
  }

  get items(): FormArray<FormGroup> {
    return this.form.get('items') as FormArray<FormGroup>;
  }

  // Person flags: bit 0 vegetarian, bit 1 staff, bit 2 orga
  private computeFlags(p: FormGroup): number {
    const vegetarian = !!p.get('vegetarian')?.value;
    const staff = !!p.get('staff')?.value;
    const orga = !!p.get('orga')?.value;
    let flags = 0;
    if (vegetarian) flags |= 1 << 0; // 1
    if (staff) flags |= 1 << 1;      // 2
    if (orga) flags |= 1 << 2;       // 4
    return flags >>> 0; // ensure uint
  }

  private createPersonGroup(): FormGroup {
    return this.fb.group({
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      birthday: [''], // optional YYYY-MM-DD
      address: [''],
      comment: [''],
      vegetarian: [false],
      staff: [false],
      orga: [false]
    });
  }

  addPerson(): void {
    this.people.push(this.createPersonGroup());
  }

  removePerson(index: number): void {
    this.people.removeAt(index);
  }

  private createItemGroup(): FormGroup {
    return this.fb.group({
      type_id: ['', Validators.required],
      comment: ['']
    });
  }

  addItem(): void {
    this.items.push(this.createItemGroup());
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  get canSubmit(): boolean {
    return this.form.valid && this.people.length > 0;
  }

  async submit(): Promise<void> {
    if (!this.canSubmit) {
      this.form.markAllAsTouched();
      return;
    }

    const registrationId = uuid();
    const eventId = this.form.get('event_id')!.value as string;

    const payload = {
      event: { id: eventId },
      registration: {
        id: registrationId,
        event_id: eventId,
        email: this.form.get('email')!.value,
        phone: this.form.get('phone')!.value,
        emergency_contact: this.form.get('emergency_contact')!.value,
        comment: this.form.get('comment')!.value
      },
      people: this.people.controls.map((ctrl) => {
        const personId = uuid();
        return {
          id: personId,
          registration_id: registrationId,
          firstname: ctrl.get('firstname')!.value,
          lastname: ctrl.get('lastname')!.value,
          birthday: ctrl.get('birthday')!.value || '',
          address: ctrl.get('address')!.value || '',
          comment: ctrl.get('comment')!.value || '',
          flags: this.computeFlags(ctrl)
        };
      }),
      items: this.items.controls.map((ctrl) => {
        return {
          id: uuid(),
          registration_id: registrationId,
          type_id: ctrl.get('type_id')!.value,
          comment: ctrl.get('comment')!.value || ''
        };
      })
    };

    console.log('Registration payload', payload);

    try {
      await this.regService.submit(payload as any);
      alert('Anmeldung gespeichert!');
      this.form.reset({
        event_id: eventId,
        email: '',
        phone: '',
        emergency_contact: '',
        comment: ''
      });
      this.people.clear();
      this.items.clear();
      this.addPerson();
    } catch (err) {
      console.error(err);
      alert('Fehler beim Speichern der Anmeldung. Bitte erneut versuchen.');
    }
  }
}
