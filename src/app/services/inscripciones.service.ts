import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
} from '@angular/fire/firestore';

export interface Inscripcion {
  id?: string;
  materiaId: string;
  estudianteId: string;
  fecha?: Date;
}

@Injectable({ providedIn: 'root' })
export class InscripcionesService {
  private collectionName = 'inscripciones';
  constructor(private firestore: Firestore) {}

  async enroll(materiaId: string, estudianteId: string): Promise<void> {
    await addDoc(collection(this.firestore, this.collectionName), {
      materiaId,
      estudianteId,
      fecha: new Date(),
    });
  }

  async getInscripcionesByStudent(estudianteId: string) {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('estudianteId', '==', estudianteId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async getInscripcionesByMateria(materiaId: string) {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('materiaId', '==', materiaId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Inscripcion[];
  }

  async unenroll(inscripcionId: string) {
    const ref = doc(this.firestore, `${this.collectionName}/${inscripcionId}`);
    await deleteDoc(ref);
  }
}
