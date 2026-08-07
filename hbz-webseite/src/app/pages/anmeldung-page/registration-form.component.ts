import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { RegistrationFirebaseService } from '../../services/registration-firebase.service';
import { BannerImgComponent } from '../../banner-img/banner-img.component';
import { EventsService } from '../../services/events.service';
import {
  RegistrationApiService,
  OpenEvent,
  Article,
  RegistrationRequest,
  parsePriceToEuro
} from '../../services/registration-api.service';

@Component({
  selector: 'app-registration-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, BannerImgComponent],
  templateUrl: './registration-form.component.html',
  styleUrl: './registration-form.component.scss'
})
export class RegistrationFormComponent implements OnInit {
  events: OpenEvent[] = [];
  itemArticles: Article[] = [];

  form: FormGroup;
  submitted = false;
  isSaving = false;
  hasEvents = false;
  backendAvailable: boolean | null = null;

  currentStep: 'form' | 'overview' = 'form';
  priceCheckResults: Article[] = [];
  totalPrice = 0;
  parsePriceToEuro = parsePriceToEuro;

  // ─── Validators ────────────────────────────────────────────────────────────

  /**
   * Rejects strings consisting only of whitespace.
   * iOS/Android autofill sometimes inserts only spaces which Validators.required
   * wrongly accepts.
   */
  private static noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value === null || value === undefined) return { required: true };
    const trimmed = String(value).trim();
    return trimmed.length > 0 ? null : { required: true };
  }

  // ─── Mobile-Autofill Helpers ────────────────────────────────────────────────

  /**
   * Normalizes a date string to YYYY-MM-DD.
   * iOS Safari and some Android browsers return dates in other formats
   * (e.g. MM/DD/YYYY or DD.MM.YYYY).
   */
  normalizeBirthday(personIndex: number): void {
    const ctrl = this.people.at(personIndex)?.get('birthday');
    if (!ctrl) return;

    const raw: string = (ctrl.value ?? '').trim();
    if (!raw) return;

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return;

    // MM/DD/YYYY  (iOS Safari)
    const mdy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mdy) {
      ctrl.setValue(`${mdy[3]}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}`, { emitEvent: false });
      ctrl.updateValueAndValidity();
      return;
    }

    // DD.MM.YYYY  (German locale)
    const dmy = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (dmy) {
      ctrl.setValue(`${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`, { emitEvent: false });
      ctrl.updateValueAndValidity();
      return;
    }

    // Native Date parsing as last resort
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) {
      ctrl.setValue(parsed.toISOString().substring(0, 10), { emitEvent: false });
      ctrl.updateValueAndValidity();
    }
  }

  private showAlert(msg: string): void {
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(msg);
    }
  }

  /**
   * Reads actual DOM input values and patches them back into all FormControls.
   *
   * WHY: iOS Safari and Android Chrome fill fields visually via autofill but
   * never fire the `input`/`change` event that Angular's value accessor relies on.
   * The FormControl therefore stays empty even though the field looks filled.
   */
  syncDomValuesToForm(): void {
    if (typeof document === 'undefined') return;

    const topLevelTextKeys = [
      'booking_title', 'booking_firstname', 'booking_lastname',
      'booking_street', 'booking_city', 'booking_zip',
      'email', 'phone',
      'emergency_contact_name', 'emergency_contact_phone',
      'comment'
    ];

    topLevelTextKeys.forEach((key) => {
      const ctrl = this.form.get(key);
      if (!ctrl) return;
      const current: string = (ctrl.value ?? '').trim();
      if (current.length === 0) {
        const el = document.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
          `[formControlName="${key}"]`
        );
        const domVal = (el?.value ?? '').trim();
        if (domVal.length > 0) {
          ctrl.setValue(domVal, { emitEvent: false });
        }
      }
      ctrl.updateValueAndValidity({ emitEvent: false });
    });

    this.people.controls.forEach((personCtrl, personIdx) => {
      const personGroup = personCtrl as FormGroup;
      const personFields = ['title', 'firstname', 'lastname', 'birthday', 'street', 'city', 'zip', 'comment'];

      personFields.forEach((field) => {
        const ctrl = personGroup.get(field);
        if (!ctrl) return;
        const current: string = (ctrl.value ?? '').trim();
        if (current.length === 0) {
          const allEls = document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
            `[formControlName="${field}"]`
          );
          const el = allEls[personIdx];
          const domVal = (el?.value ?? '').trim();
          if (domVal.length > 0) {
            ctrl.setValue(domVal, { emitEvent: false });
          }
        }
        ctrl.updateValueAndValidity({ emitEvent: false });
      });
    });
  }

  // ─── Constructor ────────────────────────────────────────────────────────────

  constructor(
    private fb: FormBuilder,
    private regService: RegistrationFirebaseService,
    private eventsService: EventsService,
    private apiService: RegistrationApiService,
    private router: Router,
    private ngZone: NgZone
  ) {
    this.form = this.fb.group({
      event_id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),

      booking_title:     ['', [RegistrationFormComponent.noWhitespaceValidator]],
      booking_firstname: ['', [RegistrationFormComponent.noWhitespaceValidator]],
      booking_lastname:  ['', [RegistrationFormComponent.noWhitespaceValidator]],
      booking_street:    ['', [RegistrationFormComponent.noWhitespaceValidator]],
      booking_city:      ['', [RegistrationFormComponent.noWhitespaceValidator]],
      booking_zip:       ['', [RegistrationFormComponent.noWhitespaceValidator]],

      email:                   ['', [Validators.required, Validators.email]],
      phone:                   ['', [RegistrationFormComponent.noWhitespaceValidator]],
      emergency_contact_name:  ['', [RegistrationFormComponent.noWhitespaceValidator]],
      emergency_contact_phone: ['', [RegistrationFormComponent.noWhitespaceValidator]],
      comment: [''],

      agb_accepted:  [false, [Validators.requiredTrue]],
      dsgvo_accepted:[false, [Validators.requiredTrue]],

      people: this.fb.array([]),
      items:  this.fb.array([])
    });
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  async ngOnInit(): Promise<void> {
    if (this.people.length === 0) {
      this.addPerson();
    }

    this.backendAvailable = await this.apiService.healthCheck();

    if (!this.backendAvailable) {
      console.error('Backend not reachable - skipping events/items loading');
      this.hasEvents = false;
      this.events = [];
      this.itemArticles = [];
      this.showAlert('Der Server ist aktuell nicht erreichbar. Bitte später erneut versuchen.');
      return;
    }

    // Fetch open events from backend
    try {
      this.events = await this.apiService.getOpenEvents();
      this.hasEvents = this.events.length > 0;

      if (this.hasEvents) {
        this.form.get('event_id')!.setValue(this.events[0].id);
        const eventType = this.events[0].type || 'hbz';
        await this.loadItemsForEventType(eventType);
      }
    } catch (err) {
      console.error('Error fetching open events:', err);
      this.hasEvents = false;
    }
  }

  async loadItemsForEventType(eventType: string): Promise<void> {
    try {
      this.itemArticles = await this.apiService.getItems(eventType);
      console.log('Loaded item articles for eventType', eventType, ':', this.itemArticles);
    } catch (err) {
      console.error('Error fetching items:', err);
      this.itemArticles = [];
    }
  }

  // ─── FormArray Accessors ────────────────────────────────────────────────────

  get people(): FormArray<FormGroup> {
    return this.form.get('people') as FormArray<FormGroup>;
  }

  get items(): FormArray<FormGroup> {
    return this.form.get('items') as FormArray<FormGroup>;
  }

  // ─── Person Management ──────────────────────────────────────────────────────

  private createPersonGroup(): FormGroup {
    const group = this.fb.group({
      title:      [''],
      firstname:  [''],
      lastname:   [''],
      birthday:   [''],
      street:     [''],
      city:       [''],
      zip:        [''],
      comment:    [''],
      vegetarian: [false]
    });
    this.applyPersonValidators(group);
    return group;
  }

  private applyPersonValidators(group: FormGroup): void {
    const required = [RegistrationFormComponent.noWhitespaceValidator];

    group.get('title')!.setValidators(required);
    group.get('firstname')!.setValidators(required);
    group.get('lastname')!.setValidators(required);
    group.get('birthday')!.setValidators([
      RegistrationFormComponent.noWhitespaceValidator,
      Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)
    ]);
    group.get('street')!.setValidators(required);
    group.get('city')!.setValidators(required);
    group.get('zip')!.setValidators(required);

    Object.keys(group.controls).forEach((key) =>
      group.get(key)!.updateValueAndValidity({ emitEvent: false })
    );
  }

  private refreshAllPersonValidators(): void {
    this.people.controls.forEach((ctrl) => this.applyPersonValidators(ctrl));
  }

  addPerson(): void {
    this.people.push(this.createPersonGroup());
    this.refreshAllPersonValidators();
  }

  removePerson(index: number): void {
    this.people.removeAt(index);
    this.refreshAllPersonValidators();
  }

  // ─── Item Management ────────────────────────────────────────────────────────

  private createItemGroup(): FormGroup {
    return this.fb.group({
      article_id: ['', Validators.required],
      comment:    ['']
    });
  }

  addItem(): void {
    this.items.push(this.createItemGroup());
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  // ─── UI Helpers ─────────────────────────────────────────────────────────────

  copyBookingDataToFirstPerson(): void {
    if (this.people.length === 0) return;
    const p0 = this.people.at(0);
    p0.patchValue({
      title:     this.form.get('booking_title')!.value    || '',
      firstname: this.form.get('booking_firstname')!.value || '',
      lastname:  this.form.get('booking_lastname')!.value  || '',
      street:    this.form.get('booking_street')!.value    || '',
      city:      this.form.get('booking_city')!.value      || '',
      zip:       this.form.get('booking_zip')!.value       || ''
    });
    p0.markAsDirty();
    p0.markAsTouched();
  }

  get canSubmit(): boolean {
    return (
      this.form.get('agb_accepted')?.value   === true &&
      this.form.get('dsgvo_accepted')?.value === true
    );
  }

  get canProceed(): boolean {
    const eventId = this.form.get('event_id')!.value as string;
    const controlsToIgnore = ['agb_accepted', 'dsgvo_accepted', 'items'];

    const invalidTopLevel = Object.keys(this.form.controls)
      .filter((key) => !controlsToIgnore.includes(key))
      .filter((key) => !this.form.get(key)!.valid);

    if (invalidTopLevel.length > 0) {
      console.log('[canProceed] Invalid top-level controls:', invalidTopLevel);
    }

    this.people.controls.forEach((ctrl, i) => {
      const fg = ctrl as FormGroup;
      const invalidFields = Object.keys(fg.controls).filter((f) => fg.get(f)!.invalid);
      if (invalidFields.length > 0) {
        console.log(
          `[canProceed] Person ${i} invalid fields:`,
          invalidFields.map((f) => `${f}="${fg.get(f)!.value}"`)
        );
      }
    });

    return this.hasEvents && !!eventId && invalidTopLevel.length === 0 && this.people.length > 0;
  }

  // ─── Step 1: proceed to overview ────────────────────────────────────────────

  async proceedToOverview(): Promise<void> {
    this.syncDomValuesToForm();
    this.people.controls.forEach((_, i) => this.normalizeBirthday(i));

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
      const birthdays = this.people.controls.map((ctrl) => (ctrl.get('birthday')!.value || '').trim());

      console.log('[proceedToOverview] Requesting preview for eventId:', eventId, 'birthdays:', birthdays);

      // Get article prices for persons via registration preview endpoint
      this.priceCheckResults = await this.apiService.getRegistrationPreview(eventId, birthdays);

      console.log('[proceedToOverview] Preview results:', this.priceCheckResults);

      // Calculate total price (person articles + items)
      let total = 0;

      for (const result of this.priceCheckResults) {
        const price = parsePriceToEuro(result.price);
        console.log(`[proceedToOverview] Adding person price: ${price} from`, result);
        total += price;
      }

      for (const itemCtrl of this.items.controls) {
        const articleId = itemCtrl.get('article_id')!.value;
        const article = this.itemArticles.find((a) => a.id === articleId);
        if (article) {
          const price = parsePriceToEuro(article.price);
          console.log(`[proceedToOverview] Adding item price: ${price} from`, article);
          total += price;
        }
      }

      this.totalPrice = total;

      console.log('[proceedToOverview] Total price calculated:', this.totalPrice);
      this.currentStep = 'overview';

    } catch (err: any) {
      console.error('[proceedToOverview] Error during price check:', err);

      let errorMsg = 'Fehler beim Abrufen der Preise.';
      if (err.error?.message) errorMsg += '\nMessage: ' + err.error.message;
      if (err.error?.error) errorMsg += '\nError: ' + err.error.error;

      this.showAlert(errorMsg + '\n\nBitte überprüfen Sie die Konsole für weitere Details.');
    } finally {
      this.isSaving = false;
    }
  }

  // ─── Step navigation ────────────────────────────────────────────────────────

  backToForm(): void {
    this.currentStep = 'form';
  }

  // ─── Step 2: submit registration ────────────────────────────────────────────

  async submitRegistration(): Promise<void> {
    this.isSaving = true;

    if (!this.canSubmit) {
      this.submitted = true;
      this.form.markAllAsTouched();
      this.people.controls.forEach((p) => p.markAllAsTouched());
      this.showAlert('Bitte akzeptieren Sie AGB und Datenschutzerklärung.');
      this.isSaving = false;
      return;
    }

    const eventId = this.form.get('event_id')!.value as string;

    const backendPayload: RegistrationRequest = {
      name: {
        title:     (this.form.get('booking_title')!.value     || '').trim(),
        firstname: (this.form.get('booking_firstname')!.value || '').trim(),
        lastname:  (this.form.get('booking_lastname')!.value  || '').trim()
      },
      address: {
        street: (this.form.get('booking_street')!.value || '').trim(),
        zip:    (this.form.get('booking_zip')!.value    || '').trim(),
        city:   (this.form.get('booking_city')!.value   || '').trim()
      },
      email:     (this.form.get('email')!.value || '').trim(),
      phone:     (this.form.get('phone')!.value || '').trim(),
      comment:   (this.form.get('comment')!.value || '').trim(),
      emergency: {
        name:  (this.form.get('emergency_contact_name')!.value  || '').trim(),
        phone: (this.form.get('emergency_contact_phone')!.value || '').trim()
      },
      persons: this.people.controls.map((ctrl) => ({
        name: {
          title:     (ctrl.get('title')!.value     || '').trim(),
          firstname: (ctrl.get('firstname')!.value || '').trim(),
          lastname:  (ctrl.get('lastname')!.value  || '').trim()
        },
        address: {
          street: (ctrl.get('street')!.value || '').trim(),
          zip:    (ctrl.get('zip')!.value    || '').trim(),
          city:   (ctrl.get('city')!.value   || '').trim()
        },
        birthday: (ctrl.get('birthday')!.value || '').trim(),
        comment:  (ctrl.get('comment')!.value  || '').trim(),
        foodOptions: {
          vegetarian: !!ctrl.get('vegetarian')!.value
        }
      })),
      items: this.items.controls
        .filter((ctrl) => !!ctrl.get('article_id')!.value)
        .map((ctrl) => ({
          articleId: ctrl.get('article_id')!.value,
          comment:   (ctrl.get('comment')!.value || '').trim()
        }))
    };

    console.log('Herald RegistrationRequest payload:', backendPayload);

    try {
      const result = await this.apiService.submit(eventId, backendPayload);
      console.log('Herald submission result:', result);

      this.showAlert('Anmeldung gespeichert! Sie erhalten in Kürze eine Bestätigungs-E-Mail.');

      this.submitted = false;
      this.currentStep = 'form';
      this.priceCheckResults = [];
      this.totalPrice = 0;

      this.form.reset({
        event_id:                this.events.length > 0 ? this.events[0].id : '',
        booking_title:           '',
        booking_firstname:       '',
        booking_lastname:        '',
        booking_street:          '',
        booking_city:            '',
        booking_zip:             '',
        email:                   '',
        phone:                   '',
        emergency_contact_name:  '',
        emergency_contact_phone: '',
        comment:                 '',
        agb_accepted:            false,
        dsgvo_accepted:          false
      });

      this.people.clear();
      this.items.clear();
      this.addPerson();

      await this.router.navigateByUrl('/');
    } catch (err) {
      console.error('Fehler beim Speichern der Anmeldung', err);
      this.showAlert('Fehler beim Speichern der Anmeldung. Bitte erneut versuchen.');
    } finally {
      this.isSaving = false;
    }
  }
}

