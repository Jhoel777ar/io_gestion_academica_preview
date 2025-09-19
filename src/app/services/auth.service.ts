import { Injectable } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { ToastController } from '@ionic/angular';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  nombre: string;
  universidad: string;
  carrera: string;
  semestre: number;
  role?: 'estudiante' | 'docente';
  fechaCreacion: Date;
  ultimoAcceso: Date;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private storageInitialized = false;

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private storage: Storage,
    private router: Router,
    private toastController: ToastController
  ) {
    this.initStorage();
    this.initAuthState();
  }

  private async initStorage() {
    await this.storage.create();
    this.storageInitialized = true;
  }

  private initAuthState() {
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        const userData: User = {
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          emailVerified: user.emailVerified,
        };
        this.currentUserSubject.next(userData);
        await this.updateLastAccess(user.uid);
        if (this.storageInitialized) await this.storage.set('user', userData);
      } else {
        this.currentUserSubject.next(null);
        if (this.storageInitialized) await this.storage.remove('user');
      }
    });
  }

  async login(email: string, password: string): Promise<void> {
    try {
      const result = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      const userDocRef = doc(this.firestore, `usuarios/${result.user.uid}`);
      const userDoc = await getDoc(userDocRef);
      const profile = userDoc.exists() ? (userDoc.data() as UserProfile) : null;

      await this.showToast('¡Bienvenido!', 'success');

      if (profile?.role === 'docente') {
        await this.router.navigate(['/tabs/docente']);
      } else {
        await this.router.navigate(['/tabs/estudiante']);
      }
    } catch (error: any) {
      await this.handleAuthError(error);
      throw error;
    }
  }

  async register(userData: {
    email: string;
    password: string;
    nombre: string;
    universidad: string;
    carrera: string;
    semestre: number;
    role: 'estudiante' | 'docente';
  }): Promise<void> {
    try {
      const result = await createUserWithEmailAndPassword(
        this.auth,
        userData.email,
        userData.password
      );
      if (result.user) {
        await updateProfile(result.user, { displayName: userData.nombre });
        const userProfile: UserProfile = {
          uid: result.user.uid,
          email: userData.email,
          nombre: userData.nombre,
          universidad: userData.universidad,
          carrera: userData.carrera,
          semestre: userData.semestre,
          role: userData.role,
          fechaCreacion: new Date(),
          ultimoAcceso: new Date(),
        };
        const userDocRef = doc(this.firestore, `usuarios/${result.user.uid}`);
        await setDoc(userDocRef, userProfile);
        await this.showToast('¡Cuenta creada exitosamente!', 'success');

        if (userData.role === 'docente') {
          await this.router.navigate(['/tabs/docente']);
        } else {
          await this.router.navigate(['/tabs/estudiante']);
        }
      }
    } catch (error: any) {
      await this.handleAuthError(error);
      throw error;
    }
  }

  async getUserProfileByUid(uid: string): Promise<UserProfile | null> {
    const userDocRef = doc(this.firestore, `usuarios/${uid}`);
    const userDoc = await getDoc(userDocRef);
    return userDoc.exists() ? (userDoc.data() as UserProfile) : null;
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      await this.storage.clear();
      await this.router.navigate(['/login']);
      await this.showToast('Sesión cerrada exitosamente', 'success');
    } catch (error) {
      console.error('Error logout:', error);
      await this.showToast('Error al cerrar sesión', 'danger');
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
      await this.showToast('Email de recuperación enviado', 'success');
    } catch (error: any) {
      await this.handleAuthError(error);
      throw error;
    }
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUser$;
  }

  async getCurrentUserProfile(): Promise<UserProfile | null> {
    const user = this.currentUserSubject.value;
    if (user) {
      const userDocRef = doc(this.firestore, `usuarios/${user.uid}`);
      const userDoc = await getDoc(userDocRef);
      return userDoc.exists() ? (userDoc.data() as UserProfile) : null;
    }
    return null;
  }

  private async updateLastAccess(uid: string): Promise<void> {
    try {
      const userDocRef = doc(this.firestore, `usuarios/${uid}`);
      await updateDoc(userDocRef, { ultimoAcceso: new Date() });
    } catch (error) {
      console.log('Error updating last access:', error);
    }
  }

  private async handleAuthError(error: any): Promise<void> {
    let message = 'Ha ocurrido un error inesperado';
    switch (error.code) {
      case 'auth/user-not-found':
        message = 'No existe una cuenta con este email';
        break;
      case 'auth/wrong-password':
        message = 'Contraseña incorrecta';
        break;
      case 'auth/email-already-in-use':
        message = 'Ya existe una cuenta con este email';
        break;
      case 'auth/weak-password':
        message = 'La contraseña debe tener al menos 6 caracteres';
        break;
      case 'auth/invalid-email':
        message = 'Email inválido';
        break;
      case 'auth/network-request-failed':
        message = 'Error de conexión. Verifica tu internet';
        break;
      default:
        message = error.message || 'Error de autenticación';
    }
    await this.showToast(message, 'danger');
  }

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color,
    });
    await toast.present();
  }
}
