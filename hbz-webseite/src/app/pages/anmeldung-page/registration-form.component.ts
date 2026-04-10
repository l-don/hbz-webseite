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
  events: OpenEvent[] = [];
  itemArticles: ItemArticle[] = [];

  form: FormGroup;
  submitted = false;
  isSaving = false;
  hasEvents = false;
  backendAvailable: boolean | null = null;

  currentStep: 'form' | 'overview' = 'form';
  priceCheckResults: PriceCheckResult[] = [];
  totalPrice = 0;

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

  /**
   * Reads actual DOM input values and patches them back into all FormControls.
   *
   * WHY: iOS Safari and Android Chrome fill fields visually via autofill but
   * never fire the `input`/`change` event that Angular's value accessor relies on.
   * The FormControl therefore stays empty even though the field looks filled.
   */
  syncDomValuesToForm(): void {
    const topLevelTextKeys = [
      'booking_firstname', 'booking_lastname',
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
        const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
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
      const personFields = ['firstname', 'lastname', 'birthday', 'street', 'city', 'zip', 'comment'];

      personFields.forEach((field) => {
        const ctrl = personGroup.get(field);
        if (!ctrl) return;
        const current: string = (ctrl.value ?? '').trim();
        if (current.length === 0) {
          const allEls = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
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

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private joinAddress(street: string, zip: string, city: string): string {
    const s = (street ?? '').trim();
    const z = (zip ?? '').trim();
    const c = (city ?? '').trim();
    return [[s], [[z, c].filter(Boolean).join(' ')]].map((p) => p[0]).filter(Boolean).join(', ');
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
      // Optional: dem User direkt sagen, was los ist
      alert('Der Server ist aktuell nicht erreichbar. Bitte später erneut versuchen.');
      return;
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
      firstname:  [''],
      lastname:   [''],
      birthday:   [''],
      street:     [''],
      city:       [''],
      zip:        [''],
      comment:    [''],
      vegetarian: [false],
      orga:       [false]
    });
    this.applyPersonValidators(group);
    return group;
  }

  private applyPersonValidators(group: FormGroup): void {
    const required = [RegistrationFormComponent.noWhitespaceValidator];

    group.get('firstname')!.setValidators(required);
    group.get('lastname')!.setValidators(required);
    // Birthday: whitespace-safe + enforce YYYY-MM-DD so iOS/Android formats are caught
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
      this.form.get('agb_accepted')?.value  === true &&
      this.form.get('dsgvo_accepted')?.value === true
    );
  }

  get canProceed(): boolean {
    const eventId = this.form.get('event_id')!.value as string;
    // 'items' wird hier ignoriert: unvollständige Items (article_id leer) werden
    // beim Submit ohnehin herausgefiltert. Ohne diesen Eintrag würde ein
    // halb-ausgefülltes Item canProceed=false liefern, ohne sichtbare Fehlermeldung.
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
    // ── Mobile Autofill Fix ─────────────────────────────────────────────────
    // iOS Safari / Android Chrome fill fields visually without firing Angular's
    // input event. Read current DOM values back into all controls first.
    this.syncDomValuesToForm();
    // Normalize birthday fields that mobile browsers may have formatted differently
    this.people.controls.forEach((_, i) => this.normalizeBirthday(i));
    // ───────────────────────────────────────────────────────────────────────

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
          return { birthday, flag_organization };
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

  // ─── Step navigation ────────────────────────────────────────────────────────

  backToForm(): void {
    this.currentStep = 'form';
  }

  // ─── Step 2: submit registration ────────────────────────────────────────────

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
    const bookingLastname  = this.form.get('booking_lastname')!.value  || '';
    const bookingName      = (bookingFirstname + ' ' + bookingLastname).trim();

    const bookingAddressJoined = this.joinAddress(
      this.form.get('booking_street')!.value || '',
      this.form.get('booking_zip')!.value    || '',
      this.form.get('booking_city')!.value   || ''
    );

    const emergencyName  = (this.form.get('emergency_contact_name')!.value  || '').trim();
    const emergencyPhone = (this.form.get('emergency_contact_phone')!.value || '').trim();
    const emergencyCombined =
      emergencyName && emergencyPhone
        ? `${emergencyName}: ${emergencyPhone}`
        : (emergencyName || emergencyPhone);

    const backendPayload: RegistrationApiPayload = {
      eventId,
      registration: {
        name:      bookingName || emergencyName || 'Unbekannt',
        address:   bookingAddressJoined,
        email:     this.form.get('email')!.value,
        phone:     this.form.get('phone')!.value,
        emergency: emergencyCombined,
        comment:   this.form.get('comment')!.value || ''
      },
      persons: this.people.controls.map((ctrl) => {
        const firstname = ctrl.get('firstname')!.value || '';
        const lastname  = ctrl.get('lastname')!.value  || '';
        const addressJoined = this.joinAddress(
          ctrl.get('street')!.value || '',
          ctrl.get('zip')!.value    || '',
          ctrl.get('city')!.value   || ''
        );
        return {
          name:              (firstname + ' ' + lastname).trim(),
          birthday:          ctrl.get('birthday')!.value || '',
          address:           addressJoined,
          comment:           ctrl.get('comment')!.value || '',
          flag_vegetarian:   !!ctrl.get('vegetarian')!.value,
          flag_organization: ctrl.get('orga')!.value ? 1 : 0
        };
      }),
      // Skip items without a selected article to avoid backend validation errors
      items: this.items.controls
        .filter((ctrl) => !!ctrl.get('article_id')!.value)
        .map((ctrl) => ({
          articleId: ctrl.get('article_id')!.value,
          comment:   ctrl.get('comment')!.value || ''
        }))
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
        event_id:                this.events.length > 0 ? this.events[0].id : '',
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
      alert('Fehler beim Speichern der Anmeldung. Bitte erneut versuchen.');
    } finally {
      this.isSaving = false;
    }
  }
}
