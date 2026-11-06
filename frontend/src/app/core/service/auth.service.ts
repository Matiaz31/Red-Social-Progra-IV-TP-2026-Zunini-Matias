import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  birthDate: string;
  description?: string;
}

export interface AuthResponse {
  message: string;
  accessToken?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    role: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly apiUrl = 'http://localhost:3000/auth';

  constructor(private http: HttpClient) {}

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
}