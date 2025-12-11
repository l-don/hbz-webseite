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
    private regService: RegistrationFirebaseService,  // aktuell ungenutzt, kann später entfernt werden
    private eventsService: EventsService,
    private apiService: RegistrationApiService
  ) {
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

  async ngOnInit(): Promise<void> {
    if (this.people.length === 0) {
      this.addPerson();
    }
    
    // Fetch open events from backend
    try {
      this.events = await this.apiService.getOpenEvents();
      this.hasEvents = this.events.length > 0;
      
      // Preselect first event
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

  // Helpers to access arrays
  get people(): FormArray<FormGroup> {
    return this.form.get('people') as FormArray<FormGroup>;
  }

  get items(): FormArray<FormGroup> {
    return this.form.get('items') as FormArray<FormGroup>;
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

  get canProceed(): boolean {
    const eventId = this.form.get('event_id')!.value as string;
    return this.hasEvents && !!eventId && this.form.valid && this.people.length > 0;
  }

  // Step 1: "Weiter" button - trigger price check
  async proceedToOverview(): Promise<void> {
    this.submitted = true;
    if (!this.canProceed) {
      this.form.markAllAsTouched();
      this.refreshPrimaryPersonValidators();
      return;
    }

    this.isSaving = true;
    
    try {
      const eventId = this.form.get('event_id')!.value as string;
      
      // Prepare price check request for persons
      const priceCheckRequest = {
        eventId,
        persons: this.people.controls.map((ctrl) => {
          const staff = !!ctrl.get('staff')!.value;
          const orga = !!ctrl.get('orga')!.value;
          const flag_organization = (staff || orga) ? 1 : 0;
          
          return {
            birthday: ctrl.get('birthday')!.value || '',
            flag_organization
          };
        })
      };
      
      // Get article prices for persons
      this.priceCheckResults = await this.apiService.priceCheck(priceCheckRequest);
      
      // Calculate total price (person articles + items)
      let total = 0;
      
      // Add person article prices
      for (const result of this.priceCheckResults) {
        total += result.price || 0;
      }
      
      // Add selected item prices
      for (const itemCtrl of this.items.controls) {
        const articleId = itemCtrl.get('article_id')!.value;
        const article = this.itemArticles.find(a => a.id === articleId);
        if (article) {
          total += article.price || 0;
        }
      }
      
      this.totalPrice = total;
      
      // Move to overview step
      this.currentStep = 'overview';
      
    } catch (err) {
      console.error('Error during price check:', err);
      alert('Fehler beim Abrufen der Preise. Bitte erneut versuchen.');
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
    
    const eventId = this.form.get('event_id')!.value as string;

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
        const flag_organization = (staff || orga) ? 1 : 0;

        return {
          name,
          birthday: ctrl.get('birthday')!.value || '',
          address: ctrl.get('address')!.value || '',
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

      alert('Anmeldung gespeichert!');
      
      // Reset form to initial state
      this.submitted = false;
      this.currentStep = 'form';
      this.priceCheckResults = [];
      this.totalPrice = 0;
      
      this.form.reset({
        event_id: this.events.length > 0 ? this.events[0].id : '',
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
