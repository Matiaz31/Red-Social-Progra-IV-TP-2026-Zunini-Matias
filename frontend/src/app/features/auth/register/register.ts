import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService, RegisterData } from '../../../core/service/auth.service';

@Component({
  selector: 'app-register',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  selectedProfileImage: File | null = null;
  private profileImageInput: HTMLInputElement | null = null;

  form = this.fb.group(
    {
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20)
      ]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      birthDate: ['', Validators.required],
      description: ['']
    },
    {
      validators: this.passwordMatchValidator
    }
  );

  private passwordMatchValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (!password || !confirmPassword) {
      return null;
    }

    return password === confirmPassword
      ? null
      : { passwordMismatch: true };
  }

  onProfileImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.profileImageInput = input;
    this.errorMessage = '';

    if (!file) {
      this.selectedProfileImage = null;
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'El archivo debe ser una imagen.';
      this.selectedProfileImage = null;
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'La imagen no puede superar los 5 MB.';
      this.selectedProfileImage = null;
      input.value = '';
      return;
    }

    this.selectedProfileImage = file;
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();

      this.errorMessage =
        'Revisá los campos. Completá todos los datos correctamente y verificá que las contraseñas coincidan.';

      return;
    }

    const {
      confirmPassword,
      ...data
    } = this.form.getRawValue();

    const registerData: RegisterData = {
      firstName: data.firstName!,
      lastName: data.lastName!,
      email: data.email!,
      username: data.username!,
      password: data.password!,
      birthDate: data.birthDate!,
      description: data.description || ''
    };

    this.isSubmitting = true;

    this.authService.register(
      registerData,
      this.selectedProfileImage ?? undefined
    ).subscribe({
      next: (response) => {
        this.successMessage =
          response.message || 'Registro exitoso.';

        this.form.reset();
        this.selectedProfileImage = null;

        if (this.profileImageInput) {
          this.profileImageInput.value = '';
        }

        this.isSubmitting = false;
        this.cdr.markForCheck()
      },

      error: (error: HttpErrorResponse) => {
        this.errorMessage = Array.isArray(error.error?.message)
          ? error.error.message.join(', ')
          : error.error?.message ||
            'No se pudo completar el registro. Intentá nuevamente.';

        this.isSubmitting = false;
        this.cdr.markForCheck();
      }
    });
  }
}