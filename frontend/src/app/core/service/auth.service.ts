import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  birthDate: string;
  description?: string;
}

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  birthDate: string;
  description?: string;
  profileImage?: string;
  role: string;
}

export interface AuthResponse {
  message: string;
  accessToken?: string;
  user?: AuthUser;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  register(
    data: RegisterData,
    profileImage?: File
  ): Observable<AuthResponse> {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });

    if (profileImage) {
      formData.append('profileImage', profileImage);
    }

    return this.http.post<AuthResponse>(
      `${this.apiUrl}/register`,
      formData
    );
  }

  login(identifier: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/login`,
      { identifier, password }
    );
  }

  saveSession(response: AuthResponse): void {
    if (response.accessToken) {
      localStorage.setItem('accessToken', response.accessToken);
    }

    if (response.user) {
      localStorage.setItem('currentUser', JSON.stringify(response.user));
    }
  }

  getCurrentUser(): AuthUser | null {
    const user = localStorage.getItem('currentUser');

    return user ? JSON.parse(user) as AuthUser : null;
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }
}