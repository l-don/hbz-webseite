import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

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

@Injectable({ providedIn: 'root' })
export class RegistrationApiService {
  private readonly http = inject(HttpClient);

  // Für lokal: http://localhost:3000
  // Später kannst du das in eine Environment-Variable auslagern.
  private readonly baseUrl = 'http://localhost:3000';

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
}
