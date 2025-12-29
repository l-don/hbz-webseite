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
import { EventsService } from '../../services/events.service';
import {
  RegistrationApiService,
  RegistrationApiPayload,
  OpenEvent,
  ItemArticle,
  PriceCheckResult
} from '../../services/registration-api.service';

@Component({
  selector: 'app-registration-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, BannerImgComponent],
  templateUrl: './registration-form.component.html',
  styleUrl: './registration-form.component.scss'
})
export class RegistrationFormComponent implements OnInit {
  // Load events from backend API instead of Firestore
  events: OpenEvent[] = [];
  itemArticles: ItemArticle[] = [];

  form: FormGroup;
  submitted = false;
  isSaving = false;
  hasEvents = false;

  // Two-step flow
  currentStep: 'form' | 'overview' = 'form';
  priceCheckResults: PriceCheckResult[] = [];
  totalPrice = 0;

  constructor(
    private fb: FormBuilder,
    private regService: RegistrationFirebaseService, // aktuell ungenutzt, kann später entfernt werden
    private eventsService: EventsService,
    private apiService: RegistrationApiService
  ) {
    this.form = this.fb.group({
      event_id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),

      // Buchungsdaten (Ersteller der Registrierung)
      booking_firstname: ['', [Validators.required]],
      booking_lastname: ['', [Validators.required]],
      booking_street: ['', [Validators.required]],
      booking_city: ['', [Validators.required]],
      booking_zip: ['', [Validators.required]],

      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      emergency_contact_name: ['', [Validators.required]],
      emergency_contact_phone: ['', [Validators.required]],
      comment: [''],

      // AGB / DSGVO
      agb_accepted: [false, [Validators.requiredTrue]],
      dsgvo_accepted: [false, [Validators.requiredTrue]],

      people: this.fb.array([]),
      items: this.fb.array([])
    });
  }

  private joinAddress(street: string, zip: string, city: string): string {
    const s = (street ?? '').trim();
    const z = (zip ?? '').trim();
    const c = (city ?? '').trim();

    const zipCity = [z, c].filter(Boolean).join(' ');
    return [s, zipCity].filter(Boolean).join(', ');
  }

  async ngOnInit(): Promise<void> {
    // Damit man nicht immer erst "Person hinzufügen" klicken muss legen wir direkt eine Person an
    if (this.people.length === 0) {
      this.addPerson();
    }

    // Fetch open events from backend
    try {
      this.events = await this.apiService.getOpenEvents();
      this.hasEvents = this.events.length > 0;

      // Das erste event in der Liste wird automatisch ausgewählt
      if (this.hasEvents) {
        this.form.get('event_id')!.setValue(this.events[0].id);
      }
    } catch (err) {
      console.error('Error fetching open events:', err);
      this.hasEvents = false;
    }

    // Fetch items from backend
    try {
      this.itemArticles = await this.apiService.getItems();
      console.log('Loaded item articles:', this.itemArticles);
    } catch (err) {
      console.error('Error fetching items:', err);
      this.itemArticles = [];
    }
  }

  // Hilfsmethoden, erlauben this.people und this.items anstatt this.form.get(...) as FormArray<FormGroup>
  get people(): FormArray<FormGroup> {
    return this.form.get('people') as FormArray<FormGroup>;
  }

  get items(): FormArray<FormGroup> {
    return this.form.get('items') as FormArray<FormGroup>;
  }

  get canSubmit(): boolean {
    return (
      this.form.get('agb_accepted')?.value === true &&
      this.form.get('dsgvo_accepted')?.value === true
    );
  }

  private createPersonGroup(): FormGroup {
    const group = this.fb.group({
      firstname: [''],
      lastname: [''],
      birthday: [''],
      street: [''],
      city: [''],
      zip: [''],
      comment: [''],
      vegetarian: [false],
      // staff entfernt
      orga: [false]
    });
    this.applyPersonValidators(group);
    return group;
  }

  private applyPersonValidators(group: FormGroup) {
    const required = [Validators.required];

    group.get('firstname')!.setValidators(required);
    group.get('lastname')!.setValidators(required);
    group.get('birthday')!.setValidators(required);
    group.get('street')!.setValidators(required);
    group.get('city')!.setValidators(required);
    group.get('zip')!.setValidators(required);

    group.get('firstname')!.updateValueAndValidity({ emitEvent: false });
    group.get('lastname')!.updateValueAndValidity({ emitEvent: false });
    group.get('birthday')!.updateValueAndValidity({ emitEvent: false });
    group.get('street')!.updateValueAndValidity({ emitEvent: false });
    group.get('city')!.updateValueAndValidity({ emitEvent: false });
    group.get('zip')!.updateValueAndValidity({ emitEvent: false });
  }

  private refreshAllPersonValidators() {
    this.people.controls.forEach((ctrl) => this.applyPersonValidators(ctrl));
  }

  addPerson(): void {
    // Wichtig: NICHT submitted setzen und NICHT alles als touched markieren
    // Dadurch erscheinen die Pflichtfeld-Fehler nicht sofort beim Laden.
    this.people.push(this.createPersonGroup());
    this.refreshAllPersonValidators();
  }

  removePerson(index: number): void {
    this.people.removeAt(index);
    this.refreshAllPersonValidators();
  }

  private createItemGroup(): FormGroup {
    return this.fb.group({
      article_id: ['', Validators.required],
      comment: ['']
    });
  }

  addItem(): void {
    this.items.push(this.createItemGroup());
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  copyBookingDataToFirstPerson(): void {
    if (this.people.length === 0) return;

    const p0 = this.people.at(0);

    const bookingFirstname = this.form.get('booking_firstname')!.value || '';
    const bookingLastname = this.form.get('booking_lastname')!.value || '';
    const bookingStreet = this.form.get('booking_street')!.value || '';
    const bookingCity = this.form.get('booking_city')!.value || '';
    const bookingZip = this.form.get('booking_zip')!.value || '';

    p0.patchValue({
      firstname: bookingFirstname,
      lastname: bookingLastname,
      street: bookingStreet,
      city: bookingCity,
      zip: bookingZip
    });

    p0.markAsDirty();
    p0.markAsTouched();
  }

  get canProceed(): boolean {
    const eventId = this.form.get('event_id')!.value as string;

    // AGB/DSGVO zählen erst bei canSubmit (Step 2), nicht bei Step 1
    const controlsToIgnore = ['agb_accepted', 'dsgvo_accepted'];

    const step1Valid = Object.keys(this.form.controls)
      .filter((key) => !controlsToIgnore.includes(key))
      .every((key) => this.form.get(key)!.valid);

    return this.hasEvents && !!eventId && step1Valid && this.people.length > 0;
  }

  // Step 1: "Weiter" button - trigger price check
  async proceedToOverview(): Promise<void> {
    this.submitted = true;
    if (!this.canProceed) {
      this.form.markAllAsTouched();
      this.people.controls.forEach((p) => p.markAllAsTouched());
      this.refreshAllPersonValidators();
      return;
    }

    this.isSaving = true;

    try {
      const eventId = this.form.get('event_id')!.value as string;

      console.log('[proceedToOverview] Starting price check for eventId:', eventId);
      console.log('[proceedToOverview] Number of persons:', this.people.length);

      const priceCheckRequest = {
        eventId,
        persons: this.people.controls.map((ctrl, idx) => {
          const orga = !!ctrl.get('orga')!.value;
          const flag_organization = orga ? 1 : 0;
          const birthday = ctrl.get('birthday')!.value || '';

          console.log(`[proceedToOverview] Person ${idx + 1}:`, { birthday, flag_organization });

          return {
            birthday,
            flag_organization
          };
        })
      };

      console.log('[proceedToOverview] Sending price check request:', priceCheckRequest);

      // Get article prices for persons
      this.priceCheckResults = await this.apiService.priceCheck(priceCheckRequest);

      console.log('[proceedToOverview] Price check results:', this.priceCheckResults);

      // Calculate total price (person articles + items)
      let total = 0;

      // Add person article prices
      for (const result of this.priceCheckResults) {
        const price = parseFloat(result.price as any) || 0;
        console.log(`[proceedToOverview] Adding person price: ${price} from`, result);
        total += price;
      }

      // Add selected item prices
      for (const itemCtrl of this.items.controls) {
        const articleId = itemCtrl.get('article_id')!.value;
        const article = this.itemArticles.find((a) => a.id === articleId);
        if (article) {
          const price = parseFloat(article.price as any) || 0;
          console.log(`[proceedToOverview] Adding item price: ${price} from`, article);
          total += price;
        }
      }

      this.totalPrice = total;

      console.log('[proceedToOverview] Total price calculated:', this.totalPrice);
      console.log('[proceedToOverview] Number of price check results:', this.priceCheckResults.length);

      // Move to overview step
      this.currentStep = 'overview';

    } catch (err: any) {
      console.error('[proceedToOverview] Error during price check:', err);

      let errorMsg = 'Fehler beim Abrufen der Preise.';
      if (err.error?.details) errorMsg += '\nDetails: ' + err.error.details;
      if (err.error?.code) errorMsg += '\nCode: ' + err.error.code;

      alert(errorMsg + '\n\nBitte überprüfen Sie die Konsole für weitere Details.');
    } finally {
      this.isSaving = false;
    }
  }

  // Go back to form from overview
  backToForm(): void {
    this.currentStep = 'form';
  }

  // Step 2: "Absenden" button - submit registration
  async submitRegistration(): Promise<void> {
    this.isSaving = true;

    // Sicherheitscheck (auch wenn Button disabled ist)
    if (!this.canSubmit) {
      this.submitted = true;
      this.form.markAllAsTouched();
      this.people.controls.forEach((p) => p.markAllAsTouched());
      alert('Bitte akzeptieren Sie AGB und Datenschutzerklärung.');
      this.isSaving = false;
      return;
    }

    const eventId = this.form.get('event_id')!.value as string;

    // Registrierung wird aus Buchungsdaten erstellt (nicht mehr aus Person 1)
    const bookingFirstname = this.form.get('booking_firstname')!.value || '';
    const bookingLastname = this.form.get('booking_lastname')!.value || '';
    const bookingName = (bookingFirstname + ' ' + bookingLastname).trim();

    const bookingStreet = this.form.get('booking_street')!.value || '';
    const bookingCity = this.form.get('booking_city')!.value || '';
    const bookingZip = this.form.get('booking_zip')!.value || '';
    const bookingAddressJoined = this.joinAddress(bookingStreet, bookingZip, bookingCity);

    const emergencyName = (this.form.get('emergency_contact_name')!.value || '').trim();
    const emergencyPhone = (this.form.get('emergency_contact_phone')!.value || '').trim();

    const emergencyCombined =
      emergencyName && emergencyPhone
        ? `${emergencyName}: ${emergencyPhone}`
        : (emergencyName || emergencyPhone);

    const backendPayload: RegistrationApiPayload = {
      eventId: eventId,
      registration: {
        name: bookingName || this.form.get('emergency_contact_name')!.value || 'Unbekannt',
        address: bookingAddressJoined,
        email: this.form.get('email')!.value,
        phone: this.form.get('phone')!.value,
        emergency: emergencyCombined,
        comment: this.form.get('comment')!.value || ''
      },
      persons: this.people.controls.map((ctrl) => {
        const firstname = ctrl.get('firstname')!.value || '';
        const lastname = ctrl.get('lastname')!.value || '';
        const name = (firstname + ' ' + lastname).trim();

        const street = ctrl.get('street')!.value || '';
        const city = ctrl.get('city')!.value || '';
        const zip = ctrl.get('zip')!.value || '';
        const addressJoined = this.joinAddress(street, zip, city);

        const flag_vegetarian = !!ctrl.get('vegetarian')!.value;
        const orga = !!ctrl.get('orga')!.value;
        const flag_organization = orga ? 1 : 0;

        return {
          name,
          birthday: ctrl.get('birthday')!.value || '',
          address: addressJoined,
          comment: ctrl.get('comment')!.value || '',
          flag_vegetarian,
          flag_organization
        };
      }),
      items: this.items.controls.map((ctrl) => {
        return {
          articleId: ctrl.get('article_id')!.value,
          comment: ctrl.get('comment')!.value || ''
        };
      })
    };

    console.log('Backend (MySQL) payload', backendPayload);

    try {
      const result = await this.apiService.submit(backendPayload);
      console.log('Backend result', result);

      alert('Anmeldung gespeichert! Sie erhalten in Kürze eine Bestätigungs-E-Mail.');

      // Reset form to initial state
      this.submitted = false;
      this.currentStep = 'form';
      this.priceCheckResults = [];
      this.totalPrice = 0;

      this.form.reset({
        event_id: this.events.length > 0 ? this.events[0].id : '',

        booking_firstname: '',
        booking_lastname: '',
        booking_street: '',
        booking_city: '',
        booking_zip: '',

        email: '',
        phone: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        comment: '',

        agb_accepted: false,
        dsgvo_accepted: false
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
