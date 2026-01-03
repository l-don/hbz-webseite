import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RegistrationApiPayload {
  eventId: string;
  registration: {
    name: string;
    address: string;
    email: string;
    phone: string;
    emergency: string;
    comment?: string;
  };
  persons: Array<{
    name: string;
    birthday: string;
    address: string;
    comment?: string;
    flag_vegetarian: boolean;
    flag_organization: number;
  }>;
  items: Array<{
    articleId: string;
    comment?: string;
  }>;
}

export interface PriceCheckRequest {
  eventId: string;
  persons: Array<{
    birthday: string;
    flag_organization: number;
  }>;
}

export interface PriceCheckResult {
  articleId: string;
  description: string;
  price: number;
}

export interface OpenEvent {
  id: string;
  title: string;
  description?: string;
  deadline?: string;
  begin?: string;
  end?: string;
}

export interface ItemArticle {
  id: string;
  description: string;
  price: number;
}

export interface HealthResponse {
  status: string;
  db?: string;
  ping?: number;
}


@Injectable({ providedIn: 'root' })
export class RegistrationApiService
{
  private readonly http = inject(HttpClient);

  // Für lokal: http://localhost:3000
  // Später kannst du das in eine Environment-Variable auslagern.
  private readonly baseUrl = 'https://limbus.davidlokison.com/herald';

  getOpenEvents(): Promise<OpenEvent[]> {
    console.log('[RegistrationApiService] Fetching open events');
    return this.http
      .get<OpenEvent[]>(`${this.baseUrl}/events/open`)
      .toPromise()
      .then((res) => {
        console.log('[RegistrationApiService] Open events:', res);
        return res || [];
      })
      .catch((err) => {
        console.error('[RegistrationApiService] Error fetching open events:', err);
        throw err;
      });
  }

  getItems(): Promise<ItemArticle[]> {
    console.log('[RegistrationApiService] Fetching items');
    return this.http
      .get<ItemArticle[]>(`${this.baseUrl}/items`)
      .toPromise()
      .then((res) => {
        console.log('[RegistrationApiService] Items:', res);
        return res || [];
      })
      .catch((err) => {
        console.error('[RegistrationApiService] Error fetching items:', err);
        throw err;
      });
  }

  priceCheck(request: PriceCheckRequest): Promise<PriceCheckResult[]> {
    console.log('[RegistrationApiService] Sending pricecheck request:', request);
    return this.http
      .post<PriceCheckResult[]>(`${this.baseUrl}/pricecheck`, request)
      .toPromise()
      .then((res) => {
        console.log('[RegistrationApiService] Pricecheck response:', res);
        return res || [];
      })
      .catch((err) => {
        console.error('[RegistrationApiService] Error in pricecheck:', err);
        throw err;
      });
  }

  submit(payload: RegistrationApiPayload): Promise<any> {
    console.log('[RegistrationApiService] Sending payload to backend:', payload);
    return this.http
      .post(`${this.baseUrl}/registrations`, payload)
      .toPromise()
      .then((res) => {
        console.log('[RegistrationApiService] Response from backend:', res);
        return res;
      })
      .catch((err) => {
        console.error('[RegistrationApiService] Error from backend:', err);
        throw err;
      });
  }

  healthCheck(): Promise<boolean> {
    console.log('[RegistrationApiService] Health check');
    return this.http
      .get<HealthResponse>(`${this.baseUrl}/health`)
      .toPromise()
      .then((res) => {
        const ok = !!res && (res.status === 'ok' || (res as any).status === 'OK');
        console.log('[RegistrationApiService] Health response:', res, '=> ok=', ok);
        return ok;
      })
      .catch((err) => {
        console.error('[RegistrationApiService] Health check failed:', err);
        return false;
      });
  }
}
