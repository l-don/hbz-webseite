import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RegistrationFirebaseService } from '../../services/registration-firebase.service';
import { BannerImgComponent } from '../../banner-img/banner-img.component';
import { EventsService, EventModel } from '../../services/events.service';
import { Observable } from 'rxjs';
import {
  RegistrationApiService,
  RegistrationApiPayload
} from '../../services/registration-api.service';

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

@Component({
  selector: 'app-registration-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, BannerImgComponent],
  templateUrl: './registration-form.component.html',
  styleUrl: './registration-form.component.scss'
})
export class RegistrationFormComponent implements OnInit {
  // Load events from Firestore (später evtl. auf MySQL-API umstellen)
  events$: Observable<EventModel[]>;

  // Nur Hund und Pferd mit 0€
  readonly itemTypes = [
    { id: 'dog', title: 'Hund', price: 0 },
    { id: 'horse', title: 'Pferd', price: 0 }
  ];

  /**
   * Mapping von Formular-Item-Typen ('dog', 'horse')
   * auf die entsprechenden Article.id-Werte in deiner MySQL-Datenbank.
   * DIESE IDs MUSST DU AN DEINE DB ANPASSEN!
   *
   * Beispiel:
   * SELECT id, description FROM Article;
   * Hund  -> AAAA... (hier eintragen)
   * Pferd -> BBBB... (hier eintragen)
   */
  private readonly articleIdByType: Record<string, string> = {
    dog: '5f5c3e10-1b2a-4000-9000-000000000001',   // Hund aus Article-Tabelle
    horse: '5f5c3e10-1b2a-4000-9000-000000000002'  // Pferd aus Article-Tabelle
  };

  form: FormGroup;
  submitted = false;
  isSaving = false;
  hasEvents = false;

  constructor(
    private fb: FormBuilder,
    private regService: RegistrationFirebaseService,  // aktuell ungenutzt, kann später entfernt werden
    private eventsService: EventsService,
    private apiService: RegistrationApiService        // NEU: spricht mit Node/MySQL-Backend
  ) {
    this.events$ = this.eventsService.list$();
    this.form = this.fb.group({
      event_id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      emergency_contact_name: ['', [Validators.required]],
      emergency_contact_phone: ['', [Validators.required]],
      comment: [''],
      people: this.fb.array([]),
      items: this.fb.array([])
    });
  }

