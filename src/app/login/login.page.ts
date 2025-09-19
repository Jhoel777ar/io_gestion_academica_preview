import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonItem,
  IonIcon,
  IonInput,
  IonButton,
  IonCheckbox,
  IonText,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonItem,
    IonIcon,
    IonInput,
    IonButton,
    IonCheckbox,
    IonText,
    IonSelect,
    IonSelectOption,
  ],
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  registerForm: FormGroup;
  isLoginMode = true;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });

    this.registerForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
        nombre: ['', [Validators.required, Validators.minLength(2)]],
        universidad: ['', [Validators.required]],
        carrera: ['', [Validators.required]],
        semestre: [
          '',
          [Validators.required, Validators.min(1), Validators.max(12)],
        ],
        role: ['estudiante', [Validators.required]],
        acceptTerms: [false, [Validators.requiredTrue]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit() {
    this.authService.getCurrentUser().subscribe((user) => {
      if (user) {
        this.authService
          .getCurrentUserProfile()
          .then((profile) => {
            if (profile?.role === 'docente')
              this.router.navigate(['/tabs/docente']);
            else this.router.navigate(['/tabs/estudiante']);
          })
          .catch(() => {
            this.router.navigate(['/tabs/estudiante']);
          });
      }
    });
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  async onLogin() {
    if (!this.loginForm.valid) {
      this.markFormGroupTouched(this.loginForm);
      return this.showToast('Verifica tus datos de acceso', 'danger');
    }
    const { email, password } = this.loginForm.value;
    try {
      await this.authService.login(email, password);
    } catch (error) {
      console.error('Login error:', error);
    }
  }

  async onRegister() {
    if (!this.registerForm.valid) {
      this.markFormGroupTouched(this.registerForm);
      return this.showToast('Verifica los datos del registro', 'danger');
    }

    const { email, password, nombre, universidad, carrera, semestre, role } =
      this.registerForm.value;

    try {
      await this.authService.register({
        email,
        password,
        nombre,
        universidad,
        carrera,
        semestre: Number(semestre),
        role,
      });

      this.registerForm.reset();
      this.isLoginMode = true;
    } catch (error) {
      console.error('Register error:', error);
      this.showToast('Error al crear la cuenta', 'danger');
    }
  }

  async forgotPassword() {
    const alert = await this.alertController.create({
      header: 'Recuperar Contraseña',
      message: 'Ingresa tu email:',
      inputs: [{ name: 'email', type: 'email', placeholder: 'tu@email.com' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Enviar',
          handler: async (data) => {
            if (!data.email)
              return this.showToast('Ingresa un email válido', 'danger');
            try {
              await this.authService.resetPassword(data.email);
            } catch (error) {
              console.error(error);
            }
          },
        },
      ],
    });
    await alert.present();
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.loginForm.reset();
    this.registerForm.reset();
  }

  togglePasswordVisibility(event?: Event) {
    if (event) event.preventDefault();
    this.showPassword = !this.showPassword;
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((field) => {
      const control = formGroup.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color,
    });
    await toast.present();
  }

  get emailError() {
    return (
      this.loginForm.get('email')?.invalid &&
      this.loginForm.get('email')?.touched
    );
  }
  get passwordError() {
    return (
      this.loginForm.get('password')?.invalid &&
      this.loginForm.get('password')?.touched
    );
  }
  get regEmailError() {
    return (
      this.registerForm.get('email')?.invalid &&
      this.registerForm.get('email')?.touched
    );
  }
  get passwordMismatch() {
    return (
      this.registerForm.hasError('passwordMismatch') &&
      this.registerForm.get('confirmPassword')?.touched
    );
  }
}
