import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/service/auth.service';

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isSubmitting = false;
  errorMessage = '';

  form = this.fb.group({
    identifier: ['', [
      Validators.required,
      Validators.maxLength(254)
    ]],
    password: ['', Validators.required]
  });

  onSubmit(): void {
    this.errorMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { identifier, password } = this.form.getRawValue();

    this.isSubmitting = true;

    this.authService.login(identifier!, password!).subscribe({
      next: (response) => {
        if (!response.accessToken) {
          this.errorMessage = 'El servidor no devolvió un token de acceso.';
          this.isSubmitting = false;
          this.cdr.markForCheck();
          return;
        }

        console.log('Datos recibidos del usuario:', response.user);
        console.log('Respuesta completa del Login:', response);

        this.authService.saveSession(response);

        this.isSubmitting = false;
        this.router.navigate(['/publications']);
      },

      error: (error: HttpErrorResponse) => {
        this.errorMessage = Array.isArray(error.error?.message)
          ? error.error.message.join(', ')
          : error.error?.message || 'No se pudo iniciar sesión. Revisá tus credenciales.';

        this.isSubmitting = false;

        this.cdr.markForCheck();
      }
    });
  }
}