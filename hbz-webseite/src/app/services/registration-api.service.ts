import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Name {
  title: string;
  firstname: string;
  lastname: string;
}

export interface Address {
  street: string;
  zip: string;
  city: string;
}

export interface Price {
  description: string;
  value: number;
  decimals: number;
  currency: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
}

export interface PersonFoodOptions {
  vegetarian: boolean;
}

export interface OpenEvent {
  id: string;
  type: string;
  title: string;
  begin?: string;
  start?: string;
  end: string;
  description?: string;
  deadline?: string;
}

export interface Article {
  id: string;
  description: string;
  value: number;
  decimals: number;
  currency: string;
}

export interface PersonRequest {
  name: Name;
  address: Address;
  birthday: string;
  comment: string;
  foodOptions: PersonFoodOptions;
}

export interface ItemRequest {
  articleId: string;
  comment: string;
}

export interface RegistrationRequest {
  name: Name;
  address: Address;
  phone: string;
  email: string;
  comment: string;
  emergency: EmergencyContact;
  persons: PersonRequest[];
  items: ItemRequest[];
}

export interface UpstreamHealth {
  ping: number;
  tests?: any[];
}

export interface DataWrapper<T> {
  data: T;
}

export function parsePriceToEuro(price: Price | Article | number | undefined | null): number {
  if (price === null || price === undefined) return 0;
  if (typeof price === 'number') return price;
  // If price has nested price object (backward compatibility)
  if (typeof (price as any).price === 'object' && typeof (price as any).price?.value === 'number') {
    const p = (price as any).price;
    const decimals = typeof p.decimals === 'number' ? p.decimals : 2;
    return p.value / Math.pow(10, decimals);
  }
  // Flattened Price or Article
  if (typeof (price as any).value === 'number') {
    const decimals = typeof (price as any).decimals === 'number' ? (price as any).decimals : 2;
    return (price as any).value / Math.pow(10, decimals);
  }
  return 0;
}

@Injectable({ providedIn: 'root' })
export class RegistrationApiService {
  private readonly http = inject(HttpClient);

  // Herald backend server endpoint (configured in environment.ts / environment.development.ts)
  private readonly baseUrl = environment.apiUrl;

  getOpenEvents(): Promise<OpenEvent[]> {
    console.log('[RegistrationApiService] Fetching open events');
    return this.http
      .get<DataWrapper<OpenEvent[]>>(`${this.baseUrl}/events/open`)
      .toPromise()
      .then((res) => {
        console.log('[RegistrationApiService] Open events:', res);
        return res?.data || [];
      })
      .catch((err) => {
        console.error('[RegistrationApiService] Error fetching open events:', err);
        throw err;
      });
  }

  getEventTypes(): Promise<string[]> {
    console.log('[RegistrationApiService] Fetching event types');
    return this.http
      .get<DataWrapper<string[]>>(`${this.baseUrl}/events/types`)
      .toPromise()
      .then((res) => {
        console.log('[RegistrationApiService] Event types:', res);
        return res?.data || [];
      })
      .catch((err) => {
        console.error('[RegistrationApiService] Error fetching event types:', err);
        throw err;
      });
  }

  getItems(eventType: string = 'hbz'): Promise<Article[]> {
    console.log('[RegistrationApiService] Fetching items for eventType:', eventType);
    return this.http
      .get<DataWrapper<Article[]>>(`${this.baseUrl}/events/types/${eventType}/items`)
      .toPromise()
      .then((res) => {
        console.log('[RegistrationApiService] Items:', res);
        return res?.data || [];
      })
      .catch((err) => {
        console.error('[RegistrationApiService] Error fetching items:', err);
        throw err;
      });
  }

  getRegistrationPreview(eventId: string, birthdays: string[]): Promise<Price[]> {
    console.log('[RegistrationApiService] Fetching registration preview for eventId:', eventId, 'birthdays:', birthdays);
    let params = new HttpParams();
    birthdays.forEach((b) => {
      params = params.append('birthdays', b);
    });

    return this.http
      .get<DataWrapper<Price[]>>(`${this.baseUrl}/events/${eventId}/registrations/preview`, { params })
      .toPromise()
      .then((res) => {
        console.log('[RegistrationApiService] Registration preview response:', res);
        return res?.data || [];
      })
      .catch((err) => {
        console.error('[RegistrationApiService] Error in registration preview:', err);
        throw err;
      });
  }

  submit(eventId: string, payload: RegistrationRequest, manual: boolean = false): Promise<any> {
    console.log('[RegistrationApiService] Submitting registration for eventId:', eventId, 'payload:', payload);
    const params = new HttpParams().set('manual', String(manual));

    return this.http
      .post(`${this.baseUrl}/events/${eventId}/registrations`, payload, { params })
      .toPromise()
      .then((res) => {
        console.log('[RegistrationApiService] Response from Herald backend:', res);
        return res;
      })
      .catch((err) => {
        console.error('[RegistrationApiService] Error from Herald backend:', err);
        throw err;
      });
  }

  healthCheck(): Promise<boolean> {
    console.log('[RegistrationApiService] Health check');
    return this.http
      .get<DataWrapper<UpstreamHealth>>(`${this.baseUrl}/health`)
      .toPromise()
      .then((res) => {
        const ok = !!res && !!res.data && typeof res.data.ping === 'number';
        console.log('[RegistrationApiService] Health response:', res, '=> ok=', ok);
        return ok;
      })
      .catch((err) => {
        console.error('[RegistrationApiService] Health check failed:', err);
        return false;
      });
  }
}

