import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  AlertController,
} from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';
import {
  InscripcionesService,
  Inscripcion,
} from '../services/inscripciones.service';
import { GradesService, Grade } from '../services/grades.service';
import { MateriasService, Materia } from '../services/materias.service';
import { getDoc, doc, Firestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-estudiante',
  templateUrl: './estudiante.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonButtons,
  ],
})
export class EstudiantePage implements OnInit {
  uid: string | null = null;
  misMaterias: (Materia & { docenteNombre?: string })[] = [];
  todasMaterias: (Materia & { docenteNombre?: string })[] = [];
  calificaciones: {
    materiaNombre: string;
    nota: number;
    docenteNombre: string;
  }[] = [];

  constructor(
    private authService: AuthService,
    private inscripcionesService: InscripcionesService,
    private gradesService: GradesService,
    private materiasService: MateriasService,
    private ngZone: NgZone,
    private firestore: Firestore,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.authService.getCurrentUser().subscribe(async (user) => {
      if (user) {
        this.uid = user.uid;
        await this.loadInscripciones();
        await this.loadCalificaciones();
        await this.loadTodasMaterias();
      }
    });
  }

  async loadInscripciones() {
    if (!this.uid) return;
    const ins = (await this.inscripcionesService.getInscripcionesByStudent(
      this.uid
    )) as Partial<Inscripcion>[];

    const materiasArr: (Materia & { docenteNombre?: string })[] = [];

    for (const item of ins) {
      if (!item.materiaId) continue;

      const mDoc = await getDoc(
        doc(this.firestore, `materias/${item.materiaId}`)
      );
      if (mDoc.exists()) {
        const data = mDoc.data() as Partial<Materia>;
        let docenteNombre = 'Docente desconocido';

        if (data.usuarioId) {
          const dDoc = await getDoc(
            doc(this.firestore, `usuarios/${data.usuarioId}`)
          );
          if (dDoc.exists()) {
            const dData = dDoc.data() as any;
            docenteNombre = dData.nombre ?? 'Docente sin nombre';
          }
        }

        materiasArr.push({
          ...data,
          id: mDoc.id,
          nombre: data.nombre ?? 'Sin nombre',
          codigo: data.codigo ?? '---',
          docenteNombre,
        } as Materia & { docenteNombre?: string });
      }
    }

    this.ngZone.run(() => (this.misMaterias = materiasArr));
  }

  async loadTodasMaterias() {
    const ms = await this.materiasService.getMaterias();
    const materiasConDocente: (Materia & { docenteNombre?: string })[] = [];

    for (const m of ms) {
      if (!m.activa) continue;
      if (this.misMaterias.some((mm) => mm.id === m.id)) continue;

      let docenteNombre = 'Docente desconocido';
      if (m.usuarioId) {
        const dDoc = await getDoc(
          doc(this.firestore, `usuarios/${m.usuarioId}`)
        );
        if (dDoc.exists()) {
          const dData = dDoc.data() as any;
          docenteNombre = dData.nombre ?? 'Docente sin nombre';
        }
      }

      materiasConDocente.push({ ...m, docenteNombre });
    }

    this.ngZone.run(() => (this.todasMaterias = materiasConDocente));
  }

  async loadCalificaciones() {
    if (!this.uid) return;
    const cs = (await this.gradesService.getGradesByStudent(
      this.uid
    )) as Partial<Grade>[];

    const calificacionesConNombre: {
      materiaNombre: string;
      nota: number;
      docenteNombre: string;
    }[] = [];

    for (const c of cs) {
      if (!c.materiaId) continue;

      let nombreMateria = 'Materia desconocida';
      let docenteNombre = 'Docente desconocido';
      let nota = c.nota ?? 0;

      const mDoc = await getDoc(doc(this.firestore, `materias/${c.materiaId}`));
      if (mDoc.exists()) {
        const data = mDoc.data() as Partial<Materia>;
        nombreMateria = data.nombre ?? 'Materia sin nombre';

        if (data.usuarioId) {
          const dDoc = await getDoc(
            doc(this.firestore, `usuarios/${data.usuarioId}`)
          );
          if (dDoc.exists()) {
            const dData = dDoc.data() as any;
            docenteNombre = dData.nombre ?? 'Docente sin nombre';
          }
        }
      }

      calificacionesConNombre.push({
        materiaNombre: nombreMateria,
        nota,
        docenteNombre,
      });
    }

    this.ngZone.run(() => (this.calificaciones = calificacionesConNombre));
  }

  private async presentAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  async inscribirse(materiaId?: string) {
    if (!materiaId || !this.uid) return;

    const actuales = (await this.inscripcionesService.getInscripcionesByStudent(
      this.uid
    )) as Inscripcion[];
    if (actuales.find((i) => i.materiaId === materiaId)) {
      await this.presentAlert('Atención', 'Ya estás inscrito en esta materia');
      return;
    }

    await this.inscripcionesService.enroll(materiaId, this.uid);
    await this.presentAlert('Éxito', 'Inscripción exitosa');

    await this.loadInscripciones();
    await this.loadTodasMaterias();
  }

  async cerrarSesion() {
    await this.authService.logout();
  }
}
