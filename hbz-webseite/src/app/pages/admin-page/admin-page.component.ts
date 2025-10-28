import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EventsService, EventModel } from '../../services/events.service';
import { AdminDataService, RegistrationDoc, PersonDoc, ItemDoc } from '../../services/admin-data.service';
import { combineLatest, map, Subscription, startWith } from 'rxjs';

interface ViewRegistration extends RegistrationDoc {
  people: PersonDoc[];
  items: ItemDoc[];
}

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './admin-page.component.html',
  styleUrl: './admin-page.component.scss'
})
export class AdminPageComponent implements OnInit, OnDestroy {
  role = this.auth.role;

  // Events
  events$ = this.eventsService.list$();
  selectedEventId = this.fb.control<string>('');

  // Data
  regs$ = this.adminData.registrations$();
  people$ = this.adminData.people$();
  items$ = this.adminData.items$();

  vm$ = combineLatest([
    this.regs$,
    this.people$,
    this.items$,
    this.events$,
    this.selectedEventId.valueChanges.pipe(startWith(this.selectedEventId.value))
  ]).pipe(
    map(([regs, people, items, events, selectedEventId]) => {
      const eventId = selectedEventId || events[0]?.id || '';
      const beginIso = events.find(e => e.id === eventId)?.begin;

      const byReg: Record<string, ViewRegistration> = {};
      regs.filter(r => !eventId || r.event_id === eventId).forEach(r => {
        byReg[r.id] = { ...r, people: [], items: [] };
      });
      people.forEach(p => { const r = byReg[p.registration_id]; if (r) r.people.push(p); });
      items.forEach(i => { const r = byReg[i.registration_id]; if (r) r.items.push(i); });

      const list = Object.values(byReg);

      // Stats
      const refDate = beginIso ? new Date(beginIso) : new Date();
      const years = (b?: string) => {
        if (!b) return undefined;
        const d = new Date(b);
        let age = refDate.getFullYear() - d.getFullYear();
        const m = refDate.getMonth() - d.getMonth();
        if (m < 0 || (m === 0 && refDate.getDate() < d.getDate())) age--;
        return age;
      };

      let total = 0, adult = 0, c10_14 = 0, c6_9 = 0, c3_5 = 0, c_under3 = 0, dogs = 0, horses = 0;
      list.forEach(r => {
        r.people.forEach(p => {
          total++;
          const a = years(p.birthday);
          if (a === undefined || a === null) return; // ungezählt, wenn kein Geburtsdatum
          if (a >= 15) adult++;
          else if (a >= 10) c10_14++;
          else if (a >= 6) c6_9++;
          else if (a >= 3) c3_5++;
          else c_under3++;
        });
        r.items.forEach(i => {
          if (i.type_id === 'dog') dogs++;
          if (i.type_id === 'horse') horses++;
        });
      });

      return { list, stats: { total, adult, c10_14, c6_9, c3_5, c_under3, dogs, horses }, eventId };
    })
  );

  // Event create form (admin only)
  eventForm = this.fb.group({
    title: [''],
    begin: [''],
    end: [''],
    deadline: [''],
    description: ['']
  });

  private sub?: Subscription;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService,
    private eventsService: EventsService,
    private adminData: AdminDataService
  ) {}

  ngOnInit(): void {
    if (!this.role) {
      this.router.navigateByUrl('/anmeldung');
      return;
    }
    // Initialize selected event when events load
    this.sub = this.events$.subscribe(evs => {
      if (!this.selectedEventId.value && evs && evs.length) this.selectedEventId.setValue(evs[0].id!);
    });
  }
  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  async addEvent() {
    if (this.role !== 'admin') return;
    const v = this.eventForm.value;
    if (!v.title || !v.title.trim()) {
      this.eventForm.markAllAsTouched();
      alert('Bitte Titel ausfüllen.');
      return;
    }
    try {
      const id = await this.eventsService.add({
        title: v.title.trim(),
        begin: v.begin || undefined,
        end: v.end || undefined,
        deadline: v.deadline || undefined,
        description: (v.description || '').trim() || undefined,
      });
      this.selectedEventId.setValue(id);
      this.eventForm.reset();
      alert('Veranstaltung angelegt.');
    } catch (err: any) {
      console.error(err);
      const code = err?.code || 'unknown';
      const msg = err?.message || '';
      alert(`Fehler beim Anlegen der Veranstaltung. (${code}) ${msg}`);
    }
  }

  async removeEvent(id: string) {
    if (this.role !== 'admin') return;
    if (!confirm('Event wirklich löschen? Alle Zuordnungen bleiben in Registrierungen bestehen.')) return;
    await this.eventsService.remove(id);
  }

  async deleteRegistration(id: string) {
    if (this.role !== 'admin') return;
    if (!confirm('Registrierung und zugehörige Personen/Zusatzoptionen endgültig löschen?')) return;
    await this.adminData.deleteRegistrationCascade(id);
  }

  logout() { this.auth.logout(); }
}
