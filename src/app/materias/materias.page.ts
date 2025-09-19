import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { MateriasService, Materia } from '../services/materias.service';
import { AuthService } from '../services/auth.service';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonButtons,
  IonIcon,
  IonInput,
  IonModal,
} from '@ionic/angular/standalone';
import { logOutOutline } from 'ionicons/icons';

@Component({
  selector: 'app-materias',
  templateUrl: './materias.page.html',
  styleUrls: [],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonButtons,
    IonIcon,
    IonInput,
    IonModal,
  ],
})
export class MateriasPage implements OnInit {
  materias: Materia[] = [];
  periodoActual: string = '2024-1';
  logOutIcon = logOutOutline;

  // Para modales inline
  isAddModalOpen = false;
  isEditModalOpen = false;
  currentMateria: Partial<Materia> = {};

  constructor(
    private materiasService: MateriasService,
    private authService: AuthService,
    private toastController: ToastController,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.loadMaterias();
    this.inicializarMateriasDemo();
  }

  async cerrarSesion() {
    await this.ngZone.run(async () => {
      await this.authService.logout();
    });
  }

  private async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 2000,
      position: 'top',
    });
    await toast.present();
  }

  async loadMaterias() {
    try {
      const materias = await this.materiasService.getMaterias();
      this.ngZone.run(() => (this.materias = materias));
    } catch (err) {
      console.error(err);
      this.ngZone.run(() => (this.materias = []));
      await this.presentToast('Error al cargar materias', 'danger');
    }
  }

  async inicializarMateriasDemo() {
    const materias = await this.materiasService.getMaterias();
    if (materias.length === 0) {
      const demo: Materia = {
        codigo: 'ING101',
        nombre: 'Matemáticas Básicas',
        creditos: 3,
        docente: 'Juan Pérez',
        periodo: this.periodoActual,
        color: '#2196F3',
        usuarioId: 'demo',
        fechaCreacion: new Date(),
        activa: true,
      };
      await this.materiasService.addMateria(demo);
      await this.loadMaterias();
      await this.presentToast('Materia de ejemplo agregada', 'success');
    }
  }

  openAddModal() {
    this.currentMateria = { creditos: 3 }; // default
    this.isAddModalOpen = true;
  }

  async saveNewMateria() {
    if (
      !this.currentMateria.codigo ||
      !this.currentMateria.nombre ||
      !this.currentMateria.docente ||
      this.currentMateria.creditos === undefined
    ) {
      await this.presentToast('Todos los campos son obligatorios', 'danger');
      return;
    }

    await this.ngZone.run(async () => {
      await this.materiasService.addMateria({
        codigo: this.currentMateria.codigo!.toUpperCase(), 
        nombre: this.currentMateria.nombre!,
        creditos: this.currentMateria.creditos!,
        docente: this.currentMateria.docente!,
        periodo: this.periodoActual,
        color: '#2196F3',
        usuarioId: 'demo',
        fechaCreacion: new Date(),
        activa: true,
      });
      await this.loadMaterias();
      this.isAddModalOpen = false;
      await this.presentToast('Materia agregada', 'success');
    });
  }

  openEditModal(materia: Materia) {
    this.currentMateria = { ...materia };
    this.isEditModalOpen = true;
  }

  async saveEditMateria() {
    if (!this.currentMateria.id) return;

    await this.ngZone.run(async () => {
      await this.materiasService.updateMateria(this.currentMateria.id!, {
        nombre: this.currentMateria.nombre!,
        docente: this.currentMateria.docente!,
        creditos: this.currentMateria.creditos!,
      });
      await this.loadMaterias();
      this.isEditModalOpen = false;
      await this.presentToast('Materia actualizada', 'success');
    });
  }

  async eliminarMateria(id: string) {
    await this.materiasService.deleteMateria(id);
    await this.loadMaterias();
    await this.presentToast('Materia eliminada', 'warning');
  }
}
