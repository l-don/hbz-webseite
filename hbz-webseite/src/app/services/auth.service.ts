import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

export type Role = 'admin' | 'moderator' | null;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private roleSubject = new BehaviorSubject<Role>(this.getStoredRole());
  role$ = this.roleSubject.asObservable();

  private router = inject(Router);

  private getStoredRole(): Role {
    const v = localStorage.getItem('hbz_role');
    return (v === 'admin' || v === 'moderator') ? v : null;
  }

  get role(): Role { return this.roleSubject.value; }

  login(username: string, password: string): boolean {
    if (username === 'admin' && password === 'DasWandernLieben_Wir') {
      this.setRole('admin');
      return true;
    }
    if (username === 'moderator' && password === 'w@nderLust') {
      this.setRole('moderator');
      return true;
    }
    return false;
  }

  logout(): void {
    this.setRole(null);
    this.router.navigateByUrl('/anmeldung');
  }

  private setRole(role: Role) {
    if (role) localStorage.setItem('hbz_role', role);
    else localStorage.removeItem('hbz_role');
    this.roleSubject.next(role);
  }
}

