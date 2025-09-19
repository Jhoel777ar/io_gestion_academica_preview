import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  IonModal,
  IonInput,
  IonAlert
} from '@ionic/angular/standalone';
import { MateriasService, Materia } from '../services/materias.service';
import { AuthService, UserProfile } from '../services/auth.service';
import { GradesService } from '../services/grades.service';
import { InscripcionesService } from '../services/inscripciones.service';

@Component({
  selector: 'app-docente',
  templateUrl: './docente.page.html',
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
    IonModal,
    IonInput,
    IonAlert
  ],
})
export class DocentePage implements OnInit {
  materias: Materia[] = [];
  uid: string | null = null;

  isAddModalOpen = false;
  isEditModalOpen = false;
  isGradesModalOpen = false;

  newMateria: Partial<Materia> = { nombre: '', codigo: '', creditos: 3 };
  editMateria: Partial<Materia> = {};

  currentMateria: Materia | null = null;
  notasMateria: { id?: string; estudiante: UserProfile; nota: number }[] = [];

  alertButtons = ['OK'];
  alertHeader = '';
  alertMessage = '';
  alertTriggerId = 'present-alert';

  constructor(
    private materiasService: MateriasService,
    private authService: AuthService,
    private gradesService: GradesService,
    private inscripcionesService: InscripcionesService,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.authService.getCurrentUser().subscribe((user) => {
      if (user) {
        this.uid = user.uid;
        this.loadMaterias();
      }
    });
  }

  async loadMaterias() {
    if (!this.uid) return;
    const ms = await this.materiasService.getMateriasByUsuario(this.uid);
    this.ngZone.run(() => (this.materias = ms));
  }

  setAddModalOpen(isOpen: boolean) {
    this.isAddModalOpen = isOpen;
    if (!isOpen) this.newMateria = { nombre: '', codigo: '', creditos: 3 };
  }

  async guardarMateria() {
    if (!this.uid || !this.newMateria.nombre) return;
    const perfil = await this.authService.getUserProfileByUid(this.uid);
    await this.materiasService.addMateria({
      codigo: this.newMateria.codigo || 'COD',
      nombre: this.newMateria.nombre,
      creditos: this.newMateria.creditos || 3,
      docente: perfil?.nombre || 'Docente',
      periodo: '2025-1',
      usuarioId: this.uid,
      fechaCreacion: new Date(),
      activa: true,
    });
    this.alertHeader = 'Éxito';
    this.alertMessage = 'Materia agregada correctamente';
    this.isAddModalOpen = false;
    await this.loadMaterias();
  }

  setEditModalOpen(isOpen: boolean, m?: Materia) {
    this.isEditModalOpen = isOpen;
    if (isOpen && m) this.editMateria = { ...m };
  }

  async actualizarMateria() {
    if (!this.editMateria.id || !this.editMateria.nombre) return;
    await this.materiasService.updateMateria(this.editMateria.id, { nombre: this.editMateria.nombre });
    this.alertHeader = 'Éxito';
    this.alertMessage = 'Materia actualizada correctamente';
    this.setEditModalOpen(false);
    await this.loadMaterias();
  }

  async eliminarMateria(id: string) {
    const confirmed = confirm('¿Desea eliminar esta materia?');
    if (!confirmed) return;
    await this.materiasService.deleteMateria(id);
    await this.loadMaterias();
  }

  setGradesModalOpen(isOpen: boolean, m?: Materia) {
    this.isGradesModalOpen = isOpen;
    if (isOpen && m) {
      this.currentMateria = m;
      this.cargarNotas(m.id!);
    } else {
      this.currentMateria = null;
      this.notasMateria = [];
    }
  }

  private async cargarNotas(materiaId: string) {
    const inscripciones = await this.inscripcionesService.getInscripcionesByMateria(materiaId);
    const estudiantes: UserProfile[] = [];
    for (const insc of inscripciones) {
      const perfil = await this.authService.getUserProfileByUid(insc.estudianteId);
      if (perfil) estudiantes.push(perfil);
    }

    const notasExistentes = await this.gradesService.getGradesByMateria(materiaId);

    this.ngZone.run(() => {
      this.notasMateria = estudiantes.map((e) => {
        const notaExistente = notasExistentes.find((n) => n.estudianteId === e.uid);
        return { id: notaExistente?.id, estudiante: e, nota: notaExistente ? notaExistente.nota : 0 };
      });
    });
  }

  async actualizarNota(notaItem: { id?: string; estudiante: UserProfile; nota: number }) {
    if (!this.currentMateria) return;

    if (notaItem.id) {
      await this.gradesService.updateGrade(notaItem.id, { nota: notaItem.nota });
      this.alertHeader = 'Actualización';
      this.alertMessage = `Nota de ${notaItem.estudiante.nombre} actualizada`;
    } else {
      await this.gradesService.addGrade({
        estudianteId: notaItem.estudiante.uid,
        materiaId: this.currentMateria.id!,
        nota: notaItem.nota,
        creadoPor: this.uid || undefined,
      });
      this.alertHeader = 'Éxito';
      this.alertMessage = `Nota de ${notaItem.estudiante.nombre} registrada`;
    }
  }

  async cerrarSesion() {
    await this.authService.logout();
  }
}