  ngOnInit(): void {
    if (this.people.length === 0) {
      this.addPerson();
    }
    // Preselect first event if available and set hasEvents flag
    this.events$.subscribe((evs) => {
      this.hasEvents = !!(evs && evs.length > 0);
      const current = this.form.get('event_id')!.value as string;
      if (!current && this.hasEvents) {
        this.form.get('event_id')!.setValue(evs[0].id);
      }
    });
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

  private createPersonGroup(isPrimary = false): FormGroup {
    const group = this.fb.group({
      firstname: [''],
      lastname: [''],
      birthday: [''],
      address: [''],
      comment: [''],
      vegetarian: [false],
      staff: [false],
      orga: [false]
    });
    this.applyPersonValidators(group, isPrimary);
    return group;
  }

  private applyPersonValidators(group: FormGroup, isPrimary: boolean) {
    const required = isPrimary ? [Validators.required] : [];
    group.get('firstname')!.setValidators(required);
    group.get('lastname')!.setValidators(required);
    group.get('birthday')!.setValidators(isPrimary ? [Validators.required] : []);
    group.get('address')!.setValidators(isPrimary ? [Validators.required] : []);

    group.get('firstname')!.updateValueAndValidity({ emitEvent: false });
    group.get('lastname')!.updateValueAndValidity({ emitEvent: false });
    group.get('birthday')!.updateValueAndValidity({ emitEvent: false });
    group.get('address')!.updateValueAndValidity({ emitEvent: false });
  }

  private refreshPrimaryPersonValidators() {
    this.people.controls.forEach((ctrl, idx) => this.applyPersonValidators(ctrl, idx === 0));
  }

  addPerson(): void {
    const isPrimary = this.people.length === 0;
    this.people.push(this.createPersonGroup(isPrimary));
  }

  removePerson(index: number): void {
    this.people.removeAt(index);
    this.refreshPrimaryPersonValidators();
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
    const eventId = this.form.get('event_id')!.value as string;
    return this.hasEvents && !!eventId && this.form.valid && this.people.length > 0;
  }

  async submit(): Promise<void> {
    this.submitted = true;
    if (!this.canSubmit) {
      this.form.markAllAsTouched();
      this.refreshPrimaryPersonValidators();
      return;
    }

    this.isSaving = true;
    const registrationId = uuid();
    const eventId = this.form.get('event_id')!.value as string;

    // Ursprüngliches Firebase-Payload (falls du es noch brauchst)
    const firebasePayload = {
      event: { id: eventId },
      registration: {
        id: registrationId,
        event_id: eventId,
        email: this.form.get('email')!.value,
        phone: this.form.get('phone')!.value,
        emergency_contact_name: this.form.get('emergency_contact_name')!.value,
        emergency_contact_phone: this.form.get('emergency_contact_phone')!.value,
        comment: this.form.get('comment')!.value || ''
      },
      people: this.people.controls.map((ctrl) => {
        const personId = uuid();
        return {
          id: personId,
          registration_id: registrationId,
          firstname: ctrl.get('firstname')!.value || '',
          lastname: ctrl.get('lastname')!.value || '',
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

    console.log('Firebase-style registration payload', firebasePayload);

    // === Mapping zum Backend-Payload (MySQL) ===

    // Primäre Person = erste Person im Array
    const primaryPerson = this.people.controls[0];
    const primaryFirstname = primaryPerson.get('firstname')!.value || '';
    const primaryLastname = primaryPerson.get('lastname')!.value || '';
    const primaryName = (primaryFirstname + ' ' + primaryLastname).trim();

    const backendPayload: RegistrationApiPayload = {
      eventId: eventId,
      registration: {
        name: primaryName || this.form.get('emergency_contact_name')!.value || 'Unbekannt',
        address: primaryPerson.get('address')!.value || '',
        email: this.form.get('email')!.value,
        phone: this.form.get('phone')!.value,
        emergency: this.form.get('emergency_contact_phone')!.value,
        comment: this.form.get('comment')!.value || ''
      },
      persons: this.people.controls.map((ctrl) => {
        const firstname = ctrl.get('firstname')!.value || '';
        const lastname = ctrl.get('lastname')!.value || '';
        const name = (firstname + ' ' + lastname).trim();

        const flag_vegetarian = !!ctrl.get('vegetarian')!.value;
        const staff = !!ctrl.get('staff')!.value;
        const orga = !!ctrl.get('orga')!.value;
        let flag_org = 0;
        // einfache Abbildung: wenn staff oder orga gesetzt, dann 1, sonst 0
        if (staff || orga) flag_org = 1;

        return {
          name,
          birthday: ctrl.get('birthday')!.value || '',
          address: ctrl.get('address')!.value || '',
          comment: ctrl.get('comment')!.value || '',
          flag_vegetarian,
          flag_organization: flag_org
        };
      }),
      items: this.items.controls.map((ctrl) => {
        const typeId = ctrl.get('type_id')!.value as string;
        const articleId = this.articleIdByType[typeId];

        return {
          articleId,
          comment: ctrl.get('comment')!.value || ''
        };
      })
    };

    console.log('Backend (MySQL) payload', backendPayload);

    try {
      // 1) An MySQL-Backend senden
      const result = await this.apiService.submit(backendPayload);
      console.log('Backend result', result);

      // 2) Optional zusätzlich weiter in Firebase speichern:
      // await this.regService.submit(firebasePayload as any);

      alert('Anmeldung gespeichert!');
      this.submitted = false;
      this.form.reset({
        event_id: eventId,
        email: '',
        phone: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        comment: ''
      });
      this.people.clear();
      this.items.clear();
      this.addPerson();
    } catch (err) {
      console.error('Fehler beim Speichern der Anmeldung', err);
      alert('Fehler beim Speichern der Anmeldung. Bitte erneut versuchen.');
    } finally {
      this.isSaving = false;
    }
  }
}
